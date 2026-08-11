import { test, expect, type Page } from "@playwright/test";

/**
 * Customer-facing storefront checks.
 *
 * These assert the specific things that have actually been WRONG on this site
 * and were caught by a human rather than by a test. They are deliberately NOT
 * pixel screenshots: inventory turns over constantly, so an image diff would
 * fail every time a car sells and would be muted within a week.
 *
 * Everything is driven off the LIVE /api/inventory feed rather than hardcoded
 * slugs, so the suite keeps working as stock changes.
 */

interface FeedVehicle {
  slug: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  mileage: number;
  price: number;
  status: string;
}

async function liveInventory(page: Page): Promise<FeedVehicle[]> {
  const res = await page.request.get("/api/inventory");
  expect(res.ok(), "/api/inventory must respond").toBeTruthy();
  const body = await res.json();
  const vehicles: FeedVehicle[] = body.vehicles ?? [];
  expect(vehicles.length, "feed must not be empty — an empty feed reads to CarGurus/Google as 'this dealer has no cars'").toBeGreaterThan(0);
  return vehicles;
}

const available = (v: FeedVehicle) => v.status === "available";

/** "7499.99" -> "$7,499.99" — what the page must show, cents included. */
function expectedPrice(price: number): string {
  return price.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

test.describe("money is never rounded", () => {
  /**
   * THE BUG THIS EXISTS FOR (fixed 2026-08-09, website b3c449e): two display
   * sites rounded UP with no floor, so a car listed at $13,999.99 advertised as
   * "$14,000" — a HIGHER price than we charge, in copy that also feeds
   * structured data. Advertising a price above the real one is the direction
   * that carries actual risk.
   */
  test("VDP shows the exact price from the feed, cents and all", async ({ page }) => {
    const vehicles = (await liveInventory(page)).filter(available);
    test.skip(vehicles.length === 0, "no available vehicles on the lot right now");

    // Prefer a car whose price actually has cents — that is where the bug lives.
    const v = vehicles.find((x) => Math.round(x.price * 100) % 100 !== 0) ?? vehicles[0];
    await page.goto(`/inventory/${v.slug}/`);

    const body = await page.locator("body").innerText();
    const wanted = expectedPrice(v.price);
    expect(body, `VDP for ${v.slug} must render ${wanted}`).toContain(wanted);

    // And must NOT show the rounded-up whole-dollar form of the same number.
    if (Math.round(v.price * 100) % 100 !== 0) {
      const roundedUp = Math.ceil(v.price).toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      });
      expect(body, `must not advertise the rounded-UP price ${roundedUp}`).not.toContain(roundedUp);
    }
  });

  test("inventory grid shows the exact price too", async ({ page }) => {
    const vehicles = (await liveInventory(page)).filter(available);
    test.skip(vehicles.length === 0, "no available vehicles");

    await page.goto("/inventory/");
    const body = await page.locator("body").innerText();
    const withCents = vehicles.filter((x) => Math.round(x.price * 100) % 100 !== 0);
    test.skip(withCents.length === 0, "no priced-with-cents vehicles to check");

    for (const v of withCents.slice(0, 3)) {
      expect(body, `grid must show ${expectedPrice(v.price)} for ${v.slug}`).toContain(expectedPrice(v.price));
    }
  });
});

test.describe("VDP carries what Google Vehicle Ads requires", () => {
  /**
   * The vehicle-ads data-quality review kept failing because VDPs did not show
   * name / price / VIN / mileage / availability without scrolling (S72). If any
   * of these silently stops rendering, the ads programme breaks and nothing
   * else would tell us.
   */
  test("name, price, VIN, mileage and availability are all present", async ({ page }) => {
    const vehicles = (await liveInventory(page)).filter(available);
    test.skip(vehicles.length === 0, "no available vehicles");
    const v = vehicles[0];

    await page.goto(`/inventory/${v.slug}/`);
    const body = await page.locator("body").innerText();

    expect(body, "year").toContain(String(v.year));
    expect(body, "make").toContain(v.make);
    expect(body, "price").toContain(expectedPrice(v.price));
    expect(body, "mileage").toContain(v.mileage.toLocaleString("en-US"));
    // VIN is shown on the VDP for the feed match; case can vary.
    expect(body.toUpperCase(), "VIN").toContain(v.vin.toUpperCase());
  });
});

test.describe("sold cars stay off the storefront", () => {
  /**
   * Deliberate product rule (S85): a shopper must never find a car they cannot
   * buy. Sold vehicles ARE findable in the DMS — that is the internal tool —
   * but the public grid only shows what is for sale.
   */
  test("the grid lists only available vehicles", async ({ page }) => {
    const vehicles = await liveInventory(page);
    const sold = vehicles.filter((v) => !available(v));
    test.skip(sold.length === 0, "feed currently contains no non-available vehicles");

    await page.goto("/inventory/");
    const body = await page.locator("body").innerText();
    for (const v of sold.slice(0, 5)) {
      expect(body, `sold/pending ${v.slug} must not appear on the public grid`).not.toContain(v.vin);
    }
  });
});

