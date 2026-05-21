/**
 * Cron Worker — Turso Snapshot
 *
 * Phase 9 Wave 4.2. Weekly off-platform SQL dump of the prod Turso
 * database to Cloudflare R2. Protects against Turso account-level
 * compromise or accidental deletion (vendor 14-day PITR covers
 * most other failure modes — see W3.1 audit).
 *
 * Cron: `0 8 * * 0` (Sundays 08:00 UTC = 03:00 CT). See wrangler.toml.
 *
 * Output: gzipped SQL dump at SNAPSHOTS R2 under
 *   turso-snapshots/{YYYY-MM-DD}.sql.gz
 *
 * Retention: 90 days. Older snapshots pruned in-cron each run.
 *
 * Restore procedure (manual):
 *   1. Download the snapshot from R2
 *   2. Gunzip
 *   3. `turso db create <recovery-name>` to provision a fresh DB
 *   4. `turso db shell <recovery-name> < snapshot.sql` to restore
 *   5. Update TURSO_DATABASE_URL on Vercel and redeploy
 *
 * Encryption note: MFA secrets in the User table are encrypted with the
 * Vercel ENCRYPTION_KEY env var. The dump preserves the ciphertext as-is;
 * recovery requires the matching ENCRYPTION_KEY snapshot from 1Password.
 */

import { createClient, type ResultSet, type InValue } from "@libsql/client/web";

export interface Env {
  TURSO_DATABASE_URL: string;
  TURSO_AUTH_TOKEN: string;
  SNAPSHOTS: R2Bucket;
  HEALTHCHECK_URL?: string;
}

const SNAPSHOT_PREFIX = "turso-snapshots";
const RETENTION_DAYS = 90;

export default {
  async scheduled(
    _event: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(runSnapshot(env));
  },
};

async function runSnapshot(env: Env): Promise<void> {
  const startedAt = Date.now();
  const date = new Date().toISOString().slice(0, 10);
  console.log(`[turso-snapshot] starting run for ${date}`);

  if (!env.TURSO_DATABASE_URL || !env.TURSO_AUTH_TOKEN) {
    throw new Error(
      "TURSO_DATABASE_URL and TURSO_AUTH_TOKEN must be set as worker secrets",
    );
  }

  const client = createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  });

  // Enumerate user tables (skip sqlite internals)
  const tables = await client.execute({
    sql: `SELECT name, sql FROM sqlite_master
          WHERE type='table'
          AND name NOT LIKE 'sqlite_%'
          AND name NOT LIKE '_litestream_%'
          ORDER BY name`,
    args: [],
  });

  // Enumerate non-auto indexes (auto indexes have sql=NULL)
  const indexes = await client.execute({
    sql: `SELECT sql FROM sqlite_master
          WHERE type='index'
          AND sql IS NOT NULL
          ORDER BY name`,
    args: [],
  });

  const lines: string[] = [
    `-- Turso snapshot of love-auto-dms-prod`,
    `-- Captured at: ${new Date().toISOString()}`,
    `-- Phase 9 Wave 4.2 / turso-snapshot Worker`,
    ``,
    `PRAGMA foreign_keys=OFF;`,
    `BEGIN TRANSACTION;`,
    ``,
  ];

  let totalRows = 0;

  for (const tableRow of tables.rows) {
    const tableName = String(tableRow.name);
    const createSql = String(tableRow.sql);

    lines.push(`-- Table: ${tableName}`);
    lines.push(`DROP TABLE IF EXISTS \`${tableName}\`;`);
    lines.push(`${createSql};`);

    // Dump rows
    const rows: ResultSet = await client.execute({
      sql: `SELECT * FROM \`${tableName}\``,
      args: [],
    });

    if (rows.rows.length > 0) {
      const colList = rows.columns.map((c) => `\`${c}\``).join(", ");
      for (const row of rows.rows) {
        const values = rows.columns
          .map((col) => formatValue((row as Record<string, InValue>)[col]))
          .join(", ");
        lines.push(`INSERT INTO \`${tableName}\` (${colList}) VALUES (${values});`);
        totalRows += 1;
      }
    }
    lines.push(``);
  }

  // Restore indexes after all data is loaded
  lines.push(`-- Indexes`);
  for (const idx of indexes.rows) {
    if (idx.sql) lines.push(`${String(idx.sql)};`);
  }
  lines.push(``);
  lines.push(`COMMIT;`);
  lines.push(`PRAGMA foreign_keys=ON;`);

  const sql = lines.join("\n");
  const sqlBytes = new TextEncoder().encode(sql);

  // Gzip via Compression Streams API
  const compressedStream = new Response(sqlBytes).body!.pipeThrough(
    new CompressionStream("gzip"),
  );
  const gzipped = await new Response(compressedStream).arrayBuffer();

  const key = `${SNAPSHOT_PREFIX}/${date}.sql.gz`;
  await env.SNAPSHOTS.put(key, gzipped, {
    httpMetadata: {
      contentType: "application/gzip",
    },
    customMetadata: {
      capturedAt: new Date().toISOString(),
      totalTables: String(tables.rows.length),
      totalRows: String(totalRows),
      durationMs: String(Date.now() - startedAt),
      uncompressedBytes: String(sqlBytes.byteLength),
    },
  });

  console.log(
    `[turso-snapshot] uploaded ${key} — ` +
      `${tables.rows.length} tables, ${totalRows} rows, ` +
      `${sqlBytes.byteLength} → ${gzipped.byteLength} bytes`,
  );

  await pruneOldSnapshots(env, date);

  if (env.HEALTHCHECK_URL) {
    try {
      const r = await fetch(env.HEALTHCHECK_URL);
      console.log(`[turso-snapshot] healthcheck ping: ${r.status}`);
    } catch (err) {
      console.warn(`[turso-snapshot] healthcheck ping failed:`, err);
    }
  } else {
    console.warn(
      `[turso-snapshot] HEALTHCHECK_URL secret unset — no heartbeat sent`,
    );
  }
}

function formatValue(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") {
    return Number.isFinite(v) ? String(v) : "NULL";
  }
  if (typeof v === "bigint") return String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  if (v instanceof Uint8Array) {
    // BLOB → SQLite hex literal: X'deadbeef'
    let hex = "";
    for (const b of v) hex += b.toString(16).padStart(2, "0");
    return `X'${hex}'`;
  }
  // String: escape single quotes by doubling them
  return `'${String(v).replace(/'/g, "''")}'`;
}

async function pruneOldSnapshots(env: Env, todayStr: string): Promise<void> {
  const today = new Date(`${todayStr}T00:00:00Z`);
  const cutoff = new Date(today);
  cutoff.setUTCDate(cutoff.getUTCDate() - RETENTION_DAYS);
  const cutoffStr = cutoff.toISOString().slice(0, 10);

  const listed = await env.SNAPSHOTS.list({
    prefix: `${SNAPSHOT_PREFIX}/`,
    limit: 1000,
  });

  const toDelete = listed.objects
    .map((obj) => obj.key)
    .filter((key) => {
      const match = key.match(/(\d{4}-\d{2}-\d{2})/);
      if (!match) return false;
      return match[1] < cutoffStr;
    });

  for (const key of toDelete) {
    await env.SNAPSHOTS.delete(key);
    console.log(`[turso-snapshot] pruned ${key} (older than ${cutoffStr})`);
  }

  if (toDelete.length === 0) {
    console.log(`[turso-snapshot] no snapshots older than ${cutoffStr} to prune`);
  }
}
