/**
 * Public GET /api/feed/facebook.csv
 *
 * Facebook Marketplace Catalog feed (Vehicles spec). Facebook crawls the
 * URL hourly when configured as a "data feed" in Commerce Manager. Used
 * for: Facebook Marketplace listings, Instagram Shopping vehicle posts,
 * and anywhere FB needs structured vehicle data.
 *
 * Spec: developers.facebook.com → Catalog → Vehicles
 *
 * Required columns (in order):
 *   vehicle_id, dealer_id, make, model, year, mileage.value,
 *   mileage.unit, price, body_style, condition, exterior_color, fuel_type,
 *   transmission, drivetrain, vin, image[0].url ... image[19].url,
 *   address.addr1, address.city, address.region, address.country,
 *   address.postal_code, latitude, longitude, title, description, url,
 *   availability, state_of_vehicle
 *
 * Photo order: image[0] is the hero. Same DMS-arranged order as XML feed.
 */

import {
  fetchInventory,
  csvCell,
  feedCorsHeaders,
  FEED_CACHE_HEADER,
  DEALER,
  type FeedVehicle,
} from "../../_lib/feed";

const MAX_IMAGES = 20;

export const onRequestGet: PagesFunction = async () => {
  try {
    const inventory = await fetchInventory();
    const csv = renderFacebookCsv(inventory);
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": "inline; filename=\"loveautogroup-facebook.csv\"",
        "Cache-Control": FEED_CACHE_HEADER,
        ...feedCorsHeaders(),
      },
    });
  } catch (err) {
    console.error("[/api/feed/facebook.csv] fetch failed:", err);
    return new Response(renderFacebookCsv([]), {
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

function renderFacebookCsv(vehicles: FeedVehicle[]): string {
  const imageHeaders = Array.from({ length: MAX_IMAGES }, (_, i) => `image[${i}].url`);
  const headers = [
    "vehicle_id",
    "dealer_id",
    "make",
    "model",
    "year",
    "mileage.value",
    "mileage.unit",
    "price",
    "body_style",
    "condition",
    "exterior_color",
    "interior_color",
    "fuel_type",
    "transmission",
    "drivetrain",
    "vin",
    "trim",
    ...imageHeaders,
    "address.addr1",
    "address.city",
    "address.region",
    "address.country",
    "address.postal_code",
    "title",
    "description",
    "url",
    "availability",
    "state_of_vehicle",
  ];

  const rows = vehicles.map((v) => {
    // Photo array padded out to MAX_IMAGES — extra slots blank. Order
    // mirrors DMS hero arrangement so image[0] is always the hero.
    const photos = (v.photos ?? []).slice(0, MAX_IMAGES);
    const photoCells = Array.from({ length: MAX_IMAGES }, (_, i) =>
      photos[i]?.url ?? ""
    );

    // FB requires "available" / "out of stock". Sale Pending stays
    // "available" since it can still flip back to a deal if it falls out.
    const availability = v.status === "Sale Pending" ? "available" : "available";

    const title = `${v.year} ${v.make} ${v.model}${v.trim ? " " + v.trim : ""}`;

    return [
      v.id,
      DEALER.id,
      v.make,
      v.model,
      v.year,
      v.mileage ?? "",
      v.mileage ? "MI" : "",
      v.retailPrice ? `${v.retailPrice} USD` : "",
      v.bodyStyle ?? "",
      "USED",
      v.exteriorColor ?? "",
      v.interiorColor ?? "",
      v.fuelType ?? "",
      v.transmission ?? "",
      v.drivetrain ?? "",
      v.vin,
      v.trim ?? "",
      ...photoCells,
      DEALER.street,
      DEALER.city,
      DEALER.state,
      DEALER.country,
      DEALER.zip,
      title,
      v.description ?? "",
      v.vdpUrl ?? DEALER.website,
      availability,
      "USED",
    ]
      .map(csvCell)
      .join(",");
  });

  return [headers.join(","), ...rows].join("\r\n") + "\r\n";
}
