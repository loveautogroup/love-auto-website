# railway-snapshot-trigger — Cloudflare Cron Worker

Phase 9 Wave 4.3 daily trigger. The actual snapshot work lives on Railway
in `routers/admin_sqlite_snapshot.py` (it needs filesystem access to the
volume). This Worker just hits the trigger.

## What it does

Every day at 09:00 UTC (04:00 CT):

1. POSTs to `https://web-production-d5f3a.up.railway.app/api/v1/admin/sqlite-snapshot`
2. With `X-API-Key: $RAILWAY_API_KEY` header
3. Railway-side endpoint does the real work (WAL checkpoint, copy file to
   R2, prune retention, ping Healthchecks)
4. Worker just logs success/failure

## Healthchecks

The Railway endpoint pings `hc-ping.com/4008d2a0-d07a-4170-922e-e8b860a5c822`
on success only. **This Worker does NOT need its own Healthchecks check** —
if the Worker fails to call Railway (network, auth, Railway 5xx), the
endpoint never runs, the ping never fires, and the existing `railway-snapshot`
Healthchecks check alerts after the grace window.

## Deploy

```powershell
cd "C:\Claude AI\love-auto-website-live\workers\railway-snapshot-trigger"
npm install

# Set the Railway API key (bill agent or a dedicated agent)
wrangler secret put RAILWAY_API_KEY --config wrangler.toml
# paste the bill agent key from Dashlane

wrangler deploy --config wrangler.toml
```

## Verify

```powershell
wrangler dev --test-scheduled --remote --config wrangler.toml
# In a second window:
curl.exe "http://localhost:8787/__scheduled?cron=0+9+*+*+*"
```

Expected log:
```
[railway-snapshot-trigger] POST https://web-production-d5f3a.up.railway.app/api/v1/admin/sqlite-snapshot
[railway-snapshot-trigger] 200 OK in ~1500ms: {"ok":true,"key":"railway-snapshots/...","bytes_uncompressed":...}
```

Then check the railway-snapshot Healthchecks check — should turn green within seconds.

## Bindings

| Binding | Type | Resource |
|---|---|---|
| `RAILWAY_API_KEY` | secret | bill agent key from Railway `API_KEYS` env var |
| `RAILWAY_SNAPSHOT_URL` | optional secret | Override default URL if needed (rarely) |

## Why a Worker instead of Railway-native cron?

We didn't want to add a separate Railway service (extra cost, more moving
parts) and the existing `web` service can't be put on a cron schedule
without stopping the long-running FastAPI process. A CF Worker is free,
runs on schedule, and reuses the same observability pattern as
`kv-snapshot` and `turso-snapshot` (Phase 9 W4.1 and W4.2).
