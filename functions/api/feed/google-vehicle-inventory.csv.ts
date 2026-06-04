/**
 * Public GET /api/feed/google-vehicle-inventory.csv
 *
 * Google Local Product Inventory feed — maps each vehicle to the physical
 * store with current price and availability status.
 *
 * THIS IS DIFFERENT FROM the POS store file (google-local-inventory.csv):
 *   - POS store file  → registers the store address (1 row per location)
 *   - This file       → maps each PRODUCT to a STORE with price/availability
 *                       (1 row per vehicle × store combination)
 *
 * Register in GMC: Settings → Data sources → [Add source] →
 *   "Local product inventory" → File (URL) →
 *   https://www.loveautogroup.net/api/feed/google-vehicle-inventory.csv
 *
 * Spec: https://support.google.com/merchants/answer/3057382
 *
 * Required fields: store_code, id, availability, price
 * Recommended: sale_price, quantity
 *
 * The `id` column must match the `id` column in the primary vehicle feed.
 * The `store_code` must match a store registered in the POS store data source.
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
          'inline; filename="loveautogroup-google-vehicle-inventory.csv"',
        "Cache-Control": FEED_CACHE_HEADER,
        ...feedCorsHeaders(),
      },
    });
  } catch (err) {
    console.error("[/api/feed/google-vehicle-inventory.csv] fetch failed:", err);
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
    "store_code",    // Must match the store_code in the POS store data source
    "id",            // Must match the id column in the primary vehicle feed
    "price",         // e.g. "24999.99 USD"
    "sale_price",    // Optional — leave blank if no sale price
    "availability",  // "in stock" | "out of stock" | "preorder"
    "quantity",      // Number of units; always 1 for individual vehicles
  ];

  const rows = vehicles.map((v) => {
    const price = v.retailPrice ? `${v.retailPrice} USD` : "";
    return [
      DEALER.id,      // store_code
      v.id,           // product id — matches primary feed
      price,          // price
      "",             // sale_price — not used
      "in stock",     // availability — if it's in the feed, it's in stock
      "1",            // quantity — one vehicle per listing
    ]
      .map(csvCell)
      .join(",");
  });

  return [headers.join(","), ...rows].join("\r\n") + "\r\n";
}
