/**
 * Shared feed utilities — pull the public inventory snapshot from the
 * DMS, normalize the field set, and provide format-specific renderers.
 *
 * Inputs:
 *   - DMS public inventory: https://dms.loveautogroup.net/api/v1/public/inventory
 *     Already filtered to RETAIL_READY + DEAL_PENDING by the proxy. Maps
 *     to status "Available" / "Sale Pending" in the response.
 *
 * Outputs (rendered by the per-format functions in functions/api/feed/):
 *   - cargurus.xml      — CarGurus-style XML. Also accepted by AutoList,
 *                         Autos Today, MSN Auto, CarZing.
 *   - facebook.csv      — Facebook Marketplace Catalog (Vehicles spec).
 *   - autotrader.csv    — Generic comprehensive CSV. Accepted by
 *                         AutoTrader, BuySellAutoMart, Claz, TrueCar,
 *                         Edmunds, LemonFree, and most "import via CSV"
 *                         onboarding flows.
 *   - google-vehicles.csv — Google Vehicle Listings spec (developers.
 *                         google.com/vehicle-listings). Powers Google
 *                         Search organic vehicle listings + Google
 *                         Vehicle Ads. Free to feed; ads are optional.
 *
 * Format set covers all 8 inventory feeds in Dealer Center's provider
 * list (DC Website, FB Business Page Post, FBAutoPost and Spyne are
 * *posting* tools, not feed destinations; CarsForSale was canceled
 * 2026-04-24) PLUS free off-DC destinations: Google Vehicle Listings,
 * TrueCar, Edmunds, LemonFree, eBay Motors (manual upload), and
 * Carfax.com Listings (already covered by Advantage Dealer subscription).
 *
 * Dealer info is hardcoded for Love Auto Group — feeds need consistent
 * dealer identification across all 3rd-party platforms.
 */

import { vehicleSlug } from "../../shared/slug";
import { rewritePhotoHost } from "../../shared/photoHost";

export const DEALER = {
  name: "Love Auto Group",
  id: "love-auto-group-villa-park-il",
  // Google-assigned store code for the linked Business Profile (GBP
  // Manager, verified Jun 4 2026). GMC store matching requires this
  // exact value in all Google feeds — NOT the human-readable id above.
  googleStoreCode: "06345907979509993852",
  phone: "+16303593643",
  phoneFormatted: "(630) 359-3643",
  email: "loveautogroup@gmail.com",
  street: "735 N Yale Ave",
  city: "Villa Park",
  state: "IL",
  zip: "60181",
  country: "US",
  website: "https://www.loveautogroup.net",
} as const;

const DMS_PUBLIC_INVENTORY_URL =
  "https://dms.loveautogroup.net/api/v1/public/inventory";

export interface FeedPhoto {
  url: string;
  isPrimary?: boolean;
}

export interface FeedVehicle {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  stockNumber?: string | null;
  mileage?: number | null;
  retailPrice?: number | null;
  exteriorColor?: string | null;
  interiorColor?: string | null;
  bodyStyle?: string | null;
  drivetrain?: string | null;
  transmission?: string | null;
  engine?: string | null;
  fuelType?: string | null;
  doors?: number | null;
  description?: string | null;
  status?: string;
  photos?: FeedPhoto[];
  /** Branded hero with badges baked into the pixels (Railway bake). When
   *  present, fetchInventory() swaps it into photos[0] so every feed
   *  ships the branded photo without per-feed changes. */
  bakedHeroUrl?: string | null;
  /** Public VDP slug — built from year-make-model + stock if available. */
  vdpUrl?: string;
}

interface DMSInventoryResponse {
  data?: FeedVehicle[];
}

/**
 * Fetch the DMS public inventory and normalize to FeedVehicle[]. Filters
 * out anything without a VIN or year (those would be malformed records
 * the 3rd-party platforms would reject anyway).
 */
// R2 photo host rewrite moved to shared/photoHost.ts (2026-08) so the
// website's own VDP rendering (src/lib/dmsInventory.ts) uses the identical
// fix instead of maintaining a second, drifted copy — see that module's
// header comment for the full story.

