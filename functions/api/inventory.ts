/**
 * Public GET /api/inventory
 *
 * Proxy to the live DMS public inventory endpoint
 * (https://dms.loveautogroup.net/api/v1/public/inventory).
 *
 * Why a proxy and not a direct browser fetch?
 *   - DMS sets CORS open, but routing through this Pages Function lets
 *     us cache aggressively at Cloudflare's edge (60s s-maxage), shape
 *     the response into the InventorySnapshot envelope the React app
 *     already expects, and keep a single point of control if the DMS
 *     URL ever changes.
 *
 * Fallback chain:
 *   1. Live DMS fetch (preferred). Two attempts -- a short warm one and a
 *      long cold-start one. On 200 with at least one vehicle, normalize to
 *      InventorySnapshot and return.
 *   2. 204 No Content. Client falls back to its build-time snapshot, which
 *      since 1ecf2dc is live-verified at deploy and ships WITH the site.
 *
 * A KV tier used to sit between those two (workers/inventory-sync writing
 * `inventory:current`). RETIRED 2026-08-03. That worker parsed the
 * DealerCenter feed, retired as a source 2026-06-04, so it had not written
 * since ~2026-07-17 and the staleness check rejected its snapshot on every
 * request anyway -- removing it changes no observable behaviour, it deletes a
 * tier that already never served. What it sat in front of is strictly better:
 * the build-time snapshot cannot be unavailable while the site is up, and is
 * verified live at deploy. Do not reintroduce a KV mirror without a writer
 * that is actually running; a stale-able tier in front of a non-stale one is
 * a downgrade, not a safety net.
 *
 * NEVER SERVE STALE AS CURRENT (2026-08-03). This endpoint used to give the
 * DMS 5s and then quietly serve whatever was in KV, at any age. Railway
 * cold-starts run 15-25s, so a hibernating DMS reliably lost that race and
 * the KV snapshot -- frozen since ~2026-07-17 -- was served as if live. The
 * 2026-08-03 build read this endpoint and baked 5 already-sold cars into
 * sitemap.xml while omitting the newest car entirely.
 *
 * Two rules came out of that, and they are the point of this file:
 *   - Try much harder to be fresh (stage the timeouts, retry, never believe
 *     an empty 200).
 *   - When we cannot be fresh, say so out loud and hand the client a source
 *     we can vouch for, instead of dressing old data up as current.
 *
 * Degradation is visible on every response via X-Inventory-Source:
 * "live-dms" when we served fresh data, "none" when we could not and the
 * client should keep its build-time snapshot. In-body, the live path is
 * syncedBy:"live-dms" -- the seam useInventory already reads.
 *
 * On any DMS shape change the adapter at src/lib/inventoryAdapter.ts
 * carries the conversion. The wire format is the InventorySnapshot /
 * SyncedVehicle shape src/lib/inventoryAdapter.ts declares -- it originally
 * mirrored the retired cron worker's types, and that file is now the only
 * definition consumers need to track.
 */

import { vehicleSlug } from "../../shared/slug";
import { displayCase, dedupeTrim } from "../../shared/displayCase";
import { rewritePhotoHost } from "../../shared/photoHost";
import { safeDescription } from "../../shared/descriptionGuard";

const DMS_URL = "https://dms.loveautogroup.net/api/v1/public/inventory";

/**
 * Timeouts. Railway free-tier hibernates and a cold start runs 15-25s
 * (measured 2026-08-03), which a single 5s attempt cannot survive.
 *
 * Staged rather than one long timeout:
 *   - Attempt 1 (3s) covers the normal warm case, where the DMS answers in
 *     well under a second. The common path is no slower than it is today.
 *   - Attempt 2 (20s) runs only when attempt 1 already failed -- i.e. the
 *     DMS is cold. Attempt 1's connection is itself what wakes the Railway
 *     container, so the boot is already underway when attempt 2 starts.
 *
 * Worst case ~23s, which is affordable HERE SPECIFICALLY because this fetch
 * is a background upgrade, not a page-blocking load: useInventory() renders
 * the build-time snapshot immediately and swaps in live data when this
 * resolves. No customer is watching a spinner wait on us. And a sustained
 * outage costs 23s only for the first request per PoP -- the degraded reply
 * is edge-cached for 30s, so everyone behind it is served instantly.
 */
