import { test, expect, type APIRequestContext } from "@playwright/test";
import {
  engineCylinders,
  engineDisplacement,
  interiorMaterial,
  resolveCylinders,
  resolveDisplacement,
} from "../shared/engineSpecs";
import { equipmentLists } from "../shared/vehicleEquipment";

/**
 * Vast / CARFAX Car Listings feed — /api/feed/vast.xml (2026-09-02).
 *
 * Split in two, on purpose:
 *
 *   PURE  — the engine-string guard, which is the part that can quietly
 *           publish a false advertising claim. Runs with no network.
 *   LIVE  — the deployed feed, because this is a static export on
 *           Cloudflare Pages and what the CDN serves is the only thing
 *           that counts. These FAIL until the Function is deployed; that
 *           is the intended sequence (see the 410 work, 2026-08-11).
 */

test.describe("vast feed — engine facts are derived, never guessed", () => {
  test("reads a real cylinder count only from an unambiguous token", () => {
    // Every engine string on the live lot as of 2026-09-02.
    expect(engineCylinders("3.7L V6")).toBe(6);
    expect(engineCylinders("2.5L 4-Cylinder")).toBe(4);
    expect(engineCylinders("3.5L 6-Cyl")).toBe(6);
    expect(engineCylinders("2.0L 4-Cyl")).toBe(4);
    // Other spellings we will meet.
    expect(engineCylinders("5.0L V8")).toBe(8);
    expect(engineCylinders("2.0L Turbo I4")).toBe(4);
    expect(engineCylinders("3.6L H6")).toBe(6);
    expect(engineCylinders("V6 3.5 Liter")).toBe(6);
  });

  test("🔴 '4V' means four VALVES and must never become four cylinders", () => {
    // #11331, a 2017 Mustang EcoBoost, really is a four-cylinder — so a
    // naive /(\d)V/ looks correct on today's whole lot and is right by
    // accident. The same badge sits on the 4.6L Mustang V8. Publishing
    // "4 cylinders" on a V8 is an advertising claim, and ICFA needs no
    // intent. Both must refuse.
    expect(engineCylinders("2.3L 4V Premium Fuel")).toBeNull();
    expect(engineCylinders("4.6L 4V")).toBeNull();
  });

  test("refuses when two readings disagree, and on junk", () => {
    expect(engineCylinders("V6 4-Cylinder")).toBeNull();
    expect(engineCylinders("Electric")).toBeNull();
    expect(engineCylinders("")).toBeNull();
    expect(engineCylinders(null)).toBeNull();
    expect(engineCylinders("V99")).toBeNull(); // outside 2..16
  });

  test("displacement is published even where the cylinder count is refused", () => {
    // The two facts are independent: we know it is a 2.3 litre, we do not
    // know from that string how many cylinders it has.
    expect(engineDisplacement("2.3L 4V Premium Fuel")).toBe("2.3 L");
    expect(engineDisplacement("3.7L V6")).toBe("3.7 L");
    expect(engineDisplacement("2.0L 4-Cyl")).toBe("2.0 L");
    expect(engineDisplacement("V6 3.5 Liter")).toBe("3.5 L");
    expect(engineDisplacement("Electric")).toBeNull();
    expect(engineDisplacement("12.0L")).toBeNull(); // outside 0.6..8.5
  });

  test("prefers the DMS's stored vPIC value over parsing the string", () => {
    // #11331: the column is right where the prose is ambiguous.
    expect(resolveCylinders(4, "2.3L 4V Premium Fuel")).toBe(4);
    // #10976: the inverse — empty column, unambiguous prose.
    expect(resolveCylinders(null, "2.5L 4-Cylinder")).toBe(4);
    // Neither source usable -> nothing. Blank beats wrong.
    expect(resolveCylinders(null, "2.3L 4V Premium Fuel")).toBeNull();
    // 0 is absent, not a number to publish (Railway allows ge=0).
    expect(resolveCylinders(0, "2.3L 4V Premium Fuel")).toBeNull();
    // Out-of-range stored value falls through to the guarded reading.
    expect(resolveCylinders(99, "3.7L V6")).toBe(6);
  });

  test("normalizes the stored displacement to the sample's format", () => {
    // Railway stores "3.7L"; Vast's sample writes "3.0 L".
    expect(resolveDisplacement("3.7L", null)).toBe("3.7 L");
    expect(resolveDisplacement(null, "2.3L 4V Premium Fuel")).toBe("2.3 L");
    expect(resolveDisplacement(null, "Electric")).toBeNull();
  });

  test("interior material comes from the colour string, or not at all", () => {
    expect(interiorMaterial("Black Leather")).toBe("Leather");
    expect(interiorMaterial("Black Leatherette")).toBe("Leatherette");
    expect(interiorMaterial("Gray Cloth")).toBe("Cloth");
    expect(interiorMaterial("Tan")).toBeNull();
    expect(interiorMaterial("Leathernecks")).toBeNull(); // word boundary
  });
});

