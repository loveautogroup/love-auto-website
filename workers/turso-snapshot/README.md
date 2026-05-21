# turso-snapshot — Cloudflare Cron Worker

Phase 9 Wave 4.2. Weekly off-platform SQL dump of the prod Turso DB
(`love-auto-dms-prod`) to R2.

## What it does

Every Sunday at 08:00 UTC (03:00 CT):

1. Connects to Turso via `@libsql/client/web` using `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN`.
2. Enumerates all user tables in `sqlite_master`.
3. For each table: emits `DROP TABLE IF EXISTS`, the original `CREATE TABLE` SQL, then `INSERT` statements for every row.
4. Emits all non-auto indexes.
5. Wraps everything in `BEGIN TRANSACTION / COMMIT` for atomic restore.
6. Gzips the resulting SQL string.
7. Uploads to R2 at `turso-snapshots/{YYYY-MM-DD}.sql.gz` in `love-auto-photos`.
8. Prunes `turso-snapshots/*` objects older than 90 days.
9. Pings Healthchecks.io `HEALTHCHECK_URL` on success only.

## Deploy

From this directory:

```powershell
npm install
wrangler deploy --config wrangler.toml
```

## One-time secrets

```powershell
# Turso prod URL (from Vercel env or Dashlane)
wrangler secret put TURSO_DATABASE_URL --config wrangler.toml
# paste libsql://love-auto-dms-prod-loveautogroup.aws-us-east-2.turso.io

# Turso prod auth token (from Vercel env or Dashlane)
wrangler secret put TURSO_AUTH_TOKEN --config wrangler.toml

# Healthchecks ping URL
wrangler secret put HEALTHCHECK_URL --config wrangler.toml
# paste https://hc-ping.com/<uuid> from the kv-snapshot dashboard
```

## Verify after deploy

```powershell
# Trigger the scheduled handler against real Turso + R2 via wrangler dev
wrangler dev --test-scheduled --remote --config wrangler.toml
# In a second PowerShell window:
curl "http://localhost:8787/__scheduled?cron=0+8+*+*+0"
# Watch first window for [turso-snapshot] log lines
```

Expected output:
```
[turso-snapshot] starting run for 2026-05-11
[turso-snapshot] uploaded turso-snapshots/2026-05-11.sql.gz — 33 tables, NNN rows, X → Y bytes
[turso-snapshot] healthcheck ping: 200
```

## Restore from a snapshot

```powershell
# 1. List available snapshots
wrangler r2 object list love-auto-photos --prefix=turso-snapshots/ --config wrangler.toml

# 2. Download the snapshot
wrangler r2 object get love-auto-photos/turso-snapshots/2026-05-18.sql.gz `
  --file snapshot.sql.gz --config wrangler.toml

# 3. Decompress (PowerShell-native)
$bytes = [System.IO.File]::ReadAllBytes("snapshot.sql.gz")
$ms = New-Object System.IO.MemoryStream(,$bytes)
$gz = New-Object System.IO.Compression.GZipStream($ms, [System.IO.Compression.CompressionMode]::Decompress)
$sr = New-Object System.IO.StreamReader($gz)
[System.IO.File]::WriteAllText("snapshot.sql", $sr.ReadToEnd())

# 4. Provision a fresh Turso DB (if recovery scenario; skip if just drilling)
turso db create love-auto-dms-recovery

# 5. Restore (use Turso CLI or libsql shell)
turso db shell love-auto-dms-recovery < snapshot.sql

# 6. Spot-check
turso db shell love-auto-dms-recovery "SELECT COUNT(*) FROM Vehicle WHERE status='RETAIL_READY'"
# Should return 7 (or whatever the canonical count was at snapshot time)

# 7. Update TURSO_DATABASE_URL on Vercel and redeploy
```

Full runbook in `memory/projects/wave-4.2-turso-snapshot.md`.

## MFA / encryption note

The User table's `totpSecret` column is encrypted at rest with the Vercel
`ENCRYPTION_KEY` env var. The dump preserves the ciphertext as-is. Recovery
to a usable state requires the matching `ENCRYPTION_KEY` snapshot from
1Password (W3 follow-up #13).

## Bindings

| Binding | Type | Resource |
|---|---|---|
| `TURSO_DATABASE_URL` | secret | `libsql://love-auto-dms-prod-...turso.io` |
| `TURSO_AUTH_TOKEN` | secret | Turso prod token |
| `SNAPSHOTS` | R2Bucket | `love-auto-photos` |
| `HEALTHCHECK_URL` | secret | `https://hc-ping.com/<uuid>` |
