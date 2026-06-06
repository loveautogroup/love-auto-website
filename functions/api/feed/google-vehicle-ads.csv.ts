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

// Vehicle ads supports up to 10 additional images per offer.
const MAX_ADDITIONAL_IMAGES = 10;

// VINs excluded from VEHICLE ADS only (kept in other feeds/channels).
// Clean-title rule: rebuilt/branded/salvage titles are ineligible.
const EXCLUDED_VINS = new Set<string>([
  // 2016 Lexus IS 300 AWD #11347 — REBUILT title (Jeremiah, Jun 6 2026)
  "JTHCM1D22G5010107",
]);

export const onRequestGet: PagesFunction = async () => {
  try {
    const inventory = (await fetchInventory()).filter(
      (v) => !EXCLUDED_VINS.has(v.vin)
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
