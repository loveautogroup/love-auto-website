import { test, expect } from "@playwright/test";

/**
 * Full-screen gallery red X (owner 2026-10-04): brand red, >= 44px, labelled,
 * closes the gallery; Escape still closes it.
 * Opens via the hero on a phone viewport (the hero opens full screen on mobile).
 */
test.use({ viewport: { width: 390, height: 844 } });

async function openFirstListedGallery(page: import("@playwright/test").Page) {
  await page.goto("/inventory/");
  const link = page.locator('a[href^="/inventory/"][href$="/"]').filter({ hasNot: page.locator("text=Sold") }).first();
  await link.waitFor();
  await link.click();
  const hero = page.getByRole("button", { name: /photos fullscreen/i }).first();
  await hero.waitFor({ timeout: 15000 });
  await hero.click();
  await expect(page.getByTestId("lightbox")).toBeVisible();
}

test("red X is brand red, 44px+, and closes the full-screen gallery", async ({ page }) => {
  await openFirstListedGallery(page);
  const x = page.getByTestId("lightbox-close");
  await expect(x).toHaveAttribute("aria-label", /.+/);
  const box = await x.boundingBox();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
  await expect(x).toHaveCSS("background-color", "rgb(220, 38, 38)");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await x.click();
  await expect(page.getByTestId("lightbox")).toHaveCount(0);
});

test("Escape still closes it", async ({ page }) => {
  await openFirstListedGallery(page);
  await page.keyboard.press("Escape");
  await expect(page.getByTestId("lightbox")).toHaveCount(0);
});
