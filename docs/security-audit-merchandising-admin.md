# Security Audit — Merchandising Admin (Phase 2 + 3)

**Auditor:** Sam (Cybersecurity)
**Audit date:** April 20, 2026
**Branch audited:** `feature/vehicle-card-badges`
**Commits:** ace1a6c (Phase 1) and 55645a9 (Phase 2+3)

## Executive summary

The merchandising admin has a **solid security posture for the sensitivity of the data it handles** (merchandising copy and VIN ordering — no PII, no financial data, no credentials). Auth is correctly delegated to Cloudflare Zero Trust Access, there's a defense-in-depth JWT check, and inputs are validated server-side with sensible caps. One medium-severity finding (defense-in-depth text sanitization) was fixed inline during this audit. No critical or high-severity findings. Approved to ship once the Cloudflare dashboard setup in `docs/merchandising-admin-setup.md` is completed.

## Scope

Code and config reviewed:

- `functions/api/merchandising.ts` (public GET)
- `functions/api/admin/merchandising.ts` (authed GET + POST)
- `functions/_lib/validation.ts` (input validator)
- `src/app/admin/merchandising/page.tsx`
- `src/app/admin/merchandising/MerchandisingAdmin.tsx`
- `wrangler.jsonc` (KV binding)
- `public/_headers` (HTTP response headers)
- `next-sitemap.config.js` (robots / sitemap scoping)
- `docs/merchandising-admin-setup.md` (Cloudflare Access + KV setup guide)

Not in scope for this audit: the rest of the website (carried over from prior reviews), customer-facing forms, payment processing (none present).

## Data sensitivity

| Data in this system     | Classification | Risk if leaked                                   |
|-------------------------|----------------|--------------------------------------------------|
| VIN list, feature pills | Public         | None — same data already on public inventory     |
| Warranty copy           | Internal       | None — same copy appears on public cards         |
| Admin email (audit log) | Internal       | Minor — already known via CF Access configuration|

**No customer PII, no financial data, no authentication secrets flow through this subsystem.** This frames the appropriate level of rigor: it's a low-sensitivity admin tool, not a PII data store.

## Findings

### Medium — M1: No character-set enforcement on user-supplied display text (FIXED during audit)

**Severity:** Medium
**Status:** Fixed in this audit. `functions/_lib/validation.ts` updated.
**Description:** The validator enforced length caps on `defaultWarranty`, `warrantyOverride`, and `featurePills` but did not reject HTML-dangerous characters (`<`, `>`, `"`) or control characters. React's default JSX escaping prevents XSS for the current site renders, but if any future consumer renders these values unescaped — email templates, PDFs, social preview images, Bill's future DMS admin screens — a malicious admin could inject markup.

**Risk (before fix):** Low-realistic. Only CF Access-allowed users can submit, and current render paths are React-escaped.

**Fix applied:**
- New helper `assertSafeText()` rejects `<`, `>`, `"`, and ASCII control characters
- Applied to `defaultWarranty`, per-vehicle `warrantyOverride`, and `featurePills`
- Pill text allows a single `\n` (legitimate two-line pill formatting); one-newline cap enforced to prevent layout abuse

**Verification:** `npx tsc --noEmit -p functions/tsconfig.json` passes. `npm run build` passes.

### Medium — M2: No CSP header site-wide (pre-existing)

**Severity:** Medium
**Status:** Pre-existing gap, not introduced by this change. Out of scope for this audit but flagged.
**Description:** `public/_headers` sets several security headers (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy) but no `Content-Security-Policy`. A CSP would add another layer of XSS defense sitewide.

**Recommendation:** Separate task — Charlotte adds a CSP. Suggested directives:
```
Content-Security-Policy: default-src 'self'; img-src 'self' data: https:; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.carfax.com; frame-ancestors 'none';
```

(May need refinement based on Google Analytics or other third-party scripts in play.)

### Low — L1: Console errors not routed to structured logging

**Severity:** Low
**Description:** Failed KV reads/writes are `console.error()`d. On Cloudflare Pages these surface in the Cloudflare dashboard logs but aren't aggregated with alerting.

