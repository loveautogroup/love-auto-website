import { test, expect } from "@playwright/test";
import {
  ESIGNABLE_KINDS,
  isSessionExpired,
  sessionPutOptions,
  validateCreateSessionInput,
  validateSignDocumentInput,
} from "../functions/_lib/signing";

/**
 * E-sign (review 2026-09-02 #1).
 *
 * Two pure-function checks (no browser) and one live probe. This repo has no
 * unit runner, so the helpers that decide whether a session is alive are
 * tested here, where they can at least run on every push.
 *
 * Mutations that must fail these:
 *   - `isSessionExpired` returning `exp < nowMs` (no 60 s guard) -> "inside KV's minimum" fails
 *   - `sessionPutOptions` returning {} -> "re-passes the absolute expiry" fails
 *   - removing the /sign/* rewrite from public/_redirects -> the live probe 404s again
 */

const HOUR = 3600_000;
const now = Date.parse("2026-09-02T12:00:00Z");
const at = (ms: number) => ({ expiresAt: new Date(ms).toISOString() });

test.describe("signing session expiry (pure)", () => {
  test("a session with time left is alive; one past its date is expired", () => {
    expect(isSessionExpired(at(now + 47 * HOUR), now)).toBe(false);
    expect(isSessionExpired(at(now - 1), now)).toBe(true);
    expect(isSessionExpired(at(now - 48 * HOUR), now)).toBe(true);
  });

  test("a session inside KV's 60-second minimum counts as expired (a put would be refused)", () => {
    expect(isSessionExpired(at(now + 59_000), now)).toBe(true);
    expect(isSessionExpired(at(now + 61_000), now)).toBe(false);
  });

  test("an unparsable expiry is not trusted", () => {
    expect(isSessionExpired({ expiresAt: "" }, now)).toBe(true);
    expect(isSessionExpired({ expiresAt: "soon" }, now)).toBe(true);
  });

  test("every write re-passes the absolute expiry, in seconds", () => {
    const opts = sessionPutOptions(at(now + 48 * HOUR));
    expect(opts).toEqual({ expiration: Math.floor((now + 48 * HOUR) / 1000) });
    // KV expiration is seconds since epoch, never milliseconds
    expect(opts.expiration).toBeLessThan(10_000_000_000);
  });
});

test.describe("document kinds that may be e-signed (pure)", () => {
  const customer = { firstName: "Test", lastName: "Signer", phone: "6305551212" };

  test("odometer disclosure, odometer POA, title application and 'other' are refused at mint", () => {
    for (const kind of ["odometer-disclosure", "power-of-attorney", "title-application", "other"]) {
      const v = validateCreateSessionInput({ customer, documents: [{ kind, title: "x" }] });
      expect(v.ok, kind).toBe(false);
      if (!v.ok) expect(v.issues.join(" ")).toMatch(/cannot be e-signed/);
    }
  });

  test("the same kinds are refused at signature time, even if a session somehow carried them", () => {
    for (const kind of ["odometer-disclosure", "power-of-attorney", "title-application", "other"]) {
      const v = validateSignDocumentInput({
        kind,
        signatureDataUrl: "data:image/png;base64,iVBORw0KGgo=",
        signatureMeta: { strokeCount: 3, canvasWidthCss: 400, canvasHeightCss: 150, capturedAt: new Date().toISOString() },
      });
      expect(v.ok, kind).toBe(false);
    }
  });

  test("buyer's order, as-is term and arbitration agreement are the whole allowlist", () => {
    expect([...ESIGNABLE_KINDS].sort()).toEqual(["arbitration-agreement", "as-is-disclosure", "buyers-order"]);
    const v = validateCreateSessionInput({ customer, documents: ESIGNABLE_KINDS.map((kind) => ({ kind, title: kind })) });
    expect(v.ok).toBe(true);
  });
});

test.describe("signing link (live)", () => {
  test("a /sign/<id>/ link serves the signing shell instead of a 404", async ({ page }) => {
    const res = await page.goto("/sign/00000000-0000-4000-8000-000000000000/");
    expect(res?.status(), "the /sign/* rewrite must serve the shell").toBe(200);
    // The shell then asks the API for the session and reports it missing —
    // a real message to a person, not a blank page.
    await expect(page.getByText(/not found|expired|no longer/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test("the session API refuses to be cached", async ({ request }) => {
    const res = await request.get("/api/sign/00000000-0000-4000-8000-000000000000");
    expect(res.status()).toBe(404);
    expect(res.headers()["cache-control"]).toContain("no-store");
  });
});
