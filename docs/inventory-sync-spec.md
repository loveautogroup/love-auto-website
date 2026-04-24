# Inventory Sync — Dealer Center → Website

**Spec for:** Bill (engineer)
**Owner:** Jeremiah (product); Bill (engineer); Sam (security review)
**Status:** Approved Phase 1 / Option A approach. Ready to build.
**Estimated effort:** 1–1.5 weeks for MVP, +3 days for hardening
**Updated:** April 2026

---

## Goal

Replace the hardcoded `src/data/inventory.ts` with a live, auto-refreshing
inventory pulled from Dealer Center. When a vehicle is added, edited,
or sold in Dealer Center, the change appears on `www.loveautogroup.net`
within 15 minutes — without anyone touching the website code.

## Success criteria

- [ ] New vehicle added in Dealer Center → visible on the site within 15 min, with photos.
- [ ] Vehicle marked sold in Dealer Center → disappears from `/inventory` within 15 min.
- [ ] Price change in Dealer Center → updates on the VDP within 15 min.
- [ ] If Dealer Center / the sync worker fails, the site continues to render the last-known-good inventory (no blank pages, no 500s).
- [ ] Photo URLs stay stable for SEO — same image at the same URL across syncs whenever possible.
- [ ] Jordan's merchandising overlay (featured VINs, custom pills, hidden flag, market estimate) is preserved across syncs and never overwritten.
- [ ] Sam-approved: no Dealer Center credentials in client-side code, all secrets in Cloudflare environment variables.

---

## Architecture overview

```
┌──────────────────┐      every 15 min     ┌──────────────────┐
│  Dealer Center   │  ─────────────────►  │  Cron Worker      │
│  (source of      │   inventory feed      │  (CF Worker on a  │
│   truth)         │                       │   schedule)       │
└──────────────────┘                       └────────┬─────────┘
                                                    │
                                                    ▼
                                           ┌──────────────────┐
                                           │  Cloudflare KV   │
                                           │  INVENTORY       │
                                           │  (canonical state│
                                           │   for site)      │
                                           └────────┬─────────┘
                                                    │
                                                    ▼
                                           ┌──────────────────┐
                                           │  Cloudflare R2   │
                                           │  (vehicle photos │
                                           │   downloaded     │
                                           │   from DC)       │
                                           └────────┬─────────┘
                                                    │
                                                    ▼
                                           ┌──────────────────┐
                                           │  www.loveauto-   │
                                           │  group.net       │
                                           │  (Pages site,    │
                                           │   reads from KV) │
                                           └──────────────────┘
```

The Cron Worker is the single source of inventory writes; KV is the
canonical read path for the site. The Pages site itself stays static —
it just reads from KV at request time via a Pages Function (similar to
the merchandising sync pattern already in place).

---

## Data source: Dealer Center

Dealer Center is a major DMS — they syndicate inventory to CarGurus,
Cars.com, AutoTrader, etc. They almost certainly have one of the
following ways to pull inventory:

### Option 1: Syndication feed (preferred — try this first)

Most likely format: an XML or CSV feed at a stable URL, refreshed
nightly or hourly by Dealer Center. Industry standard format is the
**ADF/IMS** feed (Automotive Dealer Format) or a custom dealer XML.

**To get it:** Jeremiah contacts Dealer Center support. Ask:

> "I need to syndicate my inventory to my own dealership website
> (loveautogroup.net). Do you provide an XML or CSV feed I can pull from
> on a schedule? If yes, please send me the feed URL and any required
> auth credentials."

Almost every DMS does this for free. They'll likely send back:
- A feed URL like `https://feed.dealercenter.net/loveautogroup/inventory.xml`
- Optional basic auth credentials or an access token

**Schema to expect:** typically wraps each vehicle in `<vehicle>` with
fields like `<vin>`, `<year>`, `<make>`, `<model>`, `<trim>`, `<mileage>`,
`<price>`, `<status>`, and a `<photos>` array of URLs.