const DMS_WARM_TIMEOUT_MS = 3_000;
const DMS_COLD_TIMEOUT_MS = 20_000;

// SEED_SLUGS_BY_VIN now lives in shared/slug.ts. vehicleSlug() handles the
// override → auto-slug fallback. Don't add overrides here — add them once
// in shared/slug.ts and all three callers see the change.

interface DmsPhoto {
  url: string;
  isPrimary?: boolean;
}

interface DmsVehicle {
  id: string | number;
  vin: string;
  stockNumber?: string;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  mileage?: number | null;
  retailPrice?: number | null;
  exteriorColor?: string | null;
  interiorColor?: string | null;
  bodyStyle?: string | null;
  drivetrain?: string | null;
  transmission?: string | null;
  fuelType?: string | null;
  engine?: string | null;
  description?: string | null;
  status?: string | null;
  soldDate?: string | null;
  daysOnLot?: number | null;
  features?: string[] | null;
  photos?: DmsPhoto[] | null;
  dateInStock?: string | null;
  // True if asking_price decreased in the last 14 days (DMS public feed
  // reads this from VehiclePriceHistory). Optional — older deploys omit
  // the field, treat absent as false for back-compat.
  recently_reduced?: boolean | null;
  // Baked hero URL with all badges composited in (used as thumbnail on cards).
  bakedHeroUrl?: string | null;
  // E1: AS-IS disclosure flag + seller-disclosed defects. The DMS mirror
  // emits these camelCase (it converts Railway's as_is/known_issues).
  asIs?: boolean | null;
  knownIssues?: string | null;
}

interface DmsResponse {
  data: DmsVehicle[];
  count?: number;
}

interface SyncedVehicle {
  vin: string;
  stockNumber?: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  bodyStyle: string;
  drivetrain: string;
  transmission: string;
  fuelType: string;
  engine: string;
  exteriorColor: string;
  interiorColor: string;
  mileage: number;
  price: number;
  status: "available" | "sale-pending" | "sold" | "coming-soon";
  features: string[];
  daysOnLot: number;
  dateInStock: string;
  images: string[];
  dealerCenterFirstSeen: string;
  dealerCenterLastSeen: string;
  description?: string;
  recentlyReduced?: boolean;
  bakedHeroUrl?: string | null;
  /** E1 — AS-IS flag + disclosed defects, passed through to the site's
   *  inventoryAdapter (which already declares both fields). */
  asIs?: boolean;
  knownIssues?: string | null;
}

interface InventorySnapshot {
  syncedAt: string;
  syncedBy: "cron" | "manual" | "live-dms";
  vehicles: SyncedVehicle[];
}

function mapStatus(
  raw: string | null | undefined
): "available" | "sale-pending" | "sold" | "coming-soon" {
  const s = (raw ?? "").toString().trim().toLowerCase();
  if (s === "sale pending" || s === "sale-pending" || s === "deal pending" || s === "deal_pending") {
    return "sale-pending";
  }
  if (s === "sold") return "sold";
  // IN_RECON cars come through as "Coming Soon" from the DMS public route.
  // We surface them on the website with a Coming Soon badge so customers can
  // submit interest before the car hits retail-ready.
  if (s === "coming soon" || s === "coming-soon" || s === "in_recon" || s === "in recon") {
    return "coming-soon";
  }
  // Default to available for "Available", "RETAIL_READY", "" etc.
  return "available";
}