test.describe("vast feed — equipment is a claim, not a checkbox", () => {
  test("publishes only Standard and Optional, never a guess", () => {
    const r = equipmentLists({
      abs: "Standard",
      backupCamera: "Optional",
      blindSpotMonitoring: "Not Available",
      laneDepartureWarning: null,
      keylessIgnition: "",
    });
    expect(r.standard).toEqual(["Anti-lock brakes (ABS)"]);
    expect(r.optional).toEqual(["Backup camera"]);
    // 🔴 The three that must publish NOTHING. "Not Available" is a different
    // claim from null, and neither is ours to advertise.
    const all = [...r.standard, ...r.optional].join(" ");
    expect(all).not.toMatch(/blind-spot/i);
    expect(all).not.toMatch(/lane departure/i);
    expect(all).not.toMatch(/keyless/i);
  });

  test("reads #11331's real decoded equipment", () => {
    // Exactly what the 2026-09-02 VIN decode wrote onto the Mustang.
    const r = equipmentLists({
      abs: "Standard", esc: "Standard", tractionControl: "Standard",
      backupCamera: "Standard", keylessIgnition: "Standard",
    });
    expect(r.standard).toHaveLength(5);
    expect(r.optional).toEqual([]);
    expect(r.standard).toContain("Electronic stability control");
  });

  test("airbags are location lists, not tri-state", () => {
    const r = equipmentLists({
      airbagFront: "1st Row (Driver and Passenger)",
      airbagSide: "Not Available",
      airbagCurtain: null,
    });
    expect(r.standard).toEqual(["Front airbags"]);
  });

  test("carries the dealer's own list, and never says a thing twice", () => {
    const r = equipmentLists({
      backupCamera: "Standard",
      features: ["Backup Camera", "Versatile Hatchback Cargo Space", "  "],
    });
    // "Backup Camera" typed by hand and backup_camera=Standard are one claim.
    expect(r.standard).toEqual(["Backup camera", "Versatile Hatchback Cargo Space"]);
  });

  test("a vehicle with no equipment data publishes nothing", () => {
    expect(equipmentLists({})).toEqual({ standard: [], optional: [] });
    expect(equipmentLists(null)).toEqual({ standard: [], optional: [] });
  });
});

