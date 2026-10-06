# Handoff: OBD Scan Helper — finish the API setup and first live test

**Date:** 2026-10-06
**From:** cloud session `session_01SUbYqYqd2NzY8xG9PvQcy7` (no API keys, no
Cloudflare access, DMS and several doc sites blocked by its network policy)
**To:** a session running on the owner's computer, in the local clone of
`loveautogroup/love-auto-website`
**Branch:** `ccr-451bfe0d-cjahia` — pushed, 6 commits ahead of `main`, not
merged, no pull request opened yet.

Read this first, then the earlier handoff the owner keeps at
`C:\Claude AI\Love Auto Group\memory\projects\handoff-obd-scan-tool-2026-10-06.md`
(the cloud session could not open it). If that file says a key or a
Cloudflare login already exists, use it instead of creating new ones.

---

## 1. What exists on the branch

An internal admin tool at `/admin/obd-scan` for the recon shop. A tech
photographs the scan tool screen, two AIs read the trouble codes off the
photo into an editable list, and one more click researches the codes for
that exact vehicle and writes a brief with sources.

| File | Role |
|---|---|
| `functions/api/admin/obd-scan.ts` | Cloudflare Pages Function. `POST {action:"extract"}` reads codes from photos; `POST {action:"research"}` researches them. Behind `requireAdmin()`. Raw `fetch` to both AI APIs, no npm deps. |
| `src/app/admin/obd-scan/page.tsx` | Admin page shell (static export, noindex). |
| `src/app/admin/obd-scan/ObdScanHelper.tsx` | Client UI: vehicle picker from the build snapshot or by hand, photo downscale in the browser, editable code list with reader badges, combined brief with both originals, tagged sources, copy button, tiny safe Markdown renderer. |
| `src/app/admin/AdminHub.tsx` | New nav tile. |
| `docs/admin-runbook.md` | "OBD Scan Helper (recon)" section: behaviour, secrets, costs, **"Running it free"**. |
| `.dev.vars.example` | Template of every variable the tool needs. `.dev.vars` is gitignored. |

### Design decisions already made (do not re-litigate without the owner)

- **Two requests, not one.** Reading the photo is cheap; research pays per
  web search. Codes are confirmed by the tech before research runs.
