/**
 * Public GET /api/feed/vast.xml
 *
 * Inventory feed for **Vast (CarStory) → CARFAX Car Listings**.
 *
 * Origin: Sanja Vukmirovic (sanja.vukmirovic@vast.com, cc autos_va@vast.com)
 * 2026-09-02, following the CARFAX Car Listings order signed 2026-08-30 and
 * Ashley McCann's request for either our inventory provider or a direct feed.
 * Vast offered line-feed (tab/comma/pipe) or XML, and FTP push/pull or
 * http/https. We chose **XML over HTTP pull** — they fetch this URL.
 *
 * WHY PULL, NOT THE FTP PUSH THEY OFFERED. A push job measures DELIVERY,
 * not INGESTION. `dc-feed-push` reported success three times a day for
 * roughly nine days in August while DealerCenter ingested nothing, and a
 * person noticed before any monitor did. A pull URL has no delivery step
 * that can lie to us, needs no stored FTP credential, and no scheduler.
 *
 * ── Field mapping notes (each one is a decision, not an omission) ─────────
 *
 * price / internet_price / selling_price / retail_price
 *     All four carry the SAME number, because we have exactly one: the
 *     asking price. Feeding different values into different price columns
 *     is what put three live prices on one Honda Fit at once (DMS
 *     $5,299.99 / DC Asking $5,999.99 / DC Special $5,499.99, 2026-08-31).
 *     Identical values cannot contradict each other.
 *
 * MSRP, invoice_price
 *     EMPTY, always. MSRP on a used car is not a number we hold, and
 *     🔴 "invoice price" on a dealer feed reads as DEALER COST. Our cost
 *     basis does not leave the building. Their sample fills both; we will
 *     not.
 *
 * dealer_fee
 *     0. Love Auto Group charges no doc or dealer fee — tax, title and
 *     license only (owner's decision 2026-07-06, and a published claim on
 *     loveautogroup.net). Their sample says $399; echoing it would put a
 *     fee on a CARFAX listing that contradicts our own storefront.
 *
 * dealer_phone
 *     The VOICE line, (630) 359-3643. NOT 312-925-7520 — that is the text
 *     line, and it is what the CARFAX order form had in the lead-phone box.
 *     A marketplace routing calls to a text line loses them silently; we
 *     have already lost one caller that way (the MKX lead, 2026-08-23).
 *
 * cpo
 *     NO. We are an independent dealer; there is no manufacturer certified
 *     pre-owned program behind these cars. Their sample says YES.
 *
 * cylinders / engine_size
 *     The DMS's STORED vPIC values first (engine_cylinders /
 *     engine_displacement, plumbed through 2026-09-02), falling back to
 *     shared/engineSpecs.ts parsing the free-text string only where the
 *     column is empty. Both are needed: stock 11331 reads "2.3L 4V Premium
 *     Fuel" where 4V is four VALVES and only the column is right, and stock
 *     10976 is the inverse — empty column, "2.5L 4-Cylinder" in the text.
 *     The parser refuses rather than guesses, so a car with neither ships
 *     an empty field.
 *
 * doors
 *     Emitted only when the DMS holds it. It is empty on all six live cars
 *     today, and inferring "Coupe -> 2" is exactly the unfounded-claim
 *     class the feature-pills fix outlawed. Blank beats wrong.
 *
 * standard_features / optional_features / seller_comments
 *     EMPTY. There is no equipment-list data source anywhere in this repo
 *     (a known gap), and synthesizing one from the description is how the
 *     photo overlays ended up advertising a Pioneer stereo on a car that
 *     did not have one.
 *
 * listing_time / expire_time
 *     NOT EMITTED pending Vast's answer on whether they are required. The
 *     honest value is the date the car was listed, which does not currently
 *     reach this layer (adding it means Railway public.py -> DMS proxy ->
 *     website adapter, in one change, per the field-parity rule). Stamping
 *     the pull time instead would tell CARFAX every car arrived today, on
 *     every pull — a false freshness claim on a lot where days-on-lot is
 *     the number that matters.
 *
 * dealer_ID
 *     EMPTY pending their answer on which identifier they want. Our CARFAX
 *     account is GF-122181, but that is a CARFAX number and this is Vast's
 *     field. Guessing an id is how a feed lands under someone else's roof.
 *
 * description
 *     Arrives already guarded: fetchInventory() drops a description that
 *     quotes a price contradicting the real one, for every feed at once.
 */

import {
  fetchInventory,
  xmlEscape,
  feedCorsHeaders,
  feedUnavailable,
  FEED_CACHE_HEADER,
  DEALER,
  type FeedVehicle,
} from "../../_lib/feed";
import {
  resolveCylinders,
  resolveDisplacement,
  interiorMaterial,
} from "../../../shared/engineSpecs";

/** Dealer phone in the sample feed's own style (800-123-4567). */
const DEALER_PHONE_FEED = "630-359-3643";

/** Love Auto Group charges no doc or dealer fee. See the header note. */
const DEALER_FEE = 0;

