import { test, expect, type Page } from "@playwright/test";
import { carfaxVisible } from "../shared/carfaxVisibility";

/**
 * CARFAX must FAIL CLOSED (2026-09-16, Jeremiah, live). Two newly listed
 * cars (stock 11346, 11342) had no merchandising overlay entry at all, and
 * the old rule ("both default ON when absent") showed the CARFAX badge and
 * pointed "Show me the CARFAX" at
 * `https://www.carfax.com/VehicleHistory/p/Report.cfx?partner=DVW_1&vin=…`,
 * which for a VIN not yet in CARFAX's Hot Listings index lands on their
 * "Order CARFAX Reports … $49.99" page — advertised as free, wasn't.
 *
 * See shared/carfaxVisibility.ts for the rule this guards.
 */

interface FeedVehicle {
  slug: string;
  vin: string;
  status: string;
}

interface MerchOverlay {
  carfax?: boolean;
  carfaxLinkLive?: boolean;
}

async function liveInventory(page: Page): Promise<FeedVehicle[]> {
  const res = await page.request.get("/api/inventory");
  expect(res.ok(), "/api/inventory must respond").toBeTruthy();
  const body = await res.json();
  const vehicles: FeedVehicle[] = body.vehicles ?? [];
  expect(vehicles.length, "feed must not be empty").toBeGreaterThan(0);
  return vehicles;
}

/** The same public overlay blob VDPCarfaxButton/CarfaxBadge/VDPFAQ read at
 *  runtime via /api/merchandising — the fetch behind useResolveOverlay(). */
async function liveOverlays(page: Page): Promise<Record<string, MerchOverlay>> {
  const res = await page.request.get("/api/merchandising");
  if (res.status() === 204) return {}; // KV empty — every car fails closed
  expect(res.ok(), "/api/merchandising must respond").toBeTruthy();
  const body = await res.json();
  return body.overlays ?? {};
}

const carfaxHref = (vin: string) =>
  `Report.cfx?partner=DVW_1&vin=${vin}`;

test.describe("carfaxVisible() — the pure rule", () => {
  test("no overlay entry at all = hidden (the exact defect: two new cars had none)", () => {
    expect(carfaxVisible(undefined)).toBe(false);
    expect(carfaxVisible(null)).toBe(false);
    expect(carfaxVisible({})).toBe(false);
  });

  test("carfaxLinkLive present but not true = hidden", () => {
    expect(carfaxVisible({ carfaxLinkLive: false })).toBe(false);
    // @ts-expect-error — a bad value from a stale KV row must still fail closed
    expect(carfaxVisible({ carfaxLinkLive: "true" })).toBe(false);
  });

  test("carfaxLinkLive: true is what actually shows CARFAX", () => {
    expect(carfaxVisible({ carfaxLinkLive: true })).toBe(true);
    expect(carfaxVisible({ carfax: true, carfaxLinkLive: true })).toBe(true);
  });

  test("the dealer's own carfax:false opt-out always wins, even with a live link", () => {
    expect(carfaxVisible({ carfax: false, carfaxLinkLive: true })).toBe(false);
  });

  // Mutation proof: the bug being fixed here was exactly `!== false` instead
  // of `=== true`. If carfaxVisible() regresses to that shape, this fails.
  test("mutation guard — carfaxLinkLive:undefined must not read as live", () => {
    const bug = (o: MerchOverlay) =>
      o.carfax !== false && o.carfaxLinkLive !== false; // the old, wrong rule
    const real = carfaxVisible({});
    const buggy = bug({});
    expect(real).toBe(false);
    expect(buggy).toBe(true); // proves the two rules actually differ
    expect(real).not.toBe(buggy);
  });
});

test.describe("live site — CARFAX only renders where the overlay says it's live", () => {
  test("every vehicle's VDP agrees with carfaxVisible(overlay)", async ({ page }) => {
    const [vehicles, overlays] = await Promise.all([
      liveInventory(page),
      liveOverlays(page),
    ]);

    const withVerdict = vehicles.filter((v) => v.vin in overlays);
    const withoutVerdict = vehicles.filter((v) => !(v.vin in overlays));

    // The bug's exact shape: a car with no overlay row at all must show
    // nothing CARFAX-branded — check every one currently on the lot, not
    // just a sample, since this is the case that actually broke.
    for (const v of withoutVerdict) {
      await page.goto(`/inventory/${v.slug}/`);
      const links = await page.locator(`a[href*="${carfaxHref(v.vin)}"]`).count();
      expect(
        links,
        `${v.slug} (${v.vin}) has no merchandising overlay — must show zero CARFAX links, not send shoppers to CARFAX's paid order page`
      ).toBe(0);
    }

    // Sample the ones WITH a verdict (capped — this checks the wiring, not
    // the whole lot) and confirm each side of the rule.
    for (const v of withVerdict.slice(0, 8)) {
      const expected = carfaxVisible(overlays[v.vin]);
      await page.goto(`/inventory/${v.slug}/`);
      const links = await page.locator(`a[href*="${carfaxHref(v.vin)}"]`).count();
      if (expected) {
        expect(links, `${v.slug} has carfaxLinkLive:true — must show at least one CARFAX link`).toBeGreaterThan(0);
      } else {
        expect(links, `${v.slug}'s overlay does not confirm a live report — must show zero CARFAX links`).toBe(0);
      }
    }
  });

  test("a car with no CARFAX verdict does not claim one in its FAQ structured data", async ({ page }) => {
    const [vehicles, overlays] = await Promise.all([
      liveInventory(page),
      liveOverlays(page),
    ]);
    const withoutVerdict = vehicles.filter((v) => !(v.vin in overlays));
    test.skip(withoutVerdict.length === 0, "every live vehicle currently has a CARFAX verdict");

    for (const v of withoutVerdict.slice(0, 3)) {
      await page.goto(`/inventory/${v.slug}/`);
      const body = await page.locator("body").innerText();
      expect(
        body,
        `${v.slug} has no CARFAX verdict — the FAQ must not claim a free report on this car's photo`
      ).not.toMatch(/free carfax history report/i);
    }
  });
});
