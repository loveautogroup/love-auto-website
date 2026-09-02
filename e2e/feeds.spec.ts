import { test, expect, type APIRequestContext } from "@playwright/test";
import { descriptionContradictsPrice } from "../shared/descriptionGuard";

/**
 * Every outbound feed, one invariant: we never advertise a price we are not
 * asking (2026-09-02).
 *
 * The website's own VDP and /api/inventory have dropped a description that
 * quotes a contradicting price since the 2026-08 audit. All SIX feeds that
 * emit a description skipped that guard and wrote `v.description ?? ""`
 * straight out, so a stale price was suppressed on our own page and still
 * shipped to CarGurus, Google, Facebook, DealerCenter and CARFAX. The fix
 * moved the guard into fetchInventory(), which every feed already calls.
 *
 * These tests assert the OUTCOME on the deployed files rather than the
 * mechanism, so they keep working if the guard ever moves again — and they
 * cover feeds written after today for free.
 */

/** Feeds whose per-listing price and description can be read without a
 *  CSV parser. The real check runs here. */
const XML_FEEDS = [
  { path: "/api/feed/vast.xml", item: "listing" },
  { path: "/api/feed/cargurus.xml", item: "vehicle" },
] as const;

/** The remaining feeds that carry a description column. Checked for
 *  uniformity against the XML feeds — same guarded text, or same absence. */
const CSV_FEEDS = [
  "/api/feed/autotrader.csv",
  "/api/feed/facebook.csv",
  "/api/feed/dealercenter.csv",
  "/api/feed/google-vehicle-ads.csv",
  "/api/feed/google-vehicles.csv",
] as const;

async function body(request: APIRequestContext, path: string): Promise<string> {
  const res = await request.get(path);
  expect(res.status(), `${path} is deployed and readable`).toBe(200);
  return res.text();
}

/** Letters and digits only — lets an XML-escaped description ("We&apos;ve")
 *  be compared with the same text inside a quoted CSV cell ("We've"). */
function fingerprint(s: string): string {
  return s.replace(/&[a-z]+;/g, "").replace(/[^a-z0-9]/gi, "").toLowerCase();
}

for (const feed of XML_FEEDS) {
  test(`${feed.path} never quotes a price it is not asking`, async ({ request }) => {
    const xml = await body(request, feed.path);
    const blocks = [
      ...xml.matchAll(new RegExp(`<${feed.item}>([\\s\\S]*?)</${feed.item}>`, "g")),
    ];
    expect(blocks.length, "there is something to check").toBeGreaterThan(0);

    for (const [, block] of blocks) {
      const read = (t: string) =>
        (block.match(new RegExp(`<${t}>([\\s\\S]*?)</${t}>`)) ?? [, ""])[1];
      const stock = read("stock_number");
      const price = Number(read("price"));
      // CDATA on the Vast feed, plain escaped text on CarGurus.
      const description = read("description")
        .replace(/^<!\[CDATA\[/, "")
        .replace(/]]>$/, "")
        .replace(/&apos;/g, "'")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"');

      expect(
        descriptionContradictsPrice(description, price),
        `#${stock} on ${feed.path} advertises a price other than ${price} in its description`
      ).toBe(false);
    }
  });
}

test("every feed ships the same guarded description text", async ({ request }) => {
  // Guarding in fetchInventory() means all feeds see one already-cleaned
  // description. If a feed ever reaches around it, its text diverges here.
  //
  // ⚠️ Feeds do NOT all carry the same cars. google-vehicle-ads.csv is
  // opt-in per vehicle via the merchandising switch (3 of 6 today), so the
  // comparison is keyed on stock number: check only the cars a given feed
  // actually publishes. The first version of this test assumed all six
  // everywhere and failed on a perfectly correct feed.
  const xml = await body(request, "/api/feed/vast.xml");
  const cars = [...xml.matchAll(/<listing>([\s\S]*?)<\/listing>/g)]
    .map(([, block]) => ({
      stock: (block.match(/<stock_number>(.*?)<\/stock_number>/) ?? [, ""])[1],
      desc: fingerprint(
        (block.match(/<description><!\[CDATA\[([\s\S]*?)]]><\/description>/) ?? [, ""])[1]
      ),
    }))
    .filter((c) => c.stock && c.desc.length > 60);
  expect(cars.length, "at least one car has a description to compare").toBeGreaterThan(0);

  let compared = 0;
  for (const path of CSV_FEEDS) {
    const raw = await body(request, path);
    const csv = fingerprint(raw);
    for (const car of cars) {
      if (!raw.includes(car.stock)) continue; // this feed does not carry it
      // Compare a stable slice — CSV quoting and XML escaping differ, the
      // letters do not.
      expect(
        csv.includes(car.desc.slice(0, 60)),
        `${path} carries the same description text for #${car.stock}`
      ).toBe(true);
      compared++;
    }
  }
  expect(compared, "the comparison actually ran").toBeGreaterThan(0);
});

test("the guard is live: a contradicting description would be dropped", () => {
  // Pure, and the reason the assertions above are not vacuous. This is the
  // real defect shape: copy written at one price, still live after a cut.
  expect(descriptionContradictsPrice("Priced to move at $7,999.", 5999.99)).toBe(true);
  expect(descriptionContradictsPrice("Priced to move at $5,999.99.", 5999.99)).toBe(false);
  // A comparison figure is not an asking price and must not be flagged.
  expect(descriptionContradictsPrice("Compare to $30,000 new.", 5999.99)).toBe(false);
});
