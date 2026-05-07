/**
 * Public GET /api/feed/google-vehicles.csv
 *
 * Google Vehicle Listings feed (Vehicle Ads + organic Vehicle Listings
 * in Google Search). Spec:
 *   developers.google.com/vehicle-listings/reference/feed-specification
 *
 * Format: CSV (Google also accepts TSV; we use CSV for parity with the
 * other CSV feeds). Google fetches scheduled feeds on the cadence the
 * dealer configures in Merchant Center; recommended ≤4 hours.
 *
 * Required attributes (per spec): vehicle_id, store_code, make, model,
 * year, price, condition, title, description, link, image_link.
 * For used vehicles: mileage is required.
 *
 * Recommended attributes we include: trim, body_style, transmission,
 * fuel, color (exterior_color), engine, drivetrain, vin,
 * additional_image_link (multi-value, comma-separated INSIDE the cell
 * per Google spec — wrapped in quotes), dealership_name,
 * dealership_address.
 *
 * Photo order: image_link is photo #1 (the DMS hero); additional_image_link
 * holds the rest in the same DMS-arranged order.
 *
 * Required dealer-info display on landing page (we already comply via VDP):
 *   dealership name, dealership location, vehicle price, VIN, mileage,
 *   availability — all visible above-the-fold without scroll.
 */

import {
  fetchInventory,
  csvCell,
  feedCorsHeaders,
  FEED_CACHE_HEADER,
  DEALER,
  type FeedVehicle,
} from "../../_lib/feed";

// Google supports up to ~30 additional images per listing.
const MAX_ADDITIONAL_IMAGES = 30;

export const onRequestGet: PagesFunction = async () => {
  try {
    const inventory = await fetchInventory();
    const csv = renderGoogleCsv(inventory);
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'inline; filename="loveautogroup-google-vehicles.csv"',
        "Cache-Control": FEED_CACHE_HEADER,
        ...feedCorsHeaders(),
      },
    });
  } catch (err) {
    console.error("[/api/feed/google-vehicles.csv] fetch failed:", err);
    return new Response(renderGoogleCsv([]), {
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

function renderGoogleCsv(vehicles: FeedVehicle[]): string {
  const headers = [
    // Required
    "vehicle_id",
    "store_code",
    "make",
    "model",
    "year",
    "price",
    "condition",
    "title",
    "description",
    "link",
    "image_link",
    // Required for used
    "mileage",
    // Strongly recommended
    "trim",
    "body_style",
    "transmission",
    "fuel",
    "exterior_color",
    "interior_color",
    "engine",
    "drivetrain",
    "doors",
    "vin",
    "availability",
    "dealership_name",
    "dealership_address",
    "dealership_phone",
    // Multi-value: pipe-separated additional photo URLs inside one cell
    "additional_image_link",
  ];

  const rows = vehicles.map((v) => {
    const photos = (v.photos ?? []);
    const heroUrl = photos[0]?.url ?? "";
    // Google wants additional images in a single CSV cell, separated by
    // commas. Since the cell itself is comma-quoted, we use ',' as the
    // intra-cell delimiter (inside the quoted cell csvCell handles it).
    // Spec actually allows comma OR pipe; pipe is safer to avoid CSV
    // escaping ambiguity.
    const additional = photos
      .slice(1, 1 + MAX_ADDITIONAL_IMAGES)
      .map((p) => p.url)
      .join(",");

    const title = `${v.year} ${v.make} ${v.model}${v.trim ? " " + v.trim : ""}`;
    const price = v.retailPrice ? `${v.retailPrice} USD` : "";
    const mileage = v.mileage ? `${v.mileage} mi` : "";
    // Sale Pending vehicles still show "in stock" since they can fall
    // back to available; if they sell, the upstream public/inventory
    // endpoint stops returning them and they drop out of the feed.
    const availability = "in stock";

    return [
      v.id, // vehicle_id
      DEALER.id, // store_code (must match Merchant Center store)
      v.make,
      v.model,
      v.year,
      price,
      "used", // condition — every Love Auto vehicle is used
      title,
      v.description ?? "",
      v.vdpUrl ?? DEALER.website,
      heroUrl,
      mileage,
      v.trim ?? "",
      v.bodyStyle ?? "",
      v.transmission ?? "",
      v.fuelType ?? "",
      v.exteriorColor ?? "",
      v.interiorColor ?? "",
      v.engine ?? "",
      v.drivetrain ?? "",
      v.doors ?? "",
      v.vin,
      availability,
      DEALER.name,
      `${DEALER.street}, ${DEALER.city}, ${DEALER.state} ${DEALER.zip}`,
      DEALER.phoneFormatted,
      additional,
    ]
      .map(csvCell)
      .join(",");
  });

  return [headers.join(","), ...rows].join("\r\n") + "\r\n";
}
