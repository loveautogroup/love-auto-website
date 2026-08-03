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
 *   2. KV snapshot (workers/inventory-sync) -- ONLY if it is recent enough
 *      to still be true. See KV_MAX_AGE_MS.
 *   3. 204 No Content. Client falls back to its build-time snapshot.
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
 * Degradation is visible on every response via X-Inventory-Source, plus
 * X-Inventory-KV-Age-Seconds / X-Inventory-KV-Synced-At when KV was
 * consulted. In-body, the live path is syncedBy:"live-dms" and the KV path
 * is syncedBy:"cron" -- the seam useInventory already reads.
 *
 * On any DMS shape change the adapter at src/lib/inventoryAdapter.ts
 * carries the conversion. Wire format here mirrors what the cron worker
 * already writes to KV so consumers don't need a code change.
 */

import { vehicleSlug } from "../../shared/slug";
import { displayCase, dedupeTrim } from "../../shared/displayCase";

interface Env {
  INVENTORY?: KVNamespace;
}

const KV_KEY_CURRENT = "inventory:current";
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

/**
 * How old the KV snapshot may be before we refuse to pass it off as current.
 *
 * workers/inventory-sync is supposed to write it on a 15-minute cron, so 6h
 * is 24 consecutive missed cycles -- unambiguously a broken pipeline, not a
 * blip. It is also roughly the longest a car sold this morning may keep
 * being advertised this afternoon.
 *
 * In practice this rejects the snapshot every time, and that is correct:
 * that worker parses the RETIRED DealerCenter feed (PARSER="stub", last
 * deployed 2026-04-24) and its upstream fetch throws on every run, so the
 * KV write never executes and the snapshot has been frozen since roughly
 * 2026-07-17. The tier is dead. It is kept rather than deleted because the
 * check is what makes it safe: repoint that worker at the DMS and this
 * fallback starts working again on its own, with no change here.
 */
const KV_MAX_AGE_MS = 6 * 60 * 60 * 1_000;

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
  const images = ordered.map((p) => p.url).filter(Boolean);

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
    price: Number(v.retailPrice) || 0,
    status: mapStatus(v.status),
    features: Array.isArray(v.features) ? v.features.filter((f) => typeof f === "string") : [],
    daysOnLot: Number(v.daysOnLot) || 0,
    dateInStock: v.dateInStock ?? "",
    images,
    dealerCenterFirstSeen: "",
    dealerCenterLastSeen: "",
    description: v.description ?? undefined,
    recentlyReduced: Boolean(v.recently_reduced),
    bakedHeroUrl: v.bakedHeroUrl ?? null,
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
      // Only surface vehicles Jeremiah has explicitly marked Listed (available)
      // or Sale Pending. Coming Soon / In Recon vehicles stay off the public site.
      .filter((v) => v.status === "available" || v.status === "sale-pending");
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
    // to the KV/build-time tiers rather than publishing an empty lot.
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

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  // Allow cache-busting for admin/debug — append ?fresh=1 to bypass edge cache.
  const url = new URL(request.url);
  const isFresh = url.searchParams.get("fresh") === "1";

  // 1. Try live DMS first.
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

  // 2. Fall back to the KV snapshot -- but ONLY if it is recent enough to
  //    still be true. Serving an old snapshot as current is exactly how sold
  //    cars stay advertised. An unusable snapshot is worse than no snapshot:
  //    falling through to 204 hands the client its build-time data, which
  //    since 1ecf2dc is verified live at deploy time and is therefore the
  //    fresher of the two. Refusing here is choosing the better source, not
  //    failing.
  let kvDiag: Record<string, string> = {};
  let kvStaleRejected = false;

  if (env.INVENTORY) {
    try {
      const raw = (await env.INVENTORY.get(KV_KEY_CURRENT, {
        type: "json",
      })) as Partial<InventorySnapshot> | null;

      if (raw) {
        const stamp = raw.syncedAt ? Date.parse(raw.syncedAt) : NaN;
        // A snapshot whose timestamp we cannot read has an UNKNOWN age, and
        // unknown is not the same as fresh. Treat it as stale.
        const ageMs = Number.isFinite(stamp) ? Date.now() - stamp : Infinity;
        kvDiag = {
          "X-Inventory-KV-Synced-At": raw.syncedAt ?? "unknown",
          "X-Inventory-KV-Age-Seconds": Number.isFinite(ageMs)
            ? String(Math.round(ageMs / 1000))
            : "unknown",
        };

        if (ageMs <= KV_MAX_AGE_MS) {
          return new Response(JSON.stringify(raw), {
            status: 200,
            headers: {
              "Content-Type": "application/json; charset=utf-8",
              "Cache-Control": isFresh
                ? "no-store"
                : "public, max-age=15, s-maxage=30, stale-while-revalidate=300",
              "X-Inventory-Source": "kv-fallback",
              ...kvDiag,
              ...corsHeaders(),
            },
          });
        }

        kvStaleRejected = true;
        console.error(
          "[/api/inventory] DEGRADED -- refusing to serve a stale KV " +
            `snapshot as current. syncedAt=${raw.syncedAt ?? "unknown"} ` +
            `age=${kvDiag["X-Inventory-KV-Age-Seconds"]}s ` +
            `limit=${KV_MAX_AGE_MS / 1000}s. The client will fall back to its ` +
            "build-time snapshot. Check Railway first " +
            "(https://web-production-d5f3a.up.railway.app/healthz), then " +
            "workers/inventory-sync -- it still parses the retired " +
            "DealerCenter feed and has not written since ~2026-07-17."
        );
      } else {
        kvDiag = { "X-Inventory-KV-Age-Seconds": "absent" };
      }
    } catch (err) {
      console.error("[/api/inventory] KV read failed:", err);
      kvDiag = { "X-Inventory-KV-Age-Seconds": "error" };
    }
  }

  // 3. Nothing trustworthy. 204 tells the client to keep its build-time
  //    snapshot -- which is real inventory, verified at deploy time, not an
  //    error page. Short edge cache so a Railway outage does not make every
  //    single page view pay the full cold-start wait, while still letting us
  //    recover within ~30s of the DMS coming back.
  return new Response(null, {
    status: 204,
    headers: {
      "X-Inventory-Source": kvStaleRejected ? "kv-stale-rejected" : "none",
      ...kvDiag,
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

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });
