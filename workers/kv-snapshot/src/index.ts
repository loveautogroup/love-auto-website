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
  /**
   * Bearer token gating the manual `POST /run` trigger below. When unset,
   * the endpoint fails CLOSED (503) — no secret configured means no manual
   * trigger, never an open one.
   *   wrangler secret put MANUAL_TRIGGER_SECRET
   */
  MANUAL_TRIGGER_SECRET?: string;
  /**
   * Optional bearer token sent with the HEALTHCHECK_URL ping. Distinct from
   * MANUAL_TRIGGER_SECRET above: that one guards calls coming IN to this
   * worker, this one authenticates a call going OUT.
   *
   * Lets HEALTHCHECK_URL point at the DMS scheduled-job registry
   * (https://dms.loveautogroup.net/api/v1/heartbeat?job=kv-snapshot), which
   * requires auth. Healthchecks.io ignores an unexpected Authorization
   * header, so this is safe whichever target the URL points at, and leaving
   * it unset keeps the previous behaviour exactly.
   *   wrangler secret put HEARTBEAT_SECRET
   */
  HEARTBEAT_SECRET?: string;
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

  /**
   * Manual trigger — `POST /run` with `Authorization: Bearer <secret>`.
   *
   * wrangler.toml has documented this endpoint since the worker shipped,
   * but no fetch handler existed, so the documented command returned 404.
   * That's a bad thing to discover during the incident you need an
   * on-demand snapshot for (before a risky migration, or to capture state
   * before repairing something you just found corrupted).
   *
   * Unlike the cron path this AWAITS the run and reports the outcome —
   * the entire point of triggering by hand is learning whether it worked.
   * The work is I/O-bound on KV and R2, which doesn't accrue Workers CPU
   * time, so a large snapshot won't trip the CPU limit.
   */
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname !== "/run") {
      return json(404, { error: "Not found. The only route is POST /run." });
    }
    if (request.method !== "POST") {
      return json(405, { error: "Use POST." });
    }

    // Fail closed when no secret is configured.
    if (!env.MANUAL_TRIGGER_SECRET) {
      console.warn("[kv-snapshot] manual trigger attempted but no secret set");
      return json(503, {
        error:
          "Manual trigger is disabled: MANUAL_TRIGGER_SECRET is not set. " +
          "Run `wrangler secret put MANUAL_TRIGGER_SECRET` to enable it.",
      });
    }

    const auth = request.headers.get("authorization") ?? "";
    const presented = auth.startsWith("Bearer ") ? auth.slice(7) : "";
    if (!timingSafeEqual(presented, env.MANUAL_TRIGGER_SECRET)) {
      console.warn("[kv-snapshot] manual trigger rejected: bad bearer token");
      return json(401, { error: "Unauthorized." });
    }

    try {
      const result = await runSnapshot(env);
      console.log("[kv-snapshot] manual run completed");
      return json(200, { ok: true, trigger: "manual", ...result });
    } catch (err) {
      console.error("[kv-snapshot] manual run failed:", err);
      return json(500, { ok: false, error: String(err) });
    }
  },
};

/**
 * Constant-time string comparison. A plain `===` on a secret leaks length
 * and prefix information through timing. Compares the full token — the
 * previous doc suggested sending only the first 12 characters, which would
 * have thrown away most of the secret's entropy.
 */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const aBytes = enc.encode(a);
  const bBytes = enc.encode(b);
  // Compare lengths in a way that still walks a fixed number of bytes.
  let diff = aBytes.length ^ bBytes.length;
  const len = Math.max(aBytes.length, bBytes.length);
  for (let i = 0; i < len; i++) {
    diff |= (aBytes[i] ?? 0) ^ (bBytes[i] ?? 0);
  }
  return diff === 0;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

interface SnapshotResult {
  key: string;
  totalKeys: number;
  uncompressedBytes: number;
  compressedBytes: number;
  durationMs: number;
}

async function runSnapshot(env: Env): Promise<SnapshotResult> {
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
      const r = await fetch(env.HEALTHCHECK_URL, {
        // POST so the DMS heartbeat endpoint accepts it; Healthchecks.io
        // treats POST as a success ping identically to GET.
        method: "POST",
        headers: env.HEARTBEAT_SECRET
          ? { Authorization: `Bearer ${env.HEARTBEAT_SECRET}` }
          : undefined,
      });
      // Log the status, not just that we tried: a 401 here means the ping is
      // landing nowhere, which otherwise looks identical to a healthy run.
      console.log(`[kv-snapshot] healthcheck ping: ${r.status}`);
      if (!r.ok) {
        console.warn(
          `[kv-snapshot] healthcheck ping REJECTED (${r.status}) — this run is not being recorded`,
        );
      }
    } catch (err) {
      // Non-fatal: snapshot succeeded, healthcheck didn't. Log and move on.
      console.warn(`[kv-snapshot] healthcheck ping failed:`, err);
    }
  } else {
    console.warn(
      `[kv-snapshot] HEALTHCHECK_URL secret unset — no heartbeat sent`,
    );
  }

  return {
    key,
    totalKeys,
    uncompressedBytes: jsonBytes.byteLength,
    compressedBytes: gzipped.byteLength,
    durationMs: Date.now() - startedAt,
  };
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
