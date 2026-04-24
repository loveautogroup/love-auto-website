/**
 * Cloudflare Cron Worker — Inventory Sync
 *
 * Runs every 15 minutes (cron in wrangler.toml). Fetches the Dealer
 * Center feed, parses it into our SyncedVehicle shape, downloads any
 * new photos into R2, and writes the snapshot to KV. The website reads
 * from KV at request time via /api/inventory.
 *
 * Designed to be safe to run repeatedly:
 *   - Atomic write: builds the new snapshot in memory, only writes to
 *     KV at the end. A mid-run crash leaves the previous snapshot intact.
 *   - Idempotent: same feed in → same KV state out.
 *   - Photo dedup: existing R2 keys are skipped, only new photos download.
 */

import type {
  Env,
  InventorySnapshot,
  SyncLog,
  SyncedVehicle,
} from "./types";
import { parseFeed } from "./parsers";
import { syncPhotos } from "./photos";

const KV_KEY_CURRENT = "inventory:current";
const KV_LOG_TTL_SECONDS = 30 * 24 * 3600; // 30 days

export default {
  async scheduled(_event: ScheduledController, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runSync(env));
  },

  // Manual trigger via HTTP — useful for testing and Bill's /admin/sync-status
  // "Sync now" button. Gated by a shared secret since the worker doesn't
  // sit behind Cloudflare Access.
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (url.pathname === "/run") {
      const provided = request.headers.get("authorization");
      const expected = env.DEALER_CENTER_FEED_AUTH
        ? `Bearer ${env.DEALER_CENTER_FEED_AUTH.slice(0, 12)}` // partial check; better than nothing
        : null;
      if (!expected || provided !== expected) {
        return new Response("Unauthorized", { status: 401 });
      }
      const log = await runSync(env);
      return Response.json(log, { status: 200 });
    }
    return new Response("Inventory sync worker. Use cron or /run.", {
      status: 200,
    });
  },
};

/**
 * Single sync run. Returns a SyncLog summary for logging / monitoring.
 */
async function runSync(env: Env): Promise<SyncLog> {
  const startedAt = Date.now();
  const log: SyncLog = {
    syncedAt: new Date().toISOString(),
    durationMs: 0,
    vehiclesIn: 0,
    vehiclesOut: 0,
    added: [],
    updated: [],
    removed: [],
    photosDownloaded: 0,
    errors: [],
    feedSource: env.DEALER_CENTER_FEED_URL ?? "(unset)",
    parserUsed: env.PARSER ?? "stub",
  };

  try {
    // 1. Fetch + parse the feed
    const incoming = await fetchAndParseFeed(env, log);
    log.vehiclesIn = incoming.length;

    // 2. Diff against the existing snapshot to detect adds / updates / removes
    const previous = await loadCurrentSnapshot(env);
    const previousByVin = new Map(previous.vehicles.map((v) => [v.vin, v]));
    const incomingVins = new Set(incoming.map((v) => v.vin));

    for (const v of incoming) {
      const prev = previousByVin.get(v.vin);
      if (!prev) {
        log.added.push(v.vin);
      } else if (vehicleChanged(prev, v)) {
        log.updated.push(v.vin);
      }
    }
    for (const v of previous.vehicles) {
      if (!incomingVins.has(v.vin)) {
        log.removed.push(v.vin);
      }
    }

    // 3. Sync photos. New VINs / photos download into R2; existing skip.
    log.photosDownloaded = await syncPhotos(incoming, env, log);

    // 4. Atomic write — build the snapshot first, then put.
    const snapshot: InventorySnapshot = {
      syncedAt: log.syncedAt,
      syncedBy: "cron",
      vehicles: stampLastSeen(incoming, previousByVin, log.syncedAt),
    };
    log.vehiclesOut = snapshot.vehicles.length;

    await env.INVENTORY.put(KV_KEY_CURRENT, JSON.stringify(snapshot));

    // 5. Healthcheck ping (optional)
    if (env.HEALTHCHECK_URL) {
      try {
        await fetch(env.HEALTHCHECK_URL);
      } catch (err) {
        log.errors.push(`Healthcheck ping failed: ${(err as Error).message}`);
      }
    }
  } catch (err) {
    log.errors.push(`Sync failed: ${(err as Error).message}`);
    console.error("[inventory-sync] failed:", err);
  } finally {
    log.durationMs = Date.now() - startedAt;
    // Always log, even on error
    await env.INVENTORY.put(
      `inventory:log:${log.syncedAt}`,
      JSON.stringify(log),
      { expirationTtl: KV_LOG_TTL_SECONDS }
    );
  }

  return log;
}

async function fetchAndParseFeed(
  env: Env,
  log: SyncLog
): Promise<SyncedVehicle[]> {
  if (!env.DEALER_CENTER_FEED_URL) {
    log.errors.push(
      "DEALER_CENTER_FEED_URL not set — running stub parser with empty result. Set the feed URL via `wrangler secret put DEALER_CENTER_FEED_URL` once Dealer Center provides it."
    );
    return [];
  }

  const headers: Record<string, string> = {
    Accept: "application/xml, application/json, text/csv, text/plain",
    "User-Agent": "LoveAutoGroup-InventorySync/1.0 (+https://www.loveautogroup.net)",
  };
  if (env.DEALER_CENTER_FEED_AUTH) {
    // Auto-detect Basic vs Bearer based on shape
    const auth = env.DEALER_CENTER_FEED_AUTH;
    if (auth.includes(":")) {
      // user:pass → Basic
      headers["Authorization"] = `Basic ${btoa(auth)}`;
    } else {
      headers["Authorization"] = `Bearer ${auth}`;
    }
  }

  const res = await fetch(env.DEALER_CENTER_FEED_URL, { headers });
  if (!res.ok) {
    throw new Error(
      `Feed fetch failed: HTTP ${res.status} ${res.statusText}`
    );
  }
  const body = await res.text();
  return parseFeed(body, env.PARSER ?? "stub", log);
}

async function loadCurrentSnapshot(env: Env): Promise<InventorySnapshot> {
  const raw = await env.INVENTORY.get(KV_KEY_CURRENT, { type: "json" });
  if (raw && typeof raw === "object" && Array.isArray((raw as InventorySnapshot).vehicles)) {
    return raw as InventorySnapshot;
  }
  return {
    syncedAt: new Date().toISOString(),
    syncedBy: "cron",
    vehicles: [],
  };
}

function vehicleChanged(a: SyncedVehicle, b: SyncedVehicle): boolean {
  // Cheap shallow comparison on fields that change. VIN is the key
  // so we don't compare it.
  const fields: Array<keyof SyncedVehicle> = [
    "year",
    "make",
    "model",
    "trim",
    "mileage",
    "price",
    "status",
    "exteriorColor",
    "interiorColor",
  ];
  for (const f of fields) {
    if (JSON.stringify(a[f]) !== JSON.stringify(b[f])) return true;
  }
  // Photos: count + first URL is enough signal
  if (a.images.length !== b.images.length) return true;
  if (a.images[0] !== b.images[0]) return true;
  return false;
}

function stampLastSeen(
  incoming: SyncedVehicle[],
  previousByVin: Map<string, SyncedVehicle>,
  syncedAt: string
): SyncedVehicle[] {
  return incoming.map((v) => {
    const prev = previousByVin.get(v.vin);
    return {
      ...v,
      dealerCenterFirstSeen: prev?.dealerCenterFirstSeen ?? syncedAt,
      dealerCenterLastSeen: syncedAt,
    };
  });
}