/**
 * Timeouts + retries (2026-08-03). This used to be a single fetch with NO
 * timeout and NO retry. Two ways that bit us:
 *
 *   - Railway free-tier cold starts run 15-25s. With no AbortController the
 *     call just hangs until Cloudflare gives up, and every caller of this
 *     function treats a throw as "the lot is empty" -- see the catch blocks
 *     in functions/api/feed/*, which answer HTTP 200 with an EMPTY feed.
 *     To CarGurus / Google Merchant Center / Facebook, a 200 + empty feed
 *     does not read as "try again later", it reads as "this dealer has zero
 *     cars", which is a delisting risk.
 *
 *   - Railway's shared read rate-limit answers a throttled read with an
 *     empty 200 (CLAUDE.md, S65). That path produced an empty feed too,
 *     silently, from a response that looked perfectly healthy.
 *
 * So: bounded attempts, a warm-then-cold timeout ladder, and a hard refusal
 * to believe an empty upstream. Feed consumers are schedulers, not people --
 * spending 55s worst case to avoid publishing an empty catalog is the right
 * trade. Route handlers no longer answer a read failure with an
 * empty 200: as of 2026-08-03 (Jeremiah's call) a throw out of this
 * function becomes HTTP 503 + Retry-After via feedUnavailable() below, so
 * consumers read "retry later" instead of "this dealer has zero cars".
 * A feed that READ successfully and legitimately filtered to zero rows is
 * still a truthful 200 -- same distinction as the zero-guard above.
 */
const FEED_ATTEMPT_TIMEOUTS_MS = [5_000, 25_000, 25_000];

async function fetchInventoryOnce(
  timeoutMs: number,
  attempt: number
): Promise<FeedVehicle[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  // Attempt 1 keeps the plain URL so scheduled pulls share one edge-cache
  // entry. Retries must bust it -- a 200-but-empty throttle response is
  // cacheable, and replaying it would defeat the retry entirely. FastAPI
  // ignores unknown query params (verified 2026-08-03).
  const url =
    attempt === 1
      ? DMS_PUBLIC_INVENTORY_URL
      : `${DMS_PUBLIC_INVENTORY_URL}?_retry=${attempt}`;
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      cf: (attempt === 1
        ? { cacheTtl: 60 }
        : { cacheTtl: 0 }) as RequestInitCfProperties,
    });
    if (!res.ok) {
      throw new Error(
        `DMS inventory ${res.status}: ${(await res.text()).slice(0, 200)}`
      );
    }
    const json = (await res.json()) as DMSInventoryResponse | FeedVehicle[];
    const items: FeedVehicle[] = Array.isArray(json) ? json : json.data ?? [];
    // ZERO IS NOT AN ANSWER -- see the header comment. This guards the RAW
    // upstream rows, deliberately not the status-filtered result below: zero
    // rows is the throttle signature, whereas rows that all filter out is
    // real data about a genuinely sold-through lot.
    if (items.length === 0) {
      throw new Error("DMS inventory returned ZERO vehicles");
    }
    return items;
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchInventory(): Promise<FeedVehicle[]> {
  let items: FeedVehicle[] | null = null;
  let lastErr: unknown = new Error("no attempt ran");

  for (let attempt = 1; attempt <= FEED_ATTEMPT_TIMEOUTS_MS.length; attempt++) {
    try {
      items = await fetchInventoryOnce(
        FEED_ATTEMPT_TIMEOUTS_MS[attempt - 1],
        attempt
      );
      break;
    } catch (err) {
      lastErr = err;
      console.warn(
        `[feed] inventory attempt ${attempt}/${FEED_ATTEMPT_TIMEOUTS_MS.length} failed:`,
        err
      );
    }
  }

  // Still throws on total failure, exactly as before -- callers already
  // handle it. What changed is how rarely we get here.
  if (!items) throw lastErr;

  return items
    .filter((v) => v.vin && v.year && v.make && v.model)
    .map((v) => ({
      ...v,
      // External platforms get the BRANDED baked hero in slot 0 (badges in
      // the pixels). The raw original stays in the additional images.
      photos: (
        v.bakedHeroUrl && (v.photos?.length ?? 0) > 0
          ? [{ url: v.bakedHeroUrl, isPrimary: true }, ...(v.photos ?? []).slice(1)]
          : v.bakedHeroUrl
          ? [{ url: v.bakedHeroUrl, isPrimary: true }]
          : v.photos
      )?.map((p) => ({ ...p, url: rewritePhotoHost(p.url) ?? p.url })),
      vdpUrl: buildVdpUrl(v),
      // Defensive — the public endpoint should already filter to retail-
      // ready + sale-pending, but in case it ever returns more we double-check.
    }))
    .filter((v) =>
      v.status === "Available" || v.status === "Sale Pending" || v.status == null
    );
}