function adaptDmsVehicle(v: DmsVehicle): SyncedVehicle {
  // E3: showroom-correct casing (SLK350 / MKZ / CX-3, not Slk350 / Mkz /
  // Cx-3) + kill the "Boxster Boxster" model-repeated-in-trim class.
  // vehicleSlug(v) below still receives the RAW row — slugs never move.
  const make = displayCase(v.make ?? "");
  const model = displayCase(v.model ?? "");
  const trim = v.trim ? dedupeTrim(model, displayCase(v.trim)) : "";
  const stockNumber = v.stockNumber ? String(v.stockNumber) : "";
  // Shared slug computer — see shared/slug.ts. Honors SEED_SLUGS_BY_VIN.
  const slug = vehicleSlug(v);
  const photos = Array.isArray(v.photos) ? v.photos : [];
  // Sort primary photo first, preserve relative order otherwise.
  const ordered = [...photos];
  ordered.sort((a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)));
  // Found in the website audit: this fed the client-side live-hydration
  // path (VDPLivePrice/VDPLiveMileage/VDPLiveStatus/VDPLivePhotos, the
  // inventory grid cards) with raw, unrewritten r2.dev URLs — the same
  // rate-limited host the outbound marketing feeds already rewrite away
  // from. Even after fixing the build-time adapter (src/lib/dmsInventory.ts),
  // this endpoint would have swapped rate-limited URLs back in the moment
  // the client hydrated.
  const images = ordered
    .map((p) => rewritePhotoHost(p.url))
    .filter((url): url is string => Boolean(url));

  const price = Number(v.retailPrice) || 0;

  return {
    vin: v.vin,
    stockNumber,
    slug,
    year: Number(v.year) || 0,
    make,
    model,
    trim,
    bodyStyle: v.bodyStyle ?? "",
    drivetrain: v.drivetrain ?? "",
    transmission: v.transmission ?? "",
    fuelType: v.fuelType ?? "",
    engine: v.engine ?? "",
    exteriorColor: v.exteriorColor ?? "",
    interiorColor: v.interiorColor ?? "",
    mileage: Number(v.mileage) || 0,
    price,
    status: mapStatus(v.status),
    soldDate: v.soldDate ?? null,
    features: Array.isArray(v.features) ? v.features.filter((f) => typeof f === "string") : [],
    daysOnLot: Number(v.daysOnLot) || 0,
    dateInStock: v.dateInStock ?? "",
    images,
    dealerCenterFirstSeen: "",
    dealerCenterLastSeen: "",
    // Found in the website audit: see shared/descriptionGuard.ts.
    description: safeDescription(v.description ?? undefined, price) ?? undefined,
    recentlyReduced: Boolean(v.recently_reduced),
    bakedHeroUrl: rewritePhotoHost(v.bakedHeroUrl) ?? null,
    // E1: default asIs to TRUE — every Love Auto vehicle is sold as-is;
    // the flag only goes false if the DMS explicitly says so.
    asIs: v.asIs ?? true,
    knownIssues:
      typeof v.knownIssues === "string" && v.knownIssues.trim() !== ""
        ? v.knownIssues
        : null,
  };
}

/** One attempt. null = "could not read the lot". A successful read may still
 *  be empty; fetchDms() below decides whether to believe that. */
