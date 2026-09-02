import { test, expect } from "@playwright/test";

/**
 * Financing forms — the vehicle picker (2026-09-01).
 *
 * Every credit application on file had reached the DMS with year / VIN /
 * stock / price empty because the form only had a free-text box. Both forms
 * on /financing now offer the live inventory as a dropdown, keep "another
 * vehicle" as the free-text fallback, and preselect the car a VDP apply link
 * named. Runs against production (PLAYWRIGHT_BASE_URL overrides).
 */

test.describe("financing — vehicle picker", () => {
  test("offers the current inventory as a dropdown, plus 'another vehicle'", async ({ page }) => {
    await page.goto("/financing/");
    const select = page.locator('select[name="vehiclePick"]').first();
    await expect(select).toBeVisible();
    // placeholder + at least one real car + "another vehicle"
    await expect.poll(async () => select.locator("option").count(), { timeout: 15_000 }).toBeGreaterThanOrEqual(3);
    const texts = await select.locator("option").allTextContents();
    expect(texts.some((t) => /#\d{5}/.test(t)), "an option carries a real stock number").toBe(true);
    expect(texts.some((t) => /another vehicle|otro veh/i.test(t)), "the free-text fallback is offered").toBe(true);
    // no option has been rounded — prices print with cents
    for (const t of texts) {
      if (/\$/.test(t)) expect(t).toMatch(/\$[\d,]+\.\d{2}/);
    }
  });

  test("'another vehicle' reveals the free-text box; choosing a car hides it", async ({ page }) => {
    await page.goto("/financing/");
    const select = page.locator('select[name="vehiclePick"]').first();
    await expect.poll(async () => select.locator("option").count(), { timeout: 15_000 }).toBeGreaterThanOrEqual(3);
    await select.selectOption("__other__");
    await expect(page.locator('input[name="vehicleOtherText"]').first()).toBeVisible();
    const firstCar = await select.locator("option").nth(1).getAttribute("value");
    expect(firstCar).toBeTruthy();
    await select.selectOption(firstCar as string);
    await expect(page.locator('input[name="vehicleOtherText"]').first()).toHaveCount(0);
  });

  test("a VDP apply link preselects that car", async ({ page }) => {
    // Find a live stock number the same way the site does.
    const res = await page.request.get("/api/inventory");
    expect(res.ok()).toBe(true);
    const body = (await res.json()) as { vehicles: Array<{ vin: string; stockNumber?: string; status: string }> };
    const car = body.vehicles.find((v) => v.status === "available" && v.stockNumber);
    test.skip(!car, "no available vehicle with a stock number right now");
    await page.goto(`/financing/?stock=${car!.stockNumber}&vin=${car!.vin}`);
    const select = page.locator('select[name="vehiclePick"]').first();
    await expect.poll(async () => select.inputValue(), { timeout: 15_000 }).toBe(car!.vin);
  });
});