**Recommendation:** When usage grows, add Cloudflare Analytics alerting on admin endpoint error rate > 5% over 15 min. For a 2-user admin, this is overkill right now.

### Low — L2: `wrangler.jsonc` ships with placeholder KV IDs

**Severity:** Low (deploy-time concern, not security)
**Description:** `wrangler.jsonc` contains `"id": "REPLACE_WITH_PRODUCTION_KV_ID"`. If deployed without replacement, KV binding fails silently and the admin save returns 503.

**Recommendation:** Already handled — `docs/merchandising-admin-setup.md` walks through this. Consider adding a CI check that fails the build if `REPLACE_WITH_` appears in the file.

### Low — L3: No origin / referer verification on admin POST

**Severity:** Low
**Description:** The admin POST relies on the Cloudflare Access session cookie for auth. A CSRF attack would require a malicious site to trigger a POST from an authenticated user's browser, but because CF Access requires the `cf-access-jwt-assertion` header (which a cross-origin request can't forge), the realistic attack surface is narrow.

**Recommendation:** Adding an Origin header check would be cheap defense in depth. Low priority given the architecture.

## Positive findings

These are things that were done right and worth reinforcing.

1. **Auth delegated to Cloudflare Zero Trust Access** — zero custom authentication code means zero custom auth bugs. Email allow-list, magic-link sessions, 24 h default expiration. Appropriate sensitivity level for this data.

2. **Defense-in-depth JWT check in the admin POST handler** — catches accidental Access misconfiguration (e.g. forgetting to include `/api/admin/*` in the application paths).

3. **Server-stamped audit fields** — `updatedBy` is pulled from the `cf-access-authenticated-user-email` header, not from the client payload. Clients can't forge audit trail.

4. **Body size capped at 64 KB** — prevents a slipped-through attacker from filling KV.

5. **Admin routes explicitly excluded** from:
   - Sitemap (`next-sitemap.config.js`)
   - Robots.txt (newly-added disallow rule)
   - Cached responses (`Cache-Control: no-store`)
   - Search indexing (`X-Robots-Tag: noindex, nofollow`)

6. **Typed validator mirrors the client schema** — runtime type safety matches compile-time shape.

7. **Cloudflare Workers types properly scoped** — `functions/tsconfig.json` includes only `@cloudflare/workers-types`, keeping DOM types out of the Worker runtime. Main `tsconfig.json` excludes `functions/` to avoid cross-contamination.

8. **Keyboard-accessible admin UI** — reordering uses up/down buttons, all controls have `aria-label` attributes. ADA posture strong.

9. **No PII, no credentials, no financial data flows through this subsystem** — significantly narrows the blast radius of any bug.

10. **Auth cookie sent with `credentials: "include"`** — explicit, correct for cross-origin-adjacent architecture.

## Prioritized action plan

### Ship now (done during audit)
- ✅ M1 fix: HTML/control-char validator — already committed in this branch

### Before production merge
- [ ] Complete Cloudflare Access + KV setup per `docs/merchandising-admin-setup.md`
- [ ] After deploying, manually verify:
  - Anonymous `GET /admin/merchandising` → CF Access login page
  - Anonymous `POST /api/admin/merchandising` → 401
  - Authed save → 200 and config visible on `/inventory` within 60 sec
- [ ] Sam reviews the Cloudflare Access configuration once it's live

### Follow-up task (separate branch, not blocking)
- [ ] M2: Add site-wide CSP header in `public/_headers`. Charlotte owns the implementation; Sam signs off on directives.

### Future (growth-driven, not needed yet)
- [ ] L1: Structured logging + alerting on admin endpoint error rate
- [ ] L2: CI lint check for `REPLACE_WITH_` placeholders in config files
- [ ] L3: Origin header check on admin POST for CSRF defense in depth

## Sign-off

**Sam's recommendation:** approved for production merge after Cloudflare dashboard setup is complete and the manual verification checks above pass. No critical or high-severity findings. Architecture cleanly isolates the admin surface and correctly punts authentication to a proven external service (Cloudflare Access). Charlotte's implementation is solid.