function buildVdpUrl(v: FeedVehicle): string {
  // Canonical slug from shared/slug.ts — the SAME computer the site, sitemap,
  // and inventory function use, and it honors SEED_SLUGS_BY_VIN. This formula
  // used to be hand-copied here, so feed links 404'd for any seeded vehicle
  // whose DMS data drifted from its SEO-stable slug. Importing the single
  // source of truth removes that drift class entirely.
  return `${DEALER.website}/inventory/${vehicleSlug(v)}/`;
}

// ─────────────────────────────────────────────────────────────────────
// Helpers shared across formats
// ─────────────────────────────────────────────────────────────────────

/** XML-escape a string. Required for CarGurus / Cars.com feeds. */
export function xmlEscape(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/**
 * Quote a value for CSV output. RFC 4180 — wrap in quotes if the value
 * contains a comma, quote, newline, or starts/ends with whitespace;
 * escape internal quotes by doubling them.
 */
export function csvCell(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return "";
  const str = String(s);
  if (/[,"\r\n]/.test(str) || /^\s|\s$/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Standard CORS headers — feeds must be CORS-open so 3rd-party
 *  schedulers fetching from any origin can read them. */
export function feedCorsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

/** Cache hint for feed responses. 5-min edge cache + 1-hour
 *  stale-while-revalidate. 3rd-party crawlers polling more often will
 *  see the cached copy; less often will see fresh on each pull. */
export const FEED_CACHE_HEADER =
  "public, max-age=120, s-maxage=300, stale-while-revalidate=3600";

/**
 * How long a feed consumer should wait before retrying a 503. 300s lines up
 * with the healthy path's s-maxage, is comfortably longer than a Railway cold
 * start (15-25s) or a hibernation wake, and is far shorter than any consumer's
 * normal pull cadence (CarGurus 1-4h, GMC scheduled, DealerCenter nightly), so
 * it never delays recovery past the next scheduled fetch.
 */
export const FEED_UNAVAILABLE_RETRY_SECONDS = 300;

/**
 * "We could not READ the inventory" response (2026-08-03, Jeremiah's call).
 *
 * The distinction this exists to protect:
 *   - could not read the inventory      -> 503, this function
 *   - read it fine, zero rows qualified -> 200 with an empty-but-valid feed
 *
 * The second case is truthful data (e.g. nothing is opted into Google Ads, or
 * every car is sale-pending) and must NOT 503. Call this ONLY from a catch
 * that wraps the upstream read itself, never one that also wraps rendering or
 * filtering.
 *
 * Why 503 and not 500/502: 503 is the only 5xx that means "temporary, come
 * back" and the only one for which Retry-After is defined (RFC 9110 10.2.3).
 * Feed consumers treat 5xx as transient and keep serving their last good pull;
 * they treat a 200 with zero offers as an authoritative empty catalog, which
 * is the delisting risk we are removing.
 *
 * The body is deliberately NOT a valid empty feed. No CSV header row, no XML
 * root element, and text/plain rather than the feed's own content type, so a
 * consumer that ignores the status line still cannot mistake it for a
 * well-formed catalog containing zero vehicles. The upstream error text is
 * logged, never echoed -- these endpoints are public and CORS-open.
 *
 * no-store keeps a 503 out of the Cloudflare edge cache so recovery is visible
 * on the very next pull (the old error path set max-age=30, which meant one
 * failed read could be replayed to other consumers for 30s).
 */
export function feedUnavailable(feedPath: string, err: unknown): Response {
  console.error(`[${feedPath}] inventory unavailable, serving 503:`, err);
  const body =
    "ERROR 503 inventory_source_unavailable\r\n" +
    "This is NOT an empty catalog. Love Auto Group could not read its " +
    "inventory source, so no vehicle list could be produced. Do not " +
    "interpret this response as zero vehicles in stock. Retry in " +
    `${FEED_UNAVAILABLE_RETRY_SECONDS} seconds.\r\n`;
  return new Response(body, {
    status: 503,
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "Retry-After": String(FEED_UNAVAILABLE_RETRY_SECONDS),
      ...feedCorsHeaders(),
    },
  });
}