test.describe("vast feed — the deployed file", () => {
  /**
   * Fetch the feed and REFUSE to continue unless it is really there.
   *
   * Without this, three of the tests below passed against a 404: negative
   * assertions ("never contains a dealer fee") are trivially true of an
   * error page, and a `for...matchAll` over zero listings asserts nothing
   * at all. They looked green before the Function was even deployed. A
   * test that passes against the broken state is decoration.
   */
  async function feedXml(request: APIRequestContext): Promise<string> {
    const res = await request.get("/api/feed/vast.xml");
    expect(res.status(), "the feed is deployed and readable").toBe(200);
    const xml = await res.text();
    expect(xml, "the response really is the feed").toContain("<listing>");
    return xml;
  }
  test("serves parseable XML with one listing per live car", async ({ request }) => {
    const res = await request.get("/api/feed/vast.xml");
    expect(res.status(), "feed responds 200").toBe(200);
    expect(res.headers()["content-type"]).toContain("xml");
    const xml = await res.text();
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')).toBe(true);
    expect(xml).toContain("<listings>");
    const listings = xml.match(/<listing>/g) ?? [];
    expect(listings.length, "at least one car is listed").toBeGreaterThan(0);
    // Same car count as the storefront's own inventory feed.
    const cg = await request.get("/api/feed/cargurus.xml");
    const cgCount = ((await cg.text()).match(/<vehicle>/g) ?? []).length;
    expect(listings.length).toBe(cgCount);
  });

  test("never advertises a dealer fee, CPO status, or our cost", async ({ request }) => {
    const xml = await feedXml(request);
    // No dealer fee — tax, title and license only (owner, 2026-07-06), and
    // it is a published claim on the storefront.
    expect(xml).not.toMatch(/<dealer_fee>(?!0<)/);
    // Independent dealer: no manufacturer CPO program.
    expect(xml).not.toMatch(/<cpo>\s*YES/i);
    // 🔴 invoice_price reads as DEALER COST on a dealer feed. Always empty.
    // Assert the element is EMPTY, positively. The first version of this
    // read /<invoice_price>\s*\S/ and failed on a correct feed, because the
    // "<" of the closing tag is itself a non-whitespace character.
    for (const [, block] of xml.matchAll(/<listing>([\s\S]*?)<\/listing>/g)) {
      expect(block).toContain("<invoice_price></invoice_price>");
      expect(block).toContain("<MSRP></MSRP>");
      expect(block).toContain("<dealer_fee>0</dealer_fee>");
    }
  });

  test("every price field on a listing carries the same number", async ({ request }) => {
    const xml = await feedXml(request);
    let checked = 0;
    for (const [, block] of xml.matchAll(/<listing>([\s\S]*?)<\/listing>/g)) {
      const read = (t: string) =>
        (block.match(new RegExp(`<${t}>(.*?)</${t}>`)) ?? [, ""])[1];
      const prices = new Set(
        ["price", "internet_price", "selling_price", "retail_price"].map(read)
      );
      const stock = read("stock_number");
      expect(prices.size, `#${stock} publishes one price, not several`).toBe(1);
      expect([...prices][0], `#${stock} has a price at all`).toMatch(/^\d+(\.\d{2})?$/);
      checked++;
    }
    expect(checked, "the loop actually inspected listings").toBeGreaterThan(0);
  });

  test("routes buyers to the voice line and a real VDP", async ({ request }) => {
    const xml = await feedXml(request);
    let checked = 0;
    // NOT 312-925-7520 — that is the text line, and it is what the CARFAX
    // order form carried in its lead-phone box.
    expect(xml).not.toContain("312-925-7520");
    expect(xml).not.toContain("3129257520");
    for (const [, block] of xml.matchAll(/<listing>([\s\S]*?)<\/listing>/g)) {
      expect(block).toContain("<dealer_phone>630-359-3643</dealer_phone>");
      expect(block).toMatch(
        /<url>https:\/\/www\.loveautogroup\.net\/inventory\/[^<]+\/<\/url>/
      );
      expect(block, "every listing ships at least one photo").toMatch(/<image>https:/);
      checked++;
    }
    expect(checked, "the loop actually inspected listings").toBeGreaterThan(0);
  });

  test("a read failure is a 503, never an empty catalog", async ({ request }) => {
    // The healthy path must not be a 200 carrying zero listings — that is
    // what feed consumers read as "this dealer has no cars".
    const res = await request.get("/api/feed/vast.xml");
    const xml = await res.text();
    if (res.status() === 200) {
      expect(xml).toContain("<listing>");
    } else {
      expect(res.status()).toBe(503);
      expect(res.headers()["retry-after"]).toBeTruthy();
      expect(xml).not.toContain("<listings>");
    }
  });
});
