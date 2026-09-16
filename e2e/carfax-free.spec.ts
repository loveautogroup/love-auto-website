import { test, expect, type Page } from "@playwright/test";
import { carfaxVisible } from "../shared/carfaxVisibility";

/**
 * Daily proof that the free CARFAX report we advertise is actually free.
 *
 * 2026-09-16, Jeremiah, live: "We are still advertising carfax with all
 * cars on the website even though some still go to the website that asks
 * customers to pay... We are false advertising a free report, which is
 * wrong!" — the FIRST-line fix (95189ae, then f18f8b2 the same day) made
 * carfaxVisible() FAIL CLOSED: the badge/button/FAQ now only render when
 * the daily carfax-link-check Routine has stamped `carfaxLinkLive: true`
 * for that VIN, so a car we haven't confirmed is showing on our own site.
 *
 * This spec is the OTHER half — it does not trust that Routine's verdict,
 * it RE-CHECKS it. It reads every vehicle we currently show the badge on
 * and opens the actual DVW report link in a real browser, the same click a
 * shopper makes. carfax.com's own behaviour is what decides pass/fail:
 *   PASS — landing page title starts with "CARFAX Vehicle History Report"
 *          (a real, free report rendered).
 *   FAIL — secure.carfax.com, or a title containing "Get a CARFAX Report
 *          Now" (their $49.99 paid-order page) — the exact false-advertising
 *          shape the owner flagged, on a car our own site says is live.
 *
 * Runs once a day (.github/workflows/carfax-free-report-check.yml, 15:00
 * UTC) — not on every push. It hits carfax.com, a third party, for at most
 * one request per currently-badged vehicle (this lot runs a few dozen cars
 * at a time); a daily check at normal shopper traffic is proportionate.
 *
 * See shared/carfaxVisibility.ts for the rule that decides WHICH cars this
 * spec checks, and scripts/check-carfax-gating.mjs for the guard that keeps
 * every render path going through that one rule.
 */

interface FeedVehicle {
  slug: string;
  vin: string;
  status: string;
  stockNumber?: string;
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

/** Same public overlay blob the badge/button/FAQ read at runtime via
 *  /api/merchandising — the fetch behind useResolveOverlay(). */
async function liveOverlays(page: Page): Promise<Record<string, MerchOverlay>> {
  const res = await page.request.get("/api/merchandising");
  if (res.status() === 204) return {}; // KV empty — every car fails closed, nothing to check
  expect(res.ok(), "/api/merchandising must respond").toBeTruthy();
  const body = await res.json();
  return body.overlays ?? {};
}

const dvwReportUrl = (vin: string) =>
  `https://www.carfax.com/VehicleHistory/p/Report.cfx?partner=DVW_1&vin=${vin}`;

test.describe("CARFAX free-report check — the link must actually be free", () => {
  test("every vehicle we currently show the badge on serves a real free report on carfax.com", async ({
    page,
  }) => {
    const [vehicles, overlays] = await Promise.all([
      liveInventory(page),
      liveOverlays(page),
    ]);

    const badged = vehicles.filter((v) => carfaxVisible(overlays[v.vin]));

    test.skip(
      badged.length === 0,
      "no vehicle currently shows the CARFAX badge — nothing to verify against carfax.com today"
    );

    const failures: string[] = [];

    for (const v of badged) {
      const label = v.stockNumber ? `stock ${v.stockNumber}` : v.slug;
      const url = dvwReportUrl(v.vin);

      // Fresh page per vehicle — carfax.com may set state (cookies, a
      // consent interstitial) that would otherwise leak between checks.
      const carfaxPage = await page.context().newPage();
      try {
        await carfaxPage.goto(url, { waitUntil: "domcontentloaded", timeout: 20_000 });
        const title = await carfaxPage.title();
        const landedOnSecure = carfaxPage.url().includes("secure.carfax.com");
        const isPaidOrderPage =
          landedOnSecure || /get a carfax report now/i.test(title);
        const isRealReport = title.startsWith("CARFAX Vehicle History Report");

        if (isPaidOrderPage) {
          failures.push(
            `${label} (VIN ${v.vin}): our badge is LIVE but the link lands on CARFAX's PAID order page ` +
              `(title="${title}", url=${carfaxPage.url()}) — this is the exact false-advertising defect. ` +
              `Either CARFAX hasn't ingested this VIN yet (fine — the daily link-check Routine should have ` +
              `caught this and set carfaxLinkLive:false, but hasn't) or the badge is showing when it shouldn't.`
          );
        } else if (!isRealReport) {
          failures.push(
            `${label} (VIN ${v.vin}): landing page title "${title}" does not start with ` +
              `"CARFAX Vehicle History Report" (url=${carfaxPage.url()}) — cannot confirm this is a real free report.`
          );
        }
      } catch (err) {
        failures.push(
          `${label} (VIN ${v.vin}): failed to load ${url} — ${(err as Error).message}`
        );
      } finally {
        await carfaxPage.close();
      }
    }

    expect(
      failures,
      `${failures.length} of ${badged.length} badged vehicles do not serve a real free CARFAX report:\n\n` +
        failures.join("\n\n")
    ).toEqual([]);
  });
});