async function fetchDmsOnce(
  timeoutMs: number,
  attempt: number
): Promise<InventorySnapshot | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  // Attempt 1 keeps the plain URL so it shares one edge-cache entry across
  // all visitors. The retry MUST use a different key: a 200-but-empty
  // throttle response is perfectly cacheable, and replaying it would defeat
  // the whole retry. FastAPI ignores unknown query params (verified
  // 2026-08-03, byte-identical body).
  const url = attempt === 1 ? DMS_URL : `${DMS_URL}?_retry=${attempt}`;
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      // Only the warm attempt is worth caching at the edge. The cold-start
      // recovery path wants the truth, not a 60s-old answer.
      cf:
        attempt === 1
          ? { cacheTtl: 60, cacheEverything: true }
          : { cacheTtl: 0 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.warn(
        `[/api/inventory] attempt ${attempt} -- DMS upstream non-OK:`,
        res.status
      );
      return null;
    }
    const json = (await res.json()) as DmsResponse;
    if (!json || !Array.isArray(json.data)) {
      console.warn(
        `[/api/inventory] attempt ${attempt} -- DMS upstream malformed payload`
      );
      return null;
    }
    const vehicles = json.data
      .filter((v) => v && v.vin && v.year && v.make && v.model)
      .map(adaptDmsVehicle)
      // Listed (available), Sale Pending, and cars SOLD in the last 30 days.
      // Coming Soon / In Recon vehicles stay off the public site.
      //
      // Sold is here so a recently-sold car still gets a real VDP — a link from
      // CarGurus, a text or a bookmark should land on the car, not a dead end
      // (Jeremiah, 2026-08-25). Railway decides the 30-day window; this feed
      // just carries what it sends.
      //
      // It does NOT put sold cars in the storefront: InventoryGrid.tsx and
      // inventory/page.tsx both filter `status !== "sold"`, and sitemap.ts
      // indexes only available/sale-pending. Those are the display gates and
      // they are deliberately separate from this one.
      .filter(
        (v) =>
          v.status === "available" ||
          v.status === "sale-pending" ||
          v.status === "sold"
      );
    return {
      syncedAt: new Date().toISOString(),
      syncedBy: "live-dms",
      vehicles,
    };
  } catch (err) {
    console.warn(
      `[/api/inventory] attempt ${attempt} -- DMS upstream fetch failed:`,
      err
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Warm attempt, then a cold-start attempt. Returns null only when both
 * failed to produce a believable lot.
 */
async function fetchDms(): Promise<InventorySnapshot | null> {
  const stages = [DMS_WARM_TIMEOUT_MS, DMS_COLD_TIMEOUT_MS];
  for (let i = 0; i < stages.length; i++) {
    const snap = await fetchDmsOnce(stages[i], i + 1);
    // ZERO IS NOT AN ANSWER. Railway's shared read rate-limit returns an
    // empty 200 under throttle, so "the lot is empty" and "you got
    // throttled" are identical on the wire. Love Auto always has stock, so
    // retry rather than believe it -- and if the retry agrees, fall through
    // to the build-time snapshot rather than publishing an empty lot.
    if (snap && snap.vehicles.length > 0) return snap;
    if (i === 0) {
      console.warn(
        "[/api/inventory] warm attempt failed or empty; retrying with the " +
          "cold-start timeout"
      );
    }
  }
  return null;
}

export const onRequestGet: PagesFunction = async ({ request }) => {
  // Allow cache-busting for admin/debug — append ?fresh=1 to bypass edge cache.
  const url = new URL(request.url);
  const isFresh = url.searchParams.get("fresh") === "1";

  // 1. Live DMS. This is now the ONLY source this endpoint can vouch for.
  const live = await fetchDms();
  if (live && live.vehicles.length > 0) {
    return new Response(JSON.stringify(live), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": isFresh
          ? "no-store"
          : "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
        "X-Inventory-Source": "live-dms",
        ...corsHeaders(),
      },
    });
  }

  // 2. Nothing fresh. 204 tells the client to keep its build-time snapshot --
  //    real inventory, verified at deploy time, not an error page. This is the
  //    same outcome the retired KV tier produced in practice, just without the
  //    detour: the staleness check rejected that snapshot every time.
  //
  //    Short edge cache so a Railway outage does not make every single page
  //    view pay the full cold-start wait, while still letting us recover
  //    within ~30s of the DMS coming back.
  console.error(
    "[/api/inventory] DEGRADED -- no live DMS inventory after " +
      `${DMS_WARM_TIMEOUT_MS}ms + ${DMS_COLD_TIMEOUT_MS}ms. Serving 204; the ` +
      "client keeps its build-time snapshot. Check Railway " +
      "(https://web-production-d5f3a.up.railway.app/healthz)."
  );
  return new Response(null, {
    status: 204,
    headers: {
      "X-Inventory-Source": "none",
      "Cache-Control": isFresh ? "no-store" : "public, max-age=15, s-maxage=30",
      ...corsHeaders(),
    },
  });
};

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });
