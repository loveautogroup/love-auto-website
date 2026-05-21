# kv-snapshot — Cloudflare Cron Worker

Phase 9 Wave 4.1. Daily off-platform snapshot of every Cloudflare KV namespace
we own to R2.

## What it does

Every day at 07:00 UTC (02:00 CT):

1. Enumerates every key in the `INVENTORY` KV namespace (`8e64e40d...`).
2. Enumerates every key in the `MERCHANDISING` KV namespace (`fb1d2c02...`).
3. Wraps both into a single JSON object with stats + timestamp.
4. Gzips it.
5. Uploads to R2 at `kv-snapshots/{YYYY-MM-DD}.json.gz` in the
   `love-auto-photos` bucket.
6. Prunes any `kv-snapshots/*` objects older than 90 days.
7. Pings Healthchecks.io `HEALTHCHECK_URL` on success only.

A failure during steps 1-5 throws, the cron run is marked failed in CF, no
healthcheck ping fires, and Healthchecks alerts after the grace window.

## Deploy

From this directory:

```powershell
npm install
wrangler deploy
```

First-time setup:

```powershell
# Set the Healthchecks.io ping URL (created via dashboard at healthchecks.io)
wrangler secret put HEALTHCHECK_URL
# When prompted, paste https://hc-ping.com/<your-uuid>
```

## Verify after deploy

```powershell
# Trigger a manual run by hitting the scheduled handler via wrangler
wrangler dev --test-scheduled
# In another shell:
curl "http://localhost:8787/__scheduled?cron=0+7+*+*+*"
```

Or just wait for the next cron and check the live deployment:

```powershell
wrangler tail
```

## Restore from a snapshot

Manual procedure (a good drill candidate within 30 days of first deploy):

```powershell
# 1. List snapshots
wrangler r2 object list love-auto-photos --prefix=kv-snapshots/

# 2. Download the snapshot you want
wrangler r2 object get love-auto-photos/kv-snapshots/2026-05-11.json.gz `
  --file snapshot.json.gz

# 3. Decompress + inspect
# (PowerShell doesn't have gunzip natively. Use 7-Zip or:)
$bytes = [System.IO.File]::ReadAllBytes("snapshot.json.gz")
$ms = New-Object System.IO.MemoryStream(,$bytes)
$gz = New-Object System.IO.Compression.GZipStream($ms, [System.IO.Compression.CompressionMode]::Decompress)
$sr = New-Object System.IO.StreamReader($gz)
$json = $sr.ReadToEnd()
$snapshot = $json | ConvertFrom-Json

# 4. Write one key back (example — restore MERCHANDISING config:v1)
$value = $snapshot.namespaces.MERCHANDISING."config:v1"
wrangler kv:key put --namespace-id=fb1d2c022f45486ba77fd5ba0ab04b3a config:v1 $value
```

Full runbook in `memory/projects/wave-4.1-cf-kv-snapshot.md`.

## Snapshot file format

```json
{
  "capturedAt": "2026-05-11T07:00:42.123Z",
  "namespaces": {
    "INVENTORY": {
      "inventory:current": "...stringified blob...",
      "...": "..."
    },
    "MERCHANDISING": {
      "config:v1": "...stringified blob..."
    }
  },
  "stats": {
    "totalKeys": 12,
    "durationMs": 1843
  }
}
```

Values that were originally JSON strings remain as JSON strings — KV stores
text, so we don't try to re-parse them. The restore writes them back verbatim.

## Bindings

| Binding | Type | Resource |
|---|---|---|
| `INVENTORY_KV` | KVNamespace | `8e64e40dfeae483396a3b1eaa755c820` |
| `MERCHANDISING_KV` | KVNamespace | `fb1d2c022f45486ba77fd5ba0ab04b3a` |
| `SNAPSHOTS` | R2Bucket | `love-auto-photos` |
| `HEALTHCHECK_URL` | secret | `https://hc-ping.com/<uuid>` |
