/**
 * Admin /api/admin/sync-status
 *
 * GET — return the latest inventory snapshot summary + the most recent
 * sync logs. Used by the /admin/sync-status page to monitor the
 * inventory-sync Cron Worker without needing access to Cloudflare logs.
 *
 * Same Cloudflare Zero Trust Access gate as the rest of /api/admin.
 * We also check cf-access-jwt-assertion defensively in case Access
 * misconfigures.
 *
 * Logs are written to the same INVENTORY KV namespace by the Cron
 * Worker under keys "inventory:log:{ISO}". They auto-expire after 30
 * days via TTL.
 */

interface Env {
  INVENTORY?: KVNamespace;
}

const KV_KEY_CURRENT = "inventory:current";
const LOG_KEY_PREFIX = "inventory:log:";
const MAX_LOGS_RETURNED = 50;

interface SnapshotSummary {
  syncedAt: string;
  syncedBy: string;
  vehicleCount: number;
  totalPhotos: number;
  byMake: Record<string, number>;
  byStatus: Record<string, number>;
  oldestVin?: { vin: string; firstSeen: string };
  newestVin?: { vin: string; firstSeen: string };
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const accessJwt = request.headers.get("cf-access-jwt-assertion");
  if (!accessJwt) {
    return json(401, { error: "Unauthenticated. Cloudflare Access required." });
  }
  if (!env.INVENTORY) {
    return json(503, {
      error:
        "INVENTORY KV namespace not bound. Provision via wrangler.jsonc and rebuild the Pages project.",
    });
  }

  try {
    const [currentRaw, logKeys] = await Promise.all([
      env.INVENTORY.get(KV_KEY_CURRENT, { type: "json" }) as Promise<
        | {
            syncedAt: string;
            syncedBy?: string;
            vehicles: Array<{
              vin: string;
              make: string;
              status: string;
              images: string[];
              dealerCenterFirstSeen?: string;
            }>;
          }
        | null
      >,
      env.INVENTORY.list({ prefix: LOG_KEY_PREFIX, limit: 1000 }),
    ]);

    let snapshot: SnapshotSummary | null = null;
    if (currentRaw && Array.isArray(currentRaw.vehicles)) {
      snapshot = summarizeSnapshot(currentRaw);
    }

    // Sort log keys descending (most recent first) and grab top N.
    const sortedLogKeys = logKeys.keys
      .map((k) => k.name)
      .sort()
      .reverse()
      .slice(0, MAX_LOGS_RETURNED);

    const logs = await Promise.all(
      sortedLogKeys.map(async (key) => {
        const entry = await env.INVENTORY!.get(key, { type: "json" });
        return entry;
      })
    );

    return json(200, {
      snapshot,
      logs: logs.filter(Boolean),
      logsTotal: logKeys.keys.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (err) {
    console.error("[/api/admin/sync-status] failed:", err);
    return json(500, { error: (err as Error).message });
  }
};

/**
 * POST — trigger an immediate manual sync by hitting the worker's /run
 * endpoint. Requires SYNC_WORKER_URL and SYNC_WORKER_AUTH env vars on the
 * Pages project. Returns the worker's SyncLog response.
 */
interface PostEnv extends Env {
  SYNC_WORKER_URL?: string;
  SYNC_WORKER_AUTH?: string;
}

export const onRequestPost: PagesFunction<PostEnv> = async ({ request, env }) => {
  const accessJwt = request.headers.get("cf-access-jwt-assertion");
  if (!accessJwt) {
    return json(401, { error: "Unauthenticated." });
  }
  if (!env.SYNC_WORKER_URL || !env.SYNC_WORKER_AUTH) {
    return json(503, {
      error:
        "SYNC_WORKER_URL or SYNC_WORKER_AUTH not configured. Set on Pages project to enable manual triggers.",
    });
  }

  try {
    const url = env.SYNC_WORKER_URL.replace(/\/+$/, "") + "/run";
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${env.SYNC_WORKER_AUTH.slice(0, 12)}` },
    });
    const body = await res.text();
    return new Response(body, {
      status: res.status,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  } catch (err) {
    return json(502, { error: `Worker call failed: ${(err as Error).message}` });
  }
};

function summarizeSnapshot(snap: {
  syncedAt: string;
  syncedBy?: string;
  vehicles: Array<{
    vin: string;
    make: string;
    status: string;
    images: string[];
    dealerCenterFirstSeen?: string;
  }>;
}): SnapshotSummary {
  const byMake: Record<string, number> = {};
  const byStatus: Record<string, number> = {};
  let totalPhotos = 0;
  let oldest: { vin: string; firstSeen: string } | undefined;
  let newest: { vin: string; firstSeen: string } | undefined;

  for (const v of snap.vehicles) {
    byMake[v.make] = (byMake[v.make] ?? 0) + 1;
    byStatus[v.status] = (byStatus[v.status] ?? 0) + 1;
    totalPhotos += v.images?.length ?? 0;

    if (v.dealerCenterFirstSeen) {
      if (!oldest || v.dealerCenterFirstSeen < oldest.firstSeen) {
        oldest = { vin: v.vin, firstSeen: v.dealerCenterFirstSeen };
      }
      if (!newest || v.dealerCenterFirstSeen > newest.firstSeen) {
        newest = { vin: v.vin, firstSeen: v.dealerCenterFirstSeen };
      }
    }
  }

  return {
    syncedAt: snap.syncedAt,
    syncedBy: snap.syncedBy ?? "cron",
    vehicleCount: snap.vehicles.length,
    totalPhotos,
    byMake,
    byStatus,
    oldestVin: oldest,
    newestVin: newest,
  };
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
