# Love Auto Group — Admin Runbook

**Audience:** Jeremiah (and Jordan once onboarded)
**Updated:** April 2026

This is your day-to-day reference for running the dealership through
the new website admin. Bookmark `https://www.loveautogroup.net/admin`
— it's the home base for everything.

---

## Your admin sections

| Section | URL | What it's for |
|---|---|---|
| **Hub** | `/admin` | Live dashboard with "at a glance" counts and nav to everything else |
| **Finance Leads** | `/admin/leads` | Every pre-qual application from the public /financing form |
| **E-Sign Sessions** | `/admin/signing` | Create + track paperless signatures with customers |
| **Merchandising** | `/admin/merchandising` | Which vehicles are featured, overlays, Text Us number |

All of these are gated by Cloudflare Access. Only emails on the
allow-list can reach them (currently: `loveautogroup@gmail.com`).

---

## Daily workflow

Open `/admin` first thing each morning. The four stat cards tell you:

1. **New leads** — haven't been contacted yet. **Respond within 5 minutes**
   during business hours (Jordan's SLA). Every additional minute cuts the
   close rate.
2. **Contacted** — mid-sequence. Run the follow-up cadence per Jordan's
   templates.
3. **Open signings** — customers have paperwork sent but haven't completed.
   If any is > 24 hours old, call the customer.
4. **Completed signings** — great, nothing to do here except file the audit.

---

## Handling a new lead

1. Click **Finance Leads** (or the New Leads card).
2. Click the lead in the list. The detail panel opens on the right.
3. Click the big green **📞 Call** button OR the blue **💬 Text** button
   (auto-fills Jordan's approved opener).
4. After talking to them, scroll down to the status updater:
   - If you spoke and they're interested → click **Contacted** and write
     a note ("left voicemail", "test drive Saturday at 2pm").
   - If they're ready to move → **Qualified**.
   - If they went cold → **Lost**.

Every status change is auditable — the name of whoever clicked + the
timestamp get logged.

**Don't delete leads.** The record stays in KV for the full retention
period (7+ years is the industry norm for auto F&I). Lost leads roll
into long-term nurture.

---

## Sending paperwork for e-signature

1. Go to **E-Sign Sessions**. Click **+ New signing session**.
2. Fill in customer name + phone or email (at least one, both is fine).
3. (Optional) Vehicle field — e.g. `2016 Honda Pilot Touring`. Shows up on
   the customer's signing page.
4. Add each document that needs to be signed:
   - Pick the document kind from the dropdown.
   - Click **Use template** — this drops in the Diane-approved boilerplate.
   - **Replace every `[bracketed]` placeholder** with the real value.
     (Sale price, trade value, mileage, etc.) The admin shows a warning
     banner when brackets are present.
   - You can also type a completely custom document instead — the
     template is just a shortcut.
5. Click **Create signing session**. You get back:
   - The signing URL
   - A pre-written SMS-ready text message
6. Copy the SMS text, paste into your phone's Messages app, send to the
   customer.
7. Watch the session status update as the customer opens → consents → signs.

**Session expires after 48 hours by default.** If the customer hasn't
opened, call them and resend.

**Don't share signing URLs publicly.** They're one-time-use tokens; the
customer's session info is behind the URL.

### What the customer experiences

- They tap the SMS link on their phone (or your iPad at the lot).
- First screen: ESIGN + IL UETA consent. They check a box and tap Agree.
- For each document: they read the body text, draw their signature, tap
  Submit. Progress bar shows `Document 2 of 4`.
- Final screen: "All signed!" with a timestamp.

**Legal audit trail captured per session:**
- When the customer opened the page (IP + user agent)
- When they gave ESIGN consent (IP + timestamp)
- Each signature: timestamp, stroke count, canvas dimensions
- When the session was completed in full (IP + user agent)

All of this is queryable by Diane if a dispute ever arises.

---

## Merchandising

See `/admin/merchandising` for the existing UI. This is Jordan's
turf — pins featured VINs, per-vehicle overlays (Carfax, warranty,
feature pills), and the Text Us phone number.

---

## Photo arrangement (automated)

When new vehicles arrive in Dealer Center, their photos import in
whatever order DealerCenter exports them — usually wrong (dashboard
first, front exterior third). The new site **auto-corrects** this via
`src/data/photoOrder.ts`.

**Today:** I hand-classified all 7 vehicles on the lot. Any new vehicle
that arrives WITHOUT a manifest entry will ship with wrong ordering.
You'll see a warning in the Cloudflare Pages build log when that happens.

**To add a new vehicle's manifest** (until Phase 2 auto-classifier is
activated — see below):

1. Look at every photo in `public/images/inventory/{slug}/` numbered
   1 through N.
2. Tell me which photos are exterior-front-3/4, side, rear, dashboard,
   etc. and in what order you want them to display.
3. I write the entry to `photoOrder.ts` and deploy.

**To activate Phase 2 (automatic classification):**

1. Enable billing on your Google Cloud `love-auto-website` project
   (or get an Anthropic API key).
2. Add `ANTHROPIC_API_KEY` (or `GOOGLE_CLOUD_API_KEY`) to Cloudflare
   Pages environment variables.
3. Whenever new photos arrive, someone runs `npm run classify:photos`
   (see `docs/photo-arrangement-rules.md`). Takes ~30 seconds for a
   full lot.

Full rules for the classifier live in `docs/photo-arrangement-rules.md`.

---

## What's NOT live yet (pending your action)

See the list at the end of the cutover runbook and in the active tasks.
Quickest wins:

1. **Cloudflare Access on /admin/\*** — **important**. Right now the
   admin API endpoints are gated (they check for a `cf-access-jwt-
   assertion` header and return 401 without one), but the admin HTML
   pages are technically served to anyone who visits `/admin/*`.
   Visitors see a loading shell with "Could not load…" errors — no PII
   leaks — but it still exposes the admin URL structure. Set up a
   Cloudflare Access application for `www.loveautogroup.net/admin/*`
   and `www.loveautogroup.net/api/admin/*`, policy = email allow-list
   (`loveautogroup@gmail.com` and any additional team emails). Under
   Cloudflare dash → Zero Trust → Access → Applications → Add.

2. **Resend API key** — currently, when a new lead comes in, the
   Cloudflare Function stores it in KV but can't send you an email
   notification. You'll only see the lead when you visit `/admin/leads`.
   Fix: sign up at resend.com, verify `loveautogroup.net`, add
   `RESEND_API_KEY` env var in Cloudflare Pages.

3. **Google Places API billing** — when enabled, the VDP customer
   reviews embed pulls live Google reviews. Right now it shows curated
   fallbacks. Enable billing in Google Cloud Console on the
   `love-auto-website` project.

4. **Bing Webmaster Tools** — their site was down when I tried to
   submit your sitemap. Rerun: `https://www.bing.com/webmasters/home`,
   add property, submit `https://www.loveautogroup.net/sitemap.xml`.

---

## If something breaks

- **Admin page returns 401/403:** Cloudflare Access is being re-auth'd.
  Re-login at the Access prompt.
- **Lead form shows 503 error:** KV namespace isn't bound. Check
  `wrangler.jsonc` has the real LEADS KV IDs (they should).
- **E-sig session 404:** Session expired (48h default) or the URL is
  malformed. Create a new one.
- **Deploy failed:** Check Cloudflare Pages build log. Most common
  cause: new vehicle added without a photo manifest entry — see above.
- **DNS got weird:** `www.loveautogroup.net` points to Cloudflare
  Pages via CNAME in Squarespace DNS. The apex is still on CarsForSale's
  IP (`198.185.165.141`) but they 301-redirect to www, which lands
  on the new site.

---

## Files to know (for when Bill joins)

| File | What |
|---|---|
| `wrangler.jsonc` | KV bindings (MERCHANDISING, LEADS, SIGNING) |
| `functions/api/finance-application.ts` | Public lead-capture POST |
| `functions/api/admin/leads.ts` | Admin GET/PATCH for leads |
| `functions/api/admin/signing-sessions.ts` | Admin POST/GET for e-sig sessions |
| `functions/api/sign/[id].ts` | Public customer signing endpoints |
| `src/data/photoOrder.ts` | Hand-maintained photo manifest |
| `src/data/signingTemplates.ts` | Boilerplate e-sig doc templates |
| `scripts/classify-photos.ts` | Phase 2 auto-classifier (needs API key) |
| `scripts/validate-photo-order.ts` | Prebuild check — no vehicle without a manifest |
| `docs/photo-arrangement-rules.md` | The permanent photo sort rule |
| `docs/production-cutover-runbook.md` | DNS cutover steps |