### Option 2: Public dealer-website iframe / page scraping

If Dealer Center won't provide a feed (unlikely), they probably host a
public inventory page somewhere — historically these have been at URLs
like `https://app.dealercenter.net/dealer/{dealer_id}/inventory` or
exposed as a website widget. We scrape that page on the same 15-min
cadence. Less reliable (HTML changes break parsing) but workable.

### Option 3: Browser automation (last resort)

If neither feed nor scrape works, run Playwright in a Cloudflare
container that logs into Dealer Center as Jeremiah and screen-scrapes.
Avoid if possible — fragile and a maintenance burden.

**Recommendation:** start by writing to Dealer Center support. The
feed is by far the cleanest path. If it takes more than 48h to hear
back, fall back to Option 2.

---

## Implementation

### 1. Cron Worker — `workers/inventory-sync/`

A standalone Cloudflare Worker (separate deployment from Pages) that:

- Runs on a cron trigger (every 15 minutes)
- Fetches the Dealer Center feed (XML or whatever format)
- Parses each vehicle into our internal shape (see Schema below)
- Diffs against current KV state to detect adds / updates / deletes / status changes
- Downloads any new photo URLs to R2 (skip already-downloaded ones — content-hash dedup)
- Writes the canonical inventory list to KV under `inventory:current`
- Writes a sync-log entry to `inventory:log:{timestamp}` with summary (counts, errors)

```toml
# workers/inventory-sync/wrangler.toml
name = "love-auto-inventory-sync"
main = "src/index.ts"
compatibility_date = "2026-04-20"

[triggers]
crons = ["*/15 * * * *"]

[[kv_namespaces]]
binding = "INVENTORY"
id = "<create>"
preview_id = "<create>"

[[r2_buckets]]
binding = "PHOTOS"
bucket_name = "love-auto-vehicle-photos"

[vars]
DEALER_CENTER_FEED_URL = "<set via wrangler secret>"
```

Secret env vars (set via `wrangler secret put`):
- `DEALER_CENTER_FEED_URL` — the URL Jeremiah gets from DC support
- `DEALER_CENTER_FEED_AUTH` — basic-auth string or token, if any

### 2. KV schema

```typescript
// inventory:current — the live inventory snapshot
interface InventorySnapshot {
  syncedAt: string;          // ISO timestamp of last successful sync
  syncedBy: "cron";          // future: "manual" if Bill triggers
  vehicles: SyncedVehicle[];
}

interface SyncedVehicle {
  vin: string;               // primary key
  stockNumber?: string;      // DC's internal ID
  slug: string;              // generated: "{year}-{make}-{model}-{trim}-{stock}"
  year: number;
  make: string;
  model: string;
  trim: string;
  bodyStyle: string;
  drivetrain: "AWD" | "FWD" | "RWD" | "4WD";
  transmission: string;
  fuelType: string;
  engine: string;
  exteriorColor: string;
  interiorColor: string;
  mileage: number;
  price: number;
  status: "available" | "sale-pending" | "sold";
  features: string[];
  daysOnLot: number;         // computed from dateInStock
  dateInStock: string;       // ISO date
  // Photo URLs in R2 — stable URLs across syncs
  images: string[];          // ["https://photos.loveautogroup.net/{vin}/01.jpg", ...]
  // Audit
  dealerCenterFirstSeen: string; // when we first saw this VIN
  dealerCenterLastSeen: string;  // when we last saw it in the feed
}

// inventory:log:{ISO} — per-sync audit trail
interface SyncLog {
  syncedAt: string;
  durationMs: number;
  vehiclesIn: number;        // count from DC feed
  vehiclesOut: number;       // count after sync (excluded sold)
  added: string[];           // VINs added this run
  updated: string[];         // VINs whose data changed
  removed: string[];         // VINs no longer in feed (marked sold)
  photosDownloaded: number;
  errors: string[];
}
```

Keep `inventory:log:*` entries with a 30-day TTL so we have a rolling
audit window without unbounded KV growth.

