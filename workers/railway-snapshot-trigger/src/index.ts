/**
 * Cron Worker — Railway Snapshot Trigger
 *
 * Phase 9 Wave 4.3 daily trigger. The actual snapshot work happens
 * on Railway (it needs filesystem access to the SQLite volume). This
 * Worker just POSTs to the Railway endpoint on schedule.
 *
 * Cron: `0 9 * * *` (daily 09:00 UTC = 04:00 CT). See wrangler.toml.
 *
 * Healthchecks heartbeat is fired by the Railway endpoint itself on
 * success, NOT by this Worker. If this Worker fails (Railway down,
 * auth fails, etc.), the heartbeat doesn't fire and the
 * railway-snapshot Healthchecks check goes red after grace.
 */

export interface Env {
  RAILWAY_API_KEY: string;
  RAILWAY_SNAPSHOT_URL?: string;
}

const DEFAULT_URL =
  "https://web-production-d5f3a.up.railway.app/api/v1/admin/sqlite-snapshot";

export default {
  async scheduled(
    _event: ScheduledController,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    ctx.waitUntil(triggerSnapshot(env));
  },
};

async function triggerSnapshot(env: Env): Promise<void> {
  const url = env.RAILWAY_SNAPSHOT_URL || DEFAULT_URL;
  const startedAt = Date.now();

  console.log(`[railway-snapshot-trigger] POST ${url}`);

  if (!env.RAILWAY_API_KEY) {
    throw new Error(
      "RAILWAY_API_KEY secret not set — `wrangler secret put RAILWAY_API_KEY`",
    );
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-API-Key": env.RAILWAY_API_KEY,
      Accept: "application/json",
    },
  });

  const durationMs = Date.now() - startedAt;
  const text = await response.text();

  if (!response.ok) {
    console.error(
      `[railway-snapshot-trigger] ${response.status} in ${durationMs}ms: ${text.slice(0, 500)}`,
    );
    throw new Error(
      `Railway returned ${response.status}: ${text.slice(0, 200)}`,
    );
  }

  console.log(
    `[railway-snapshot-trigger] ${response.status} OK in ${durationMs}ms: ${text.slice(0, 500)}`,
  );
}
