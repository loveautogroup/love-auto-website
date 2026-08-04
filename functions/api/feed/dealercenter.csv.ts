/**
 * Public GET /api/feed/dealercenter.csv
 *
 * DealerCenter Inventory Import feed. DealerCenter's "Automated Nightly
 * Feed" importer (Settings → Inventory → Import → Another System) pulls
 * this URL once per night to sync active inventory into DC.
 *
 * Column names and order match DealerCenter's own inventory CSV export
 * template so the importer auto-maps every field without manual column
 * assignment.
 *
 * Only "Available" (Listed) and "Sale Pending" vehicles are included.
 * In-recon, sold, and archived vehicles are intentionally excluded.
 *
 * Hosted on Cloudflare Pages so the URL is always fast and available —
 * no Railway cold-start latency for DC's server-side validation.
 *
 * Import URL for DealerCenter Settings:
 *   https://www.loveautogroup.net/api/feed/dealercenter.csv
 */

import {
  fetchInventory,
  csvCell,
  feedCorsHeaders,
  feedUnavailable,
  FEED_CACHE_HEADER,
  type FeedVehicle,
} from "../../_lib/feed";

const MAX_PHOTOS = 10;

/** DealerCenter-extra fields that come through the DMS API but aren't
 *  typed in the shared FeedVehicle interface. */
interface DCVehicle extends FeedVehicle {
  stockNumber?: string | null;
  titleStatus?: string | null;
}

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
    return feedUnavailable("/api/feed/dealercenter.csv", err);
  }

  const csv = renderDealerCenterCsv(inventory as DCVehicle[]);

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      // "inline" (not "attachment") so DC's server-side validator
      // can read the response body without being treated as a download.
      "Content-Disposition": "inline; filename=\"loveautogroup-dc-inventory.csv\"",
      "Cache-Control": FEED_CACHE_HEADER,
      ...feedCorsHeaders(),
    },
  });
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: feedCorsHeaders() });

function renderDealerCenterCsv(vehicles: DCVehicle[]): string {
  const imageHeaders = Array.from(
    { length: MAX_PHOTOS },
    (_, i) => `Image URL ${i + 1}`
  );

  const headers = [
    "Stock #",
    "VIN",
    "Year",
    "Make",
    "Model",
    "Trim",
    "Body Style",
    "Miles",
    "Asking Price",
    "Exterior Color",
    "Interior Color",
    "Transmission",
    "Engine",
    "Drivetrain",
    "Title Status",
    "Description",
    ...imageHeaders,
  ];

  const rows = vehicles.map((v) => {
    // Up to 10 photo URLs padded to exactly 10 slots. Photo order mirrors
    // the DMS hero arrangement (slot 0 = hero / front-3/4 driver-side).
    const photos = (v.photos ?? []).slice(0, MAX_PHOTOS);
    const photoCells = Array.from(
      { length: MAX_PHOTOS },
      (_, i) => photos[i]?.url ?? ""
    );

    return [
      v.stockNumber ?? v.id ?? "",
      v.vin,
      v.year,
      v.make,
      v.model,
      v.trim ?? "",
      v.bodyStyle ?? "",
      v.mileage ?? "",
      v.retailPrice ?? "",
      v.exteriorColor ?? "",
      v.interiorColor ?? "",
      v.transmission ?? "",
      v.engine ?? "",
      v.drivetrain ?? "",
      v.titleStatus ?? "Clean",
      v.description ?? "",
      ...photoCells,
    ]
      .map(csvCell)
      .join(",");
  });

  return [headers.join(","), ...rows].join("\r\n") + "\r\n";
}