### 3. Photo pipeline (R2)

When the sync sees a new photo URL from Dealer Center:

1. Compute SHA-256 of the URL (not the content — DC URLs are stable)
2. R2 key: `vehicles/{vin}/{position}.jpg` (e.g. `vehicles/5FNYF6H9XGB041495/01.jpg`)
3. Check if the R2 object exists — if yes, skip the download
4. If not, fetch from DC, validate (`Content-Type: image/*`, size < 5MB)
5. Re-encode through Sharp to strip EXIF + ensure consistent JPEG quality
6. Write to R2 with `Cache-Control: public, max-age=31536000, immutable`
7. Generate a WebP variant alongside the JPEG (same key + `.webp`)

Public R2 bucket bound to `photos.loveautogroup.net` subdomain. Site
references images at `https://photos.loveautogroup.net/vehicles/{vin}/{N}.jpg`.

**Photo ordering — UPDATED Apr 23 2026:** Jeremiah hand-arranges
photos in DealerCenter's Media tab. **The order DC ships them in the
feed IS the order the website displays. Verbatim.** No re-classification.

Concretely: when the worker parses the feed, the `<photos>` array's
existing element ordering becomes the `images` array's ordering on
SyncedVehicle. The photo-pipeline writes them to R2 with sequential
positions matching that order (`01.jpg`, `02.jpg`, ...) and the site
displays them in that order.

The Phase 2 Vision API classifier (`scripts/classify-photos.ts`)
becomes a **fallback / sanity check only** — it runs after the DC
order is applied and surfaces a warning on `/admin/sync-status` if
slot 1 looks like anything other than exterior-front-3/4. Jeremiah
fixes those cases by re-ordering in DC, not by overriding on the
website. The `src/data/photoOrder.ts` manifest stays in the repo as
fallback for vehicles where DC photo order is unavailable (e.g.
imported from a non-DC source).

See `docs/photo-arrangement-rules.md` for the full canonical rule
including Jeremiah's reference vehicles.

### 4. Pages Function — `/api/inventory`

Mirrors the existing `/api/merchandising` pattern: server-side reads
the KV snapshot, returns to the site. Site fetches at request time
(or via static export with hourly revalidation).

```typescript
// functions/api/inventory.ts
export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  const snapshot = await env.INVENTORY.get("inventory:current", { type: "json" });
  if (!snapshot) {
    return new Response(null, { status: 204 }); // client falls back to baked-in data
  }
  return Response.json(snapshot, {
    headers: { "Cache-Control": "public, max-age=300, s-maxage=300" },
  });
};
```

### 5. Site changes

Replace `src/data/inventory.ts` direct imports with a hook that:

1. At build time: snapshots KV via build-time fetch and bakes in the
   result (so the static site has fresh data).
2. At runtime (client-side): polls `/api/inventory` every 5 min for
   in-page updates without a page reload.

Files to update:
- `src/app/page.tsx` (homepage featured + on-the-lot)
- `src/app/inventory/page.tsx` (inventory grid)
- `src/app/inventory/[slug]/page.tsx` (VDP — needs `generateStaticParams`
  to read from KV at build time too)
- `src/app/inventory/used-{make}/page.tsx` (filtered grids)
- `src/app/serving/[town]/page.tsx`
- `src/app/free-carfax-villa-park/page.tsx`
- `src/app/sitemap.ts` (sitemap generation)
- `scripts/validate-photo-order.ts` (validates against KV, not file)

The merchandising layer (`src/data/merchandising.ts` + KV) **stays
unchanged** — it's a separate overlay applied AFTER inventory. Sync
reads inventory; Jordan's overlay reads merchandising. Compose at
render time.

### 6. Build-time snapshot fallback

If the Cron Worker is down, the site must still render. At build time,
run a script that fetches the latest KV snapshot and writes it to
`src/data/inventory.fallback.json`. The site reads from KV first, falls
back to this baked-in JSON if KV returns null. Last-known-good state
ships with every build.

