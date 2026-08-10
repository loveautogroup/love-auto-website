import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright — the first automated tests in this repo.
 *
 * ⚠️ This repo had ZERO tests before 2026-08-10. The "777 / 854 passing" figure
 * in the audit notes belongs to love-auto-dms; the customer-facing site had
 * none at all. That is the gap the owner's 7-point audit named as
 * "silent rewrites": strong unit coverage elsewhere, but nothing that renders a
 * page and checks it. Every defect found on 2026-08-09/10 — prices rounded UP
 * to the wrong number, a picker showing 11 of 26 cars, 760 hidden deals — was
 * invisible to unit tests and surfaced only because a person looked.
 *
 * ── What these tests are for ──────────────────────────────────────────────
 * NOT pixel screenshots. A screenshot diff on a live inventory site fails every
 * time a car sells, which trains everyone to ignore it. These assert the things
 * that were actually WRONG and that a human had to catch:
 *   - money renders with real cents (the $13,999.99 -> "$14,000" bug)
 *   - the VDP shows the fields Google Vehicle Ads requires, above the fold
 *   - sold cars stay off the public grid
 *
 * ── Target ───────────────────────────────────────────────────────────────
 * Runs against the LIVE site by default, because this is a static export on
 * Cloudflare Pages and "what the CDN serves" is the only thing that matters —
 * a local `next build` cannot prove the deployed CSP, headers or KV-backed
 * merchandising. Override with PLAYWRIGHT_BASE_URL to point at a preview.
 */
export default defineConfig({
  testDir: "./e2e",
  // The live site is shared state; parallel navigation is fine, retries cover
  // transient CDN blips rather than masking real failures (1 retry, not 3).
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  timeout: 30_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "https://www.loveautogroup.net",
    trace: "on-first-retry",
    // A real UA: the site's CSP and Cloudflare sit in front of everything, and
    // a headless default UA occasionally trips bot heuristics.
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // Mobile matters here: most shoppers arrive on a phone, and the badge and
    // price layout have broken on mobile specifically before now.
    { name: "mobile", use: { ...devices["Pixel 7"] } },
  ],
});