test.describe("error tracking is actually wired", () => {
  /**
   * Sentry was added 2026-08-10 and the site had none before. The failure mode
   * is silence, so this asserts the SDK reached the browser — the same
   * "grep the served bundle" check that caught it being absent, automated.
   */
  test("the Sentry DSN ships in the client bundle", async ({ page }) => {
    // Fetch the chunks directly rather than listening for responses and
    // waiting on networkidle: this site runs analytics beacons that keep the
    // network busy, so networkidle never settles and the test times out on a
    // perfectly healthy page. Asking for the files is deterministic.
    const res = await page.request.get("/");
    expect(res.ok()).toBeTruthy();
    const html = await res.text();

    const chunks = [...new Set(html.match(/\/_next\/static\/[^"']+?\.js/g) ?? [])];
    expect(chunks.length, "homepage must link at least one JS chunk").toBeGreaterThan(0);

    let found = false;
    for (const c of chunks) {
      const chunk = await page.request.get(c);
      if (!chunk.ok()) continue;
      if ((await chunk.text()).includes("ingest.us.sentry.io")) {
        found = true;
        break;
      }
    }
    expect(found, "no served chunk contains the Sentry ingest host — error tracking is silently off").toBeTruthy();
  });

  test("the CSP allows Sentry, or every event is blocked", async ({ page }) => {
    // The SDK can be perfectly configured and still send nothing if the ingest
    // host is missing from connect-src. Both halves have to hold.
    const res = await page.request.get("/");
    const csp = res.headers()["content-security-policy"] ?? "";
    expect(csp, "CSP header must be present").toContain("connect-src");
    expect(csp, "connect-src must allow the Sentry ingest host").toContain("ingest.us.sentry.io");
  });
});

test.describe("VDP routing contract", () => {
  /**
   * THE BUGS THIS EXISTS FOR (all found 2026-08-10/11):
   *
   *  1. functions/inventory/[slug].ts had NEVER run in production — it was
   *     missing from public/_routes.json, and Pages only invokes Functions for
   *     paths in that include list. Every sold VDP hard-404'd instead of
   *     returning its 410 Gone page, so Search Console kept re-reporting them.
   *     1,163 retired slugs were affected.
   *
   *  2. Routing that Function exposed a latent trailing-slash bug: with
   *     `trailingSlash: true`, /inventory/<slug> (no slash) 308s to the canonical
   *     form, and the Function would have answered that 308 with a 200 bridge
   *     page — the same vehicle at two URLs. Verified by disabling the guard
   *     locally and watching the 308 turn into a 200.
   *
   *  3. DealerCenter syndicates /vdp/<DCID>-<stock>/ links to CarGurus. The site
   *     never served /vdp/*, so every CarGurus click landed on a 404.
   *
   * These assert status codes, not markup, so they survive inventory turnover.
   */

  test("a live VDP without the trailing slash redirects, never renders", async ({ page }) => {
    const vehicles = (await liveInventory(page)).filter(available);
    test.skip(vehicles.length === 0, "no available vehicles on the lot right now");
    const v = vehicles[0];

    const res = await page.request.get(`/inventory/${v.slug}`, { maxRedirects: 0 });
    expect(
      res.status(),
      `/inventory/${v.slug} must redirect to the canonical trailing-slash URL, not serve a second copy of the page`
    ).toBeGreaterThanOrEqual(300);
    expect(res.status()).toBeLessThan(400);
    expect(res.headers()["location"]).toBe(`/inventory/${v.slug}/`);
  });

  test("a retired vehicle's VDP returns 410, not 404", async ({ page }) => {
    // Straight from the DMS so this keeps working as cars sell.
    const res = await page.request.get(
      "https://dms.loveautogroup.net/api/v1/public/retired-slugs"
    );
    expect(res.ok(), "retired-slugs must respond").toBeTruthy();
    const rows: Array<{ slug: string; status: string | null }> =
      (await res.json()).data ?? [];
    test.skip(rows.length === 0, "nothing retired yet");

    const live = new Set((await liveInventory(page)).map((v) => v.slug));
    const retired = rows.find((r) => /-\d{3,}$/.test(r.slug) && !live.has(r.slug));
    test.skip(!retired, "no retired slug available to probe");

    const vdp = await page.request.get(`/inventory/${retired!.slug}/`, { maxRedirects: 0 });
    expect(
      vdp.status(),
      `${retired!.slug} is ${retired!.status} — must be 410 Gone so Google deindexes it in days rather than months`
    ).toBe(410);
  });

  test("legacy DealerCenter /vdp/ links resolve to the real VDP", async ({ page }) => {
    const vehicles = (await liveInventory(page)).filter(available);
    test.skip(vehicles.length === 0, "no available vehicles on the lot right now");
    const v = vehicles[0];
    const stock = v.slug.match(/-(\d{3,})$/)?.[1];
    test.skip(!stock, "slug carries no stock number");

    // 9079472 is the DealerCenter ID baked into every syndicated CarGurus link.
    const res = await page.request.get(`/vdp/9079472-${stock}/`, { maxRedirects: 0 });
    expect(res.status(), "legacy DC link must redirect, not 404").toBe(302);
    expect(res.headers()["location"]).toBe(`/inventory/${v.slug}/`);
  });

  test("an unknown VDP slug still 404s", async ({ page }) => {
    // The 410 path must not turn every typo into "this car was sold."
    const res = await page.request.get("/inventory/not-a-real-vehicle-999999/", {
      maxRedirects: 0,
    });
    expect(res.status()).toBe(404);
  });
});