```json
// src/data/inventory.fallback.json — committed to repo
// Regenerated on every build; gitignored if you prefer
{
  "syncedAt": "...",
  "vehicles": [...]
}
```

### 7. Failure modes + monitoring

| Failure | Effect | Recovery |
|---|---|---|
| Dealer Center feed down | Cron sees error, skips sync, logs to `inventory:log:*` | Next run picks up; site continues serving last KV snapshot |
| Cron Worker crashes mid-run | Partial KV write avoided via atomic write at end | Next run catches up |
| KV read fails on the site | Pages Function returns 204; site falls back to baked-in JSON | Self-heals on next request |
| Photo download fails | Vehicle ships with whatever photos succeeded | Next run retries failed URLs |
| Photo URL changes mid-listing | Old R2 key stale; new key created. Old R2 cleaned up by 90-day lifecycle policy | Automatic |

Monitoring:
- Worker logs go to Cloudflare Logpush or Workers Analytics
- Add a `/admin/sync-status` page (gated by Access) showing last 24h
  of `inventory:log:*` entries — Jeremiah can see at a glance if sync is
  healthy
- Optional: ping a healthcheck URL (Healthchecks.io free tier) on each
  successful sync. If we miss > 30 min, healthcheck pages Jeremiah/Bill.

---

## Open questions for Jeremiah

1. **Does Dealer Center have a feed URL?** Email DC support and CC Bill on the response.
2. **Do you want sale-pending vehicles to stay on the site?** Currently we hide sold but show sale-pending. Confirm.
3. **Photos: original-quality or compressed?** I recommend compressed-via-Sharp for site speed — full-quality archives stay in DC.
4. **Photo subdomain naming:** `photos.loveautogroup.net` (preferred) or some other subdomain?

---

## Phased delivery

### Milestone 1 — Read-only sync (3–4 days)
- Get DC feed URL from Jeremiah
- Build the cron worker; parse the feed; write to KV
- New `/admin/sync-status` page so Bill can verify it's working
- **Site still uses hardcoded inventory** — no production impact

### Milestone 2 — Photo pipeline (2–3 days)
- R2 bucket setup
- Photo download + Sharp re-encode + variant generation
- Photo URL stability — same VIN + position → same R2 key
- Auto-trigger Phase 2 photo classifier on new VINs

### Milestone 3 — Wire to site (2–3 days)
- Pages Function `/api/inventory` reads from KV
- Replace hardcoded inventory imports with KV-backed hook
- Build-time snapshot fallback
- Sitemap generates from live data
- Verify every inventory-touching page still renders correctly

### Milestone 4 — Hardening (2 days)
- Monitoring + healthcheck integration
- Failure-mode testing (kill the worker, kill DC feed, verify site)
- Docs update (`docs/inventory-sync-runbook.md` for ops)
- Sam security review

**Total: 1.5 to 2 weeks of focused work.**

---

## Things this spec deliberately does NOT do

- **Doesn't replace Dealer Center as the source of truth.** That's
  Phase 3 (Bill's custom DMS) — a multi-month build. Until then, DC
  remains the system of record; we just mirror it.
- **Doesn't push back to Dealer Center.** One-way sync only. If Jordan
  wants to change a price, she does it in DC, not on the website.
- **Doesn't cover deal management.** Deals (signed paperwork, customer
  records, F&I) are a separate domain. The sync only mirrors inventory.
- **Doesn't try to be real-time.** 15-min cadence is fine for an
  independent dealer. Going to seconds requires DC webhooks (Phase 1.5
  if DC supports them).

---

## Why we're not just doing Phase 3

Skipping Option A and going straight to Bill's custom DMS would mean
months without inventory sync, with the website increasingly out of
sync with reality. Option A is 1.5 weeks of work that buys us months of
correctness while Phase 3 takes its time.

When Phase 3 ships, Bill swaps the source of truth — `inventory:current`
in KV gets written by the new DMS instead of the DC sync worker. The
site doesn't change. The transition is invisible to customers.