/**
 * How many <imageN> elements to emit per listing.
 *
 * Their sample stops at image4, but our cars carry 21-30 photos and four
 * would be a real merchandising loss on a paid listing. Extra sibling
 * elements are the most benign form of unknown data in XML — a parser that
 * does not know image7 almost always ignores it — and this is a supervised
 * onboarding where a human validates the first pull. ▶ Confirm the cap with
 * Vast; if they want four, this constant is the only edit.
 */
const MAX_IMAGES = 40;

export const onRequestGet: PagesFunction = async () => {
  // Narrow try: ONLY the upstream read. A throw here is 503 + Retry-After,
  // never a 200 with an empty catalog — see feedUnavailable()'s comment for
  // why that distinction is the whole point.
  let inventory: FeedVehicle[];
  try {
    inventory = await fetchInventory();
  } catch (err) {
    return feedUnavailable("/api/feed/vast.xml", err);
  }

  const xml = renderVastXml(inventory);

  return new Response(xml, {
    status: 200,
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": FEED_CACHE_HEADER,
      ...feedCorsHeaders(),
    },
  });
};

export const onRequestOptions: PagesFunction = async () =>
  new Response(null, { status: 204, headers: feedCorsHeaders() });

/** Wrap free text in CDATA the way their sample does, splitting any literal
 *  "]]>" so a description can never terminate the section early. */
function cdata(s: string | null | undefined): string {
  if (s === null || s === undefined || s === "") return "";
  return `<![CDATA[${String(s).replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;
}

/** One <tag>value</tag> line, XML-escaped. Empty values still emit the
 *  element so the record shape is identical on every listing — a consumer
 *  diffing our file should never see a field appear and disappear. */
function tag(name: string, value: string | number | null | undefined): string {
  return `    <${name}>${xmlEscape(value)}</${name}>`;
}

export function renderVastXml(vehicles: FeedVehicle[]): string {
  const listings = vehicles.map(renderListing).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<listings>
${listings}
</listings>
`;
}

function renderListing(v: FeedVehicle): string {
  // One price, repeated into every field that means "what we are asking".
  const price = v.retailPrice ?? "";

  // Stock number, never the Railway row id. A shopper quotes the number on
  // the window; publishing row ids into <stock_number> made that number
  // unanswerable when the CarGurus feed did it.
  const stock = v.stockNumber ?? v.id;

  const title = [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ");

  const photos = (v.photos ?? []).slice(0, MAX_IMAGES);
  // image, image2, image3, ... — their sample's numbering starts unsuffixed.
  const images = photos
    .map((p, i) => tag(i === 0 ? "image" : `image${i + 1}`, p.url))
    .join("\n");

  // Already guarded against a stale quoted price by fetchInventory() — ONE
  // mechanism, not two. A second copy here would be the dead-`FROZEN_STATUSES`
  // shape: two checks for one rule, and one of them quietly stops matching.
  const description = v.description ?? null;

  return `  <listing>
${tag("record_id", stock)}
${tag("vin", v.vin)}
${tag("stock_number", stock)}
${tag("title", title)}
${tag("url", v.vdpUrl ?? "")}
${tag("category", "car")}
${images}
${tag("address", DEALER.street)}
${tag("city", DEALER.city)}
${tag("state", DEALER.state)}
${tag("zip", DEALER.zip)}
${tag("country", "United States")}
${tag("seller_type", "Dealer")}
${tag("dealer_name", DEALER.name)}
${tag("dealer_ID", "")}
${tag("dealer_email", DEALER.email)}
${tag("dealer_phone", DEALER_PHONE_FEED)}
${tag("dealer_website", DEALER.website)}
${tag("dealer_fee", DEALER_FEE)}
${tag("make", v.make)}
${tag("model", v.model)}
${tag("trim", v.trim ?? "")}
${tag("body", v.bodyStyle ?? "")}
${tag("mileage", v.mileage ?? "")}
${tag("year", v.year)}
${tag("currency", "USD")}
${tag("price", price)}
${tag("MSRP", "")}
${tag("internet_price", price)}
${tag("selling_price", price)}
${tag("retail_price", price)}
${tag("invoice_price", "")}
${tag("exterior_color", v.exteriorColor ?? "")}
${tag("interior_color", v.interiorColor ?? "")}
${tag("interior_material", interiorMaterial(v.interiorColor) ?? "")}
${tag("doors", v.doors ?? "")}
${tag("cylinders", resolveCylinders(v.engineCylinders, v.engine) ?? "")}
${tag("engine_size", resolveDisplacement(v.engineDisplacement, v.engine) ?? "")}
${tag("drive_type", v.drivetrain ?? "")}
${tag("transmission", v.transmission ?? "")}
${tag("vehicle_condition", "Used")}
${tag("cpo", "NO")}
    <description>${cdata(description)}</description>
    <standard_features></standard_features>
    <optional_features></optional_features>
    <seller_comments></seller_comments>
  </listing>`;
}
