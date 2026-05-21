/**
 * Cron Worker — KV Snapshot
 *
 * Phase 9 Wave 4.1. Daily off-platform snapshot of every KV namespace
 * we own to Cloudflare R2. Protects against KV-level data loss and
 * CF-account-level compromise (R2 lives in the same account today,
 * but the snapshot artifact is durable and can be pulled to other
 * storage on demand).
 *
 * Cron: `0 7 * * *` (daily 07:00 UTC = 02:00 CT). See wrangler.toml.
 *
 * Output: gzipped JSON at SNAPSHOTS R2 under
 *   kv-snapshots/{YYYY-MM-DD}.json.gz
 *
 * Retention: 90 days. Older keys pruned in-cron each run.
 *
 * Failure mode: throws on any error so the CF scheduled-event run is
 * marked failed; Healthchecks.io ping does NOT fire on error, so the
 * grace-window timeout alerts you.
 *
 * Restore runbook: see memory/projects/wave-4.1-cf-kv-snapshot.md.
 */

export interface Env {
  INVENTORY_KV: KVNamespace;
  MERCHANDISING_KV: KVNamespace;
  SNAPSHOTS: R2Bucket;
  HEALTHCHECK_URL?: string;
}

interface NamespaceSpec {
  binding: "INVENTORY_KV" | "MERCHANDISING_KV";
  name: string;
}

const NAMESPACES: NamespaceSpec[] = [
  { binding: "INVENTORY_KV", name: "INVENTORY" },
  { binding: "MERCHANDISING_KV", name: "MERCHANDISING" },
];

const SNAPSHOT_PREFIX = "kv-snapshots";
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
  console.log(`[kv-snapshot] starting run for ${date}`);

  const snapshot: Record<string, Record<string, string | null>> = {};
  let totalKeys = 0;

  // Enumerate every key in every namespace
  for (const ns of NAMESPACES) {
    const kv = env[ns.binding];
    const nsData: Record<string, string | null> = {};
    let cursor: string | undefined;

    do {
      const result: KVNamespaceListResult<unknown, string> =
        await kv.list({ cursor, limit: 1000 });
      for (const key of result.keys) {
        nsData[key.name] = await kv.get(key.name);
        totalKeys += 1;
      }
      cursor = result.list_complete ? undefined : result.cursor;
    } while (cursor);

    snapshot[ns.name] = nsData;
    console.log(
      `[kv-snapshot] namespace ${ns.name}: ${Object.keys(nsData).length} keys`,
    );
  }

  // Serialize + gzip via Compression Streams API
  const json = JSON.stringify({
    capturedAt: new Date().toISOString(),
    namespaces: snapshot,
    stats: {
      totalKeys,
      durationMs: Date.now() - startedAt,
    },
  });

  const jsonBytes = new TextEncoder().encode(json);
  const compressedStream = new Response(jsonBytes).body!.pipeThrough(
    new CompressionStream("gzip"),
  );
  const gzipped = await new Response(compressedStream).arrayBuffer();

  const key = `${SNAPSHOT_PREFIX}/${date}.json.gz`;
  await env.SNAPSHOTS.put(key, gzipped, {
    httpMetadata: {
      contentType: "application/gzip",
    },
    customMetadata: {
      capturedAt: new Date().toISOString(),
      totalKeys: String(totalKeys),
      durationMs: String(Date.now() - startedAt),
      uncompressedBytes: String(jsonBytes.byteLength),
    },
  });

  console.log(
    `[kv-snapshot] uploaded ${key} — ${totalKeys} keys, ` +
      `${jsonBytes.byteLength} → ${gzipped.byteLength} bytes`,
  );

  // Prune old snapshots (anything older than retention window)
  await pruneOldSnapshots(env, date);

  // Healthchecks heartbeat on success only
  if (env.HEALTHCHECK_URL) {
    try {
      const r = await fetch(env.HEALTHCHECK_URL);
      console.log(`[kv-snapshot] healthcheck ping: ${r.status}`);
    } catch (err) {
      // Non-fatal: snapshot succeeded, healthcheck didn't. Log and move on.
      console.warn(`[kv-snapshot] healthcheck ping failed:`, err);
    }
  } else {
    console.warn(
      `[kv-snapshot] HEALTHCHECK_URL secret unset — no heartbeat sent`,
    );
  }
}

async function pruneOldSnapshots(env: Env, todayStr: string): Promise<void> {
  // Cutoff = today minus retention. Anything strictly older = delete.
  const today = new Date(todayStr + "T00:00:00Z");
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
    console.log(`[kv-snapshot] pruned ${key} (older than ${cutoffStr})`);
  }

  if (toDelete.length === 0) {
    console.log(`[kv-snapshot] no snapshots older than ${cutoffStr} to prune`);
  }
}