- **Both providers at every step, merged.** Owner asked for "both rather
  than a switch." Claude (Messages API + server-side `web_search_20260209`)
  and Gemini (`generateContent` + `google_search` grounding) both read the
  photo (rows merged on code+status, each tagged with `readers`) and both
  research (two briefs; Claude folds them into one with a "Where the two
  sources differ" section). Either missing/failing degrades to the other
  with a per-provider status line. No key at all → 503. Both fail → 502
  naming both reasons.
- **Models.** Claude `claude-opus-5-5`. Gemini default `gemini-3.5-flash`,
  overridable with `GEMINI_MODEL`. Free Gemini tier needs
  `GEMINI_MODEL=gemini-2.5-flash` (free grounding is only on 2.5 Flash).
- **Per-module codes.** From the first real photo (Prius, below): codes are
  listed under the module that set them, the same code appears as current
  + history, Toyota flags rows C/H/P. The reader records `module`, keeps
  both copies, maps the flags, and names flagged-but-collapsed modules.
- **Claude `fallbacks: "default"`** (beta header
  `server-side-fallback-2026-07-01`) is sent on research; on a 400 the
  request is retried without it.

### Verified in the cloud session

- `npm run lint` clean on all touched files (29 pre-existing errors
  elsewhere, untouched). `tsc --noEmit` and `npm run typecheck:functions`
  clean. Full `next build` + postbuild check pass with the page exported
  (the build needs a fresh inventory snapshot; the cloud session patched
  `syncedAt` locally and restored it — do not commit that).
- Offline harness with both APIs stubbed (13 scenarios: merge of readings,
  Gemini request shape, research prompt text, paused-turn resume, beta
  retry, merge call, tagged sources, every degraded path). Harness lived
  in the cloud scratchpad and is not in the repo.
- Markdown renderer checked against injected `<script>` text (escaped).

### NOT verified — this is the job

**No live call to either API has ever been made.** Request/response shapes
were written from the documented REST APIs. The first real run is the true
test. Most likely places for a surprise, in order:

1. Gemini `responseSchema` field spelling / rejected keys (the code strips
   `additionalProperties`; `type` values are lowercase JSON-schema style).
2. Gemini grounding metadata field names (`groundingMetadata.groundingChunks[].web.{uri,title}`,
   `webSearchQueries`). Sources list would just come back empty.
3. Claude citation field names on text blocks (`citations[].url/title`).
   Same effect: fewer sources, not a failure.
4. The `fallbacks` beta being rejected — handled by retry, check the
   status line says Claude ✓.
5. Pages Function limits: research can take 60–120 s with two providers
   plus a merge. Watch for a Cloudflare timeout; if it bites, the fix is
   streaming or splitting research into one request per provider from the
   page.

---

## 2. Secrets to add (the actual task)

Cloudflare dashboard → Workers & Pages → `love-auto-website` → Settings →
Environment variables. Type **Secret**, tick **Production and Preview**.

| Name | From | Notes |
|---|---|---|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | Runbook already mentions this key for the photo classifier; it may already exist. Check before creating. |
| `GEMINI_API_KEY` | aistudio.google.com → Get API key | Not the Google Cloud (Vision) key. |
| `GEMINI_MODEL` | plain text, optional | Only if running the free Gemini tier: `gemini-2.5-flash`. |

`ADMIN_PASSWORD` and `ADMIN_AUTH_SECRET` must already be set (every /admin
page needs them).

Wrangler is an alternative if the local machine is logged in; confirm the
exact Pages syntax with `npx wrangler pages secret --help` (Production vs
Preview handling differs by version) rather than guessing.

Never paste key values into chat; set them in the dashboard or a terminal.

---

## 3. First live test

1. After saving secrets, redeploy the branch preview (Deployments tab →
   latest `ccr-451bfe0d-cjahia` deployment → Retry, or push any commit).
2. Open the preview URL (shown on the deployment; usually
   `https://ccr-451bfe0d-cjahia.love-auto-website.pages.dev`), go to
   `/admin/obd-scan`, sign in.
3. Vehicle: the Prius is now in the DMS; if it is not in the build snapshot
   yet (snapshot is refreshed at build), enter by hand:
   **Toyota Prius, 2023+, 2.0L hybrid, FWD** (scanner platform code
   MXWH60 = 5th-gen 2.0L FWD; MXWH65 would be AWD).
4. Upload the owner's scanner photo (the one from the chat; copy also at
   the owner's side). Press *Read codes from photo*.

**Expected reading** (both readers should agree):

```json
{
  "codes": [
    { "code": "C1214", "description": "Malfunction Of Hydraulic Control System", "status": "confirmed", "module": "Brake/EPB" },
    { "code": "C1214", "description": "Malfunction Of Hydraulic Control System", "status": "history",   "module": "Brake/EPB" }
  ],
  "scannerNotes": "SRS Airbag and EMPS flagged but collapsed; scan paused mid-run; right-edge status column cut off (C / H).",
  "vehicleHint": "Toyota Prius MXWH60 12/2022-09/2024"
}
```

5. Press *Research*. Expect a combined brief, status line "Claude ✓ ·
   Gemini (Google) ✓", and a sources list tagged claude / google. Compare
   against the hand-run brief in §4. If a provider shows "failed: …", the
   text after it is the upstream error verbatim — fix the request shape in
   `functions/api/admin/obd-scan.ts`, re-run `npm run typecheck:functions`,
   push, retest.
6. When the preview is right: open a PR from `ccr-451bfe0d-cjahia` to
   `main` (the owner has not asked for one yet — ask, or do it if they say
   so). Merge → production.

---

## 4. The Prius case (owner bought it 2026-10-05) — hand-run result

Cloud session ran the Claude half by hand (same model, same web search).
Use it to sanity-check the live brief.

- **Reading:** C1214 ×2 (current + history) under Brake/EPB. SRS Airbag
  and EMPS flagged, codes not visible. Engine and Hybrid Control passed.
- **C1214 = Hydraulic Control System Malfunction**, set by the skid
  control ECU in the brake booster/master cylinder assembly when pressure
  control falls out of spec. Listed triggers: fluid leak, excessively or
  unevenly worn rotors, pressure drop during bleeding / brake work done
  without the scan-tool procedure, the booster assembly itself.
- **Most likely on this car:** a low 12 V event (three modules flagged at
  once is that signature). Check aux battery at rest ≥ 12.4 V, fluid level
  and leaks, rotor condition; clear all, drive with firm stops, rescan
  with **SRS, EMPS and Brake expanded and photographed**.
- **If C1214 returns current:** stop. Booster assembly quotes run near
  $5,000 out of warranty; a 12/2022–09/2024 build is inside or near
  Toyota's 3 yr / 36k basic warranty → Toyota dealer under warranty.
- **TSB / recall:** none for this code on gen 5. Open gen-5 campaigns are
  the rear door switch (water intrusion) and an instrument-panel software
  recall. NHTSA 25V-058 (rear brake hoses) is the Tacoma, not the Prius.
  Run the VIN on NHTSA / Toyota owners site before delivery.
- **SRS code with airbag light on = no sale until resolved.**

Sources used: autocodes.com C1214 Toyota; priuschat.com thread
"C1214 Hydraulic System malfunction" (225110); pmmonline.co.uk Blue Print
Toyota brake system; justanswer.com threads on low-12V Prius codes and
brake actuator; cars.com Prius recalls; NHTSA MC-10111629-9999 (2004–09
actuator warranty enhancement, not applicable); motorverso.com 25V058000.

---

## 5. Costs (for the owner's decision)

- Both providers: a few cents per photo read; ~15–30¢ per brief (two
  researches + combine; Claude web search ≈ 1¢/search, capped at 6).
- Free: Gemini only, `GEMINI_MODEL=gemini-2.5-flash`, no Anthropic key.
  Loses the cross-check; free tier allows Google to use submitted data.
- Effectively free with the clause removed: Gemini paid tier (card on
  file), still no Claude.
- Pending option the owner may want: a "Claude reads only" setting (Claude
  as second photo reader, no second brief) — a few cents per scan, keeps
  the both-readers check. Not built; ask before building.

---

## 6. Useful commands (local)

```bash
git fetch origin && git checkout ccr-451bfe0d-cjahia
npm ci
npm run lint                     # expect 29 pre-existing errors elsewhere, none in obd-scan files
npx tsc --noEmit -p tsconfig.json
npm run typecheck:functions
npx eslint src/app/admin/obd-scan functions/api/admin/obd-scan.ts
npm run build                    # runs prebuild: needs DMS reachable for the snapshot
```

Commit footer convention used on this branch: see `git log -6`.
