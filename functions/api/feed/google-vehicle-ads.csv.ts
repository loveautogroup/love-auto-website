/**
 * Public GET /api/feed/google-vehicle-ads.csv
 *
 * Dedicated Google Merchant Center VEHICLE ADS primary feed.
 * Spec: support.google.com/merchants/answer/11192663 ("How to create a
 * primary feed") + per-attribute pages under topic 15174112.
 *
 * Intentionally SEPARATE from google-vehicles.csv (which serves the
 * legacy Shopping-parser product source + organic Vehicle Listings
 * consumers). Register THIS URL in Merchant Center as the vehicle ads
 * data source. Spec differences honored here vs the legacy feed:
 *   - condition is Title Case ("Used" / "New")
 *   - NO availability column (vehicle ads rejects it unless the offer
 *     is build_to_order — answer 11192663, price-attributes note)
 *   - additional_image_link capped at 10 (vehicle ads maximum)
 *   - in-store fulfillment expressed via the top-level store_code
 *     attribute, which is equivalent to vehicle_fulfillment(option)=
 *     in_store per answer 14154094 ("You do not need to provide both")
 *   - vehicle offers only, one offer per VIN
 *
 * ELIGIBILITY (answer 11544533): vehicle ads require a CLEAN TITLE.
 * Branded / rebuilt / salvage titles and liens MUST be excluded here.
 * Excluded vehicles may still appear in other feeds and channels.
 */

import {
  fetchInventory,
  csvCell,
  feedCorsHeaders,
  FEED_CACHE_HEADER,
  DEALER,
  type FeedVehicle,
} from "../../_lib/feed";

interface Env {
  MERCHANDISING: KVNamespace;
}

const CONFIG_KEY = "config:v1";

interface MerchOverlay {
  googleFeed?: boolean;
  carfaxSnapshot?: { titleStatus?: string };
}
interface MerchConfig {
  overlays?: Record<string, MerchOverlay>;
}

// Vehicle ads supports up to 10 additional images per offer.
const MAX_ADDITIONAL_IMAGES = 10;

// VINs excluded from VEHICLE ADS only (kept in other feeds/channels).
// Clean-title rule: rebuilt/branded/salvage titles are ineligible.
// Hard guard — applies even if a googleFeed overlay flag is set.
const EXCLUDED_VINS = new Set<string>([
  // 2016 Lexus IS 300 AWD #11347 — REBUILT title (Jeremiah, Jun 6 2026)
  "JTHCM1D22G5010107",
]);

// ── Per-vehicle opt-in (Jun 6 2026, Jeremiah) ────────────────────────
// Vehicles enter this feed ONLY when their merchandising overlay (KV
// config:v1, written from DMS /dashboard/google) has googleFeed: true.
// Explicit opt-in keeps paid-ads exposure a per-vehicle DMS decision —
// the Porsche-only pilot is simply "Porsche on, everything else off".
// FAIL-CLOSED: if the KV read fails, the feed emits ZERO vehicles
// rather than accidentally exposing the whole lot to ad spend.
async function googleEnabledVins(env: Env): Promise<Set<string>> {
  const cfg = await env.MERCHANDISING.get<MerchConfig>(CONFIG_KEY, {
    type: "json",
  });
  const overlays = cfg?.overlays ?? {};
  const enabled = new Set<string>();
  for (const [vin, o] of Object.entries(overlays)) {
    if (!o || o.googleFeed !== true) continue;
    // Clean-title rule (answer 11544533), data-driven: a titleStatus
    // recorded at intake that is anything other than "clean" makes the
    // vehicle ineligible for vehicle ads even if its post switch is on.
    // EXCLUDED_VINS below stays as belt-and-suspenders for known VINs.
    const title = o.carfaxSnapshot?.titleStatus;
    if (title && title !== "clean") continue;
    enabled.add(vin);
  }
  return enabled;
}

export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const enabled = await googleEnabledVins(env);
    // Policy (Google onboarding guide + answer 11190670): vehicles in the
    // feed must be listed as AVAILABLE on the landing page — "sold, out of
    // stock, reserved, unavailable, or incoming unit" availability is not
    // permitted. Our VDP shows a "Sale Pending" badge for DEAL_PENDING
    // vehicles, so those are excluded here until they return to Available.
    const inventory = (await fetchInventory()).filter(
      (v) =>
        enabled.has(v.vin) &&
        !EXCLUDED_VINS.has(v.vin) &&
        (v.status === "Available" || v.status == null)
    );
    const csv = renderVehicleAdsCsv(inventory);
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'inline; filename="loveautogroup-google-vehicle-ads.csv"',
        "Cache-Control": FEED_CACHE_HEADER,
        ...feedCorsHeaders(),
      },
    });
  } catch (err) {
    console.error("[/api/feed/google-vehicle-ads.csv] fetch failed:", err);
    return new Response(renderVehicleAdsCsv([]), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Cache-Control": "public, max-age=30",
        ...feedCorsHeaders(),
      },
    });
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: feedCorsHeaders() });

function renderVehicleAdsCsv(vehicles: FeedVehicle[]): string {
  const headers = [
    // Required
    "id",
    "vin",
    "store_code", // top-level = in_store fulfillment (answer 14154094)
    "brand",
    "model",
    "year",
    "condition",
    "mileage",
    "color",
    "price",
    "image_link",
    "link", // VDP
    "link_template", // VDP with {store_code} placeholder (in-store offers)
    "google_product_category",
    // Optional / recommended
    "trim",
    "additional_image_link",
    "description",
  ];

  const rows = vehicles.map((v) => {
    const photos = v.photos ?? [];
    const heroUrl = photos[0]?.url ?? "";
    const additional = photos
      .slice(1, 1 + MAX_ADDITIONAL_IMAGES)
      .map((p) => p.url)
      .join(",");

    const price = v.retailPrice ? `${v.retailPrice} USD` : "";
    // Unit token must be "miles" or "km" (answer 14156166).
    const mileage = v.mileage ? `${v.mileage} miles` : "";
    const vdpUrl = v.vdpUrl ?? DEALER.website;

    return [
      v.id,
      v.vin,
      DEALER.googleStoreCode,
      v.make, // brand = manufacturer (answer 11192663)
      v.model,
      v.year,
      "Used", // Title Case per vehicle ads spec — every Love Auto vehicle is used
      mileage,
      v.exteriorColor ?? "",
      price,
      heroUrl,
      vdpUrl,
      `${vdpUrl}?store={store_code}`,
      "Vehicles & Parts > Vehicles > Motor Vehicles > Cars, Trucks & Vans",
      v.trim ?? "",
      additional,
      v.description ?? "",
    ]
      .map(csvCell)
      .join(",");
  });

  return [headers.join(","), ...rows].join("\r\n") + "\r\n";
}
