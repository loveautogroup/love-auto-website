/**
 * Public GET /api/feed/autotrader.csv
 *
 * Generic dealer-feed CSV — comprehensive column set that's accepted by:
 *   - AutoTrader (when CSV upload is used instead of XML)
 *   - BuySellAutoMart
 *   - Claz
 *   - Most "import via CSV" provider onboarding flows
 *
 * Header order is canonical / common-denominator: stock, vin, year, make,
 * model, trim, mileage, price, colors, drivetrain, transmission, engine,
 * body, doors, fuel, condition, status, vdp_url, description, then
 * photo_1..photo_30 in DMS hero order.
 *
 * Photo order: photo_1 is the hero. When Jordan rearranges in the
 * merchandising panel, the new hero shows up at next provider crawl.
 */

import {
  fetchInventory,
  csvCell,
  feedCorsHeaders,
  feedUnavailable,
  FEED_CACHE_HEADER,
  type FeedVehicle,
} from "../../_lib/feed";

const MAX_PHOTOS = 30;

export const onRequestGet: PagesFunction = async () => {
  // Narrow try: ONLY the upstream READ. A throw here means we could not read
  // the inventory, which is now HTTP 503 + Retry-After (2026-08-03, Jeremiah's
  // call) instead of the old 200 + empty feed -- an empty 200 reads to feed
  // consumers as "this dealer has zero cars", which is a delisting risk.
  // Rendering and filtering happen OUTSIDE the try on purpose: once the read
  // succeeds, a feed that legitimately comes out empty is truthful data and
  // stays a 200.
  let inventory: FeedVehicle[];
  try {
    inventory = await fetchInventory();
  } catch (err) {
    return feedUnavailable("/api/feed/autotrader.csv", err);
  }

  const csv = renderGenericCsv(inventory);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "inline; filename=\"loveautogroup-inventory.csv\"",
      "Cache-Control": FEED_CACHE_HEADER,
      ...feedCorsHeaders(),
    },
  });
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: feedCorsHeaders() });

function renderGenericCsv(vehicles: FeedVehicle[]): string {
  const photoHeaders = Array.from({ length: MAX_PHOTOS }, (_, i) => `photo_${i + 1}`);
  const headers = [
    "stock_number",
    "vin",
    "year",
    "make",
    "model",
    "trim",
    "mileage",
    "price",
    "exterior_color",
    "interior_color",
    "drivetrain",
    "transmission",
    "engine",
    "body_style",
    "doors",
    "fuel_type",
    "condition",
    "status",
    "vdp_url",
    "description",
    ...photoHeaders,
  ];

  const rows = vehicles.map((v) => {
    const photos = (v.photos ?? []).slice(0, MAX_PHOTOS);
    const photoCells = Array.from({ length: MAX_PHOTOS }, (_, i) => photos[i]?.url ?? "");

    return [
      v.id,
      v.vin,
      v.year,
      v.make,
      v.model,
      v.trim ?? "",
      v.mileage ?? "",
      v.retailPrice ?? "",
      v.exteriorColor ?? "",
      v.interiorColor ?? "",
      v.drivetrain ?? "",
      v.transmission ?? "",
      v.engine ?? "",
      v.bodyStyle ?? "",
      v.doors ?? "",
      v.fuelType ?? "",
      "Used",
      v.status ?? "Available",
      v.vdpUrl ?? "",
      v.description ?? "",
      ...photoCells,
    ]
      .map(csvCell)
      .join(",");
  });

  return [headers.join(","), ...rows].join("\r\n") + "\r\n";
}
