/**
 * Public GET /api/feed/google-local-inventory.csv
 *
 * Google Point-of-Sale (POS) store data file — tells Merchant Center
 * about Love Auto Group's physical store location. This is registered
 * under Settings > Data sources > Point of sale sources in GMC.
 *
 * The POS store file registers the physical store so that:
 *  1. Google validates the store_code in the primary vehicle feed
 *  2. Vehicles in the primary feed are treated as locally available
 *     at this store (satisfying the "Missing local inventory data" check)
 *
 * Spec: https://support.google.com/merchants/answer/3227905
 *
 * Required fields: store_code, name, address1, city, region,
 *                  postal_code, country
 * Recommended: phone, website
 *
 * This file contains ONE row — Love Auto Group's single Villa Park location.
 * If a second location ever opens, add a row here with a new store_code and
 * update the primary vehicle feed to use the correct store_code per vehicle.
 */

import {
  feedCorsHeaders,
  FEED_CACHE_HEADER,
  DEALER,
} from "../../_lib/feed";

export const onRequestGet: PagesFunction = async () => {
  const csv = renderPosStoreCsv();
  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition":
        'inline; filename="loveautogroup-google-pos-store.csv"',
      "Cache-Control": FEED_CACHE_HEADER,
      ...feedCorsHeaders(),
    },
  });
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: feedCorsHeaders() });

function renderPosStoreCsv(): string {
  const headers = [
    "store_code",    // Unique store ID — must match store_code in vehicle feed
    "name",          // Store display name
    "address1",      // Street address line 1
    "city",
    "region",        // State abbreviation
    "postal_code",
    "country",       // ISO 3166-1 alpha-2
    "phone",         // E.164 format
    "website",
  ];

  // One row — Love Auto Group Villa Park (sole location)
  const row = [
    DEALER.id,                // "love-auto-group-villa-park-il"
    DEALER.name,              // "Love Auto Group"
    DEALER.street,            // "735 N Yale Ave"
    DEALER.city,              // "Villa Park"
    DEALER.state,             // "IL"
    DEALER.zip,               // "60181"
    DEALER.country,           // "US"
    DEALER.phone,             // "+16303593643"
    DEALER.website,           // "https://www.loveautogroup.net"
  ].map(csvCell).join(",");

  return [headers.join(","), row].join("\r\n") + "\r\n";
}

function csvCell(s: string | number | null | undefined): string {
  if (s === null || s === undefined) return "";
  const str = String(s);
  if (/[,"\r\n]/.test(str) || /^\s|\s$/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
