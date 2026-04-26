/**
 * Public GET /api/feed/cargurus.xml
 *
 * CarGurus-style XML inventory feed. CarGurus' onboarding form accepts a
 * URL — they crawl it on a 1–4 hour cadence and re-ingest the full
 * vehicle list every time. The feed format used here is also accepted by:
 *   - AutoList
 *   - Autos Today
 *   - MSN Auto
 *   - CarZing Listing
 *
 * Spec reference: CarGurus Listings XML Feed Spec (public dealer docs).
 * Field set is intentionally a superset — providers ignore fields they
 * don't recognize, but missing required fields cause listing rejection.
 *
 * Photo order: photos are listed in the order returned by fetchInventory(),
 * which mirrors the DMS hero arrangement. Photo #1 = hero. When Jordan
 * changes the hero in the merchandising panel, the next provider crawl
 * picks it up automatically.
 */

import {
  fetchInventory,
  xmlEscape,
  feedCorsHeaders,
  FEED_CACHE_HEADER,
  DEALER,
  type FeedVehicle,
} from "../../_lib/feed";

export const onRequestGet: PagesFunction = async () => {
  try {
    const inventory = await fetchInventory();
    const xml = renderCarGurusXml(inventory);
    return new Response(xml, {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": FEED_CACHE_HEADER,
        ...feedCorsHeaders(),
      },
    });
  } catch (err) {
    console.error("[/api/feed/cargurus.xml] fetch failed:", err);
    // Return an empty but valid XML feed rather than 500 — providers
    // pulling the URL on a schedule will retry on the next cycle and a
    // 500 can flag the feed as broken in their dashboards.
    return new Response(renderCarGurusXml([]), {
      status: 200,
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=30",
        ...feedCorsHeaders(),
      },
    });
  }
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: feedCorsHeaders() });

function renderCarGurusXml(vehicles: FeedVehicle[]): string {
  const now = new Date().toISOString();
  const items = vehicles.map(renderVehicle).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<inventory generated="${xmlEscape(now)}" dealer_id="${xmlEscape(DEALER.id)}" count="${vehicles.length}">
  <dealer>
    <id>${xmlEscape(DEALER.id)}</id>
    <name>${xmlEscape(DEALER.name)}</name>
    <phone>${xmlEscape(DEALER.phoneFormatted)}</phone>
    <email>${xmlEscape(DEALER.email)}</email>
    <address>${xmlEscape(DEALER.street)}</address>
    <city>${xmlEscape(DEALER.city)}</city>
    <state>${xmlEscape(DEALER.state)}</state>
    <zip>${xmlEscape(DEALER.zip)}</zip>
    <country>${xmlEscape(DEALER.country)}</country>
    <website>${xmlEscape(DEALER.website)}</website>
  </dealer>
${items}
</inventory>`;
}

function renderVehicle(v: FeedVehicle): string {
  // Photos in DMS hero order; photo #1 = hero. Empty array if no photos.
  const photoBlocks = (v.photos ?? [])
    .map(
      (p, i) =>
        `      <photo position="${i + 1}"${i === 0 ? ' primary="true"' : ""}><url>${xmlEscape(
          p.url
        )}</url></photo>`
    )
    .join("\n");

  // Status mapping: CarGurus expects "Available" / "Sale Pending" / "Sold".
  // We only feed Available + Sale Pending (filter is upstream).
  const status = v.status ?? "Available";

  return `  <vehicle>
    <stock_number>${xmlEscape(v.id)}</stock_number>
    <vin>${xmlEscape(v.vin)}</vin>
    <year>${xmlEscape(v.year)}</year>
    <make>${xmlEscape(v.make)}</make>
    <model>${xmlEscape(v.model)}</model>
    <trim>${xmlEscape(v.trim ?? "")}</trim>
    <body_style>${xmlEscape(v.bodyStyle ?? "")}</body_style>
    <mileage>${xmlEscape(v.mileage ?? "")}</mileage>
    <price>${xmlEscape(v.retailPrice ?? "")}</price>
    <exterior_color>${xmlEscape(v.exteriorColor ?? "")}</exterior_color>
    <interior_color>${xmlEscape(v.interiorColor ?? "")}</interior_color>
    <drivetrain>${xmlEscape(v.drivetrain ?? "")}</drivetrain>
    <transmission>${xmlEscape(v.transmission ?? "")}</transmission>
    <engine>${xmlEscape(v.engine ?? "")}</engine>
    <fuel_type>${xmlEscape(v.fuelType ?? "")}</fuel_type>
    <doors>${xmlEscape(v.doors ?? "")}</doors>
    <condition>Used</condition>
    <status>${xmlEscape(status)}</status>
    <vdp_url>${xmlEscape(v.vdpUrl ?? "")}</vdp_url>
    <description>${xmlEscape(v.description ?? "")}</description>
    <photos>
${photoBlocks}
    </photos>
  </vehicle>`;
}
