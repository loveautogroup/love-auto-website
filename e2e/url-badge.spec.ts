import { test, expect, type Page } from "@playwright/test";
import { urlBadgeVisible } from "../shared/urlBadgeVisibility";

/**
 * The "LOVEAUTOGROUP.NET" badge honours the DMS "Website URL" toggle
 * (Jeremiah, 2026-09-17: "make the website honor the toggle too").
 *
 * Until then the per-vehicle switch in the DMS workspace reached the bake,
 * the DealerCenter download and the DMS preview, and the site ignored it —
 * this badge was the one mark on the page that read no config at all.
 * See shared/urlBadgeVisibility.ts for the rule these tests guard.
 *
 * Pure tests first (no network). The live test at the bottom reads the
 * feed the card and the hero read, and proves the key travels the whole
 * chain (Railway -> DMS proxy -> /api/inventory) as a boolean.
 */

const base = {
  hasBakedHero: false,
  hasRealPhotos: true,
  forcePlaceholder: false,
};

test.describe("urlBadgeVisible() — the pure rule", () => {
  test("a car with photos and no config anywhere shows the URL (today's behaviour)", () => {
    expect(urlBadgeVisible(base)).toBe(true);
    expect(urlBadgeVisible({ ...base, globalEnabled: undefined, vehicleEnabled: undefined })).toBe(true);
    expect(urlBadgeVisible({ ...base, globalEnabled: null, vehicleEnabled: null })).toBe(true);
  });

  test("the per-vehicle toggle off hides it — the thing the owner pressed", () => {
    expect(urlBadgeVisible({ ...base, vehicleEnabled: false })).toBe(false);
    expect(urlBadgeVisible({ ...base, globalEnabled: true, vehicleEnabled: false })).toBe(false);
  });

  test("the dealer default off hides it when the car carries no value", () => {
    expect(urlBadgeVisible({ ...base, globalEnabled: false })).toBe(false);
  });

  test("a per-vehicle true does not override a false global here — the feed already resolved that", () => {
    // Railway resolves global + pinned override into vehicleEnabled. If the
    // site's global-public says false while the car says true, the feed is
    // the newer read and should have won upstream; the site stays
    // conservative and hides. Either surface saying false hides.
    expect(urlBadgeVisible({ ...base, globalEnabled: false, vehicleEnabled: true })).toBe(false);
  });

  test("a baked hero never gets the HTML twin, toggle or not", () => {
    expect(urlBadgeVisible({ ...base, hasBakedHero: true, vehicleEnabled: true })).toBe(false);
  });

  test("no real photos or a forced placeholder carries no URL", () => {
    expect(urlBadgeVisible({ ...base, hasRealPhotos: false })).toBe(false);
    expect(urlBadgeVisible({ ...base, forcePlaceholder: true })).toBe(false);
  });

  test("only an explicit false hides — a stale string from KV must not", () => {
    // @ts-expect-error — a bad value must read as "not false", i.e. shown
    expect(urlBadgeVisible({ ...base, vehicleEnabled: "false" })).toBe(true);
  });
});

interface FeedVehicle {
  vin: string;
  status: string;
  websiteBadgeEnabled?: unknown;
}

async function liveInventory(page: Page): Promise<FeedVehicle[]> {
  const res = await page.request.get("/api/inventory");
  expect(res.ok(), "/api/inventory must respond").toBeTruthy();
  const body = await res.json();
  const vehicles: FeedVehicle[] = body.vehicles ?? [];
  expect(vehicles.length, "feed must not be empty").toBeGreaterThan(0);
  return vehicles;
}

test.describe("live: the toggle travels the whole chain", () => {
  test("every car on /api/inventory carries websiteBadgeEnabled as a boolean", async ({ page }) => {
    const vehicles = await liveInventory(page);
    const bad = vehicles.filter((v) => typeof v.websiteBadgeEnabled !== "boolean");
    expect(
      bad.map((v) => v.vin),
      "cars whose websiteBadgeEnabled is not a boolean (a dropped key reads as shown, silently)"
    ).toEqual([]);
  });
});
