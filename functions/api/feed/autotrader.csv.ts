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
  FEED_CACHE_HEADER,
  type FeedVehicle,
} from "../../_lib/feed";

const MAX_PHOTOS = 30;

export const onRequestGet: PagesFunction = async () => {
  try {
    const inventory = await fetchInventory();
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
  } catch (err) {
    console.error("[/api/feed/autotrader.csv] fetch failed:", err);
    return new Response(renderGenericCsv([]), {
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
