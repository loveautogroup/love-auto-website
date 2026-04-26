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

export const DEALER = {
  name: "Love Auto Group",
  id: "love-auto-group-villa-park-il",
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
export async function fetchInventory(): Promise<FeedVehicle[]> {
  const res = await fetch(DMS_PUBLIC_INVENTORY_URL, {
    cf: { cacheTtl: 60 } as RequestInitCfProperties,
  });
  if (!res.ok) {
    throw new Error(`DMS inventory ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }
  const json = (await res.json()) as DMSInventoryResponse | FeedVehicle[];
  const items: FeedVehicle[] = Array.isArray(json) ? json : json.data ?? [];
  return items
    .filter((v) => v.vin && v.year && v.make && v.model)
    .map((v) => ({
      ...v,
      vdpUrl: buildVdpUrl(v),
      // Defensive — the public endpoint should already filter to retail-
      // ready + sale-pending, but in case it ever returns more we double-check.
    }))
    .filter((v) =>
      v.status === "Available" || v.status === "Sale Pending" || v.status == null
    );
}

function buildVdpUrl(v: FeedVehicle): string {
  const slugParts = [v.year, v.make, v.model, v.trim]
    .filter(Boolean)
    .map((s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
    .join("-");
  return `${DEALER.website}/inventory/${slugParts}-${v.vin.toLowerCase()}/`;
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
