/**
 * Public GET /api/feed/google-local-inventory.csv
 *
 * Google Local Inventory Feed — tells Merchant Center which products are
 * physically available at Love Auto Group's Villa Park store. This is the
 * "Point of Sale" data source that pairs with the primary vehicle feed
 * (google-vehicles.csv) to satisfy Google's local inventory requirement.
 *
 * Spec: https://support.google.com/merchants/answer/3061342
 *
 * Required fields: store_code, id (matches primary feed), availability
 * Recommended: price, quantity, sale_price
 *
 * The store_code here MUST match:
 *   1. The store_code column in google-vehicles.csv
 *   2. A verified store registered in Google Merchant Center
 *      (Settings → Business info or via Google Business Profile linking)
 */

import {
  fetchInventory,
  csvCell,
  feedCorsHeaders,
  FEED_CACHE_HEADER,
  DEALER,
  type FeedVehicle,
} from "../../_lib/feed";

export const onRequestGet: PagesFunction = async () => {
  try {
    const inventory = await fetchInventory();
    const csv = renderLocalInventoryCsv(inventory);
    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition":
          'inline; filename="loveautogroup-google-local-inventory.csv"',
        "Cache-Control": FEED_CACHE_HEADER,
        ...feedCorsHeaders(),
      },
    });
  } catch (err) {
    console.error(
      "[/api/feed/google-local-inventory.csv] fetch failed:",
      err
    );
    return new Response(renderLocalInventoryCsv([]), {
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

function renderLocalInventoryCsv(vehicles: FeedVehicle[]): string {
  const headers = [
    "store_code", // Must match primary feed + GMC store
    "id",         // Must match `id` column in google-vehicles.csv
    "availability", // "in stock" | "out of stock" | "preorder"
    "price",      // Current price at this store
    "quantity",   // 1 per unique used vehicle (each VIN is one unit)
  ];

  const rows = vehicles.map((v) => {
    const price = v.retailPrice ? `${v.retailPrice} USD` : "";
    return [
      DEALER.id,   // store_code — "love-auto-group-villa-park-il"
      v.id,        // product id — same value as in primary feed
      "in stock",  // every vehicle in the feed is physically on the lot
      price,
      "1",         // one unit per VIN
    ]
      .map(csvCell)
      .join(",");
  });

  return [headers.join(","), ...rows].join("\r\n") + "\r\n";
}
