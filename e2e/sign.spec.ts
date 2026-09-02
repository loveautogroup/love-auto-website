import { test, expect } from "@playwright/test";
import {
  ACCESS_CODE_LENGTH,
  ESIGNABLE_KINDS,
  ESIGN_DEMO_WORD,
  accessCodeHash,
  documentContentHash,
  isSessionExpired,
  mintAccessCode,
  mintSignerToken,
  pdfDemoPassed,
  sessionPutOptions,
  validateConsentInput,
  validateCreateSessionInput,
  validateSignDocumentInput,
  validateVerifyCodeInput,
} from "../functions/_lib/signing";
import { ESIGN_CONSENT_SECTIONS, ESIGN_CONSENT_VERSION, esignConsentText } from "../shared/esignConsent";

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

test.describe("a completed signing is a record, not a link (pure)", () => {
  test("a signed session never reads as expired and is written without an expiry", () => {
    const signed = { ...at(now - 48 * HOUR), status: "signed" as const };
    expect(isSessionExpired(signed, now)).toBe(false);
    expect(sessionPutOptions(signed)).toEqual({});
    const archived = { ...at(now - 48 * HOUR), status: "archived" as const };
    expect(isSessionExpired(archived, now)).toBe(false);
    expect(sessionPutOptions(archived)).toEqual({});
  });

  test("an unfinished session still expires and is still written with one", () => {
    for (const status of ["created", "opened", "consented"] as const) {
      expect(isSessionExpired({ ...at(now - 1), status }, now), status).toBe(true);
      expect(sessionPutOptions({ ...at(now + HOUR), status })).toEqual({ expiration: Math.floor((now + HOUR) / 1000) });
    }
  });
});

test.describe("what was signed, and by whom (pure)", () => {
  test("a document's hash is deterministic and changes with any word of the text", async () => {
    const doc = { kind: "buyers-order" as const, title: "Buyer's Order", body: "Price $15,999.99" };
    const a = await documentContentHash(doc);
    expect(a).toMatch(/^[0-9a-f]{64}$/);
    expect(await documentContentHash({ ...doc })).toBe(a);
    expect(await documentContentHash({ ...doc, body: "Price $15,999.98" })).not.toBe(a);
    expect(await documentContentHash({ ...doc, title: "Buyers Order" })).not.toBe(a);
    expect(await documentContentHash({ ...doc, body: undefined })).not.toBe(a);
  });

  test("the access code is six digits and its hash is bound to the session id", async () => {
    for (let i = 0; i < 50; i++) expect(mintAccessCode()).toMatch(new RegExp(`^\\d{${ACCESS_CODE_LENGTH}}$`));
    const h1 = await accessCodeHash("session-a", "123456");
    expect(h1).toBe(await accessCodeHash("session-a", "123456"));
    expect(await accessCodeHash("session-b", "123456")).not.toBe(h1); // same code, another session
    expect(await accessCodeHash("session-a", "123457")).not.toBe(h1);
  });

  test("the signer token is 32 random bytes and never repeats", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 20; i++) {
      const t = mintSignerToken();
      expect(t).toMatch(/^[0-9a-f]{64}$/);
      seen.add(t);
    }
    expect(seen.size).toBe(20);
  });

  test("code input: six digits only, punctuation tolerated", () => {
    expect(validateVerifyCodeInput({ code: "123 456" })).toEqual({ ok: true, code: "123456" });
    expect(validateVerifyCodeInput({ code: "12345" }).ok).toBe(false);
    expect(validateVerifyCodeInput({ code: 123456 }).ok).toBe(false);
    expect(validateVerifyCodeInput({}).ok).toBe(false);
  });

  test("consent input needs the checkbox, the version and the PDF word; the word is case-insensitive", () => {
    expect(validateConsentInput({ consent: true, consentVersion: ESIGN_CONSENT_VERSION, pdfWord: " oaks " }).ok).toBe(true);
    expect(validateConsentInput({ consent: false, consentVersion: ESIGN_CONSENT_VERSION, pdfWord: "oaks" }).ok).toBe(false);
    expect(validateConsentInput({ consent: true, pdfWord: "oaks" }).ok).toBe(false);
    expect(validateConsentInput({ consent: true, consentVersion: ESIGN_CONSENT_VERSION, pdfWord: "" }).ok).toBe(false);
    expect(pdfDemoPassed(" oaks ")).toBe(true);
    expect(pdfDemoPassed(ESIGN_DEMO_WORD.toLowerCase())).toBe(true);
    expect(pdfDemoPassed("oak")).toBe(false);
  });

  test("the consent copy carries all five ESIGN elements and hashes stably", async () => {
    const text = esignConsentText();
    expect(ESIGN_CONSENT_SECTIONS).toHaveLength(5);
    expect(text).toMatch(/withdraw/i); // 7001(c)(1)(B)(i)
    expect(text).toMatch(/Only the documents listed/i); // (B)(ii) scope
    expect(text).toMatch(/contact details current/i); // (B)(iii)
    expect(text).toMatch(/on paper or as a PDF/i); // (B)(iv) — how to get a copy
    expect(text).toMatch(/free of charge/i); // (B)(iv) — no fee
    // Diane 2026-09-02: never promise a delivery the code does not perform.
    expect(text).not.toMatch(/one business day/i);
    expect(text).toMatch(/PDF reader/i); // (C)(i) hardware/software
    expect(text).toMatch(/type the word/i); // (C)(ii) demonstration
    expect(text).toContain(`v${ESIGN_CONSENT_VERSION}`);
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
