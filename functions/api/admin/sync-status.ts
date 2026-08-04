/**
 * Admin /api/admin/sync-status
 *
 * ONE QUESTION: "is the website showing my current inventory right now,
 * and if not, why?"
 *
 * REPOINTED 2026-08-03. This endpoint used to read `inventory:current` +
 * `inventory:log:*` out of the INVENTORY KV namespace -- keys written by
 * workers/inventory-sync, a Cron Worker that parsed the DealerCenter feed.
 * DealerCenter stopped being a source 2026-06-04, the worker stopped writing
 * ~2026-07-17, and the worker itself was deleted 2026-08-03. Everything this
 * page reported was therefore frozen or fabricated: a "last sync" age that
 * only grew, a snapshot nobody served, a run log with no runs in it, and a
 * "Sync now" button POSTing at a worker that no longer exists.
 *
 * The pipeline it now monitors is the one that actually runs:
 *
 *   Railway DMS -> prebuild snapshot (src/data/inventory-snapshot.json)
 *                    -> CF Pages build -> static VDPs + sitemaps
 *               -> runtime /api/inventory (live DMS, staged 3s + 20s)
 *               -> 7 marketplace feeds
 *
 * Three independent things can be wrong, and they fail differently:
 *
 *   1. RUNTIME DEGRADED -- the DMS is not answering, so /api/inventory
 *      serves 204 and every visitor falls back to the build-time snapshot.
 *      Measured by probing /api/inventory and reading X-Inventory-Source.
 *
 *   2. STALE DEPLOY -- the DMS is fine, but the deployed static pages were
 *      built from an older lot. New cars have no VDP (404) and sold cars
 *      still have one. This is the 2026-08-03 failure. Measured by the
 *      CLIENT, which compares the live list returned here against the
 *      build-time snapshot bundled into this very deployment (see
 *      SyncStatus.tsx) -- the only copy of the snapshot that is provably
 *      the one the deployed pages were generated from. Corroborated here
 *      by counting VDP URLs in the two deployed sitemaps.
 *
 *   3. FEED DOWN -- a marketplace feed is 503ing, so CarGurus / Facebook /
 *      Google are not getting a vehicle list. Measured by probing each of
 *      the 7 vehicle feeds.
 *
 * NO SIGNAL IS INVENTED. Anything we could not measure comes back
 * health:"unknown" with the reason attached, never a fabricated green.
 * That is the whole lesson of the 2026-08-03 incident: a dashboard that
 * lies is worse than no dashboard.
 *
 * Feed health also exists DMS-side at love-auto-dms
 * /api/v1/feeds/health?url= (it runs from Vercel because the DMS dashboard's
 * CSP blocks cross-origin fetches). This is not a competing checker -- it is
 * the same trivial check (HTTP status + row count, counted the same way),
 * run from the origin that already hosts the feeds, because a Pages Function
 * cannot authenticate to the DMS API.
 *
 * ONE DELIBERATE DIVERGENCE: that endpoint counts CSV rows as "lines - 1",
 * which is wrong for these feeds -- vehicle descriptions carry newlines
 * inside quoted fields, so it reports 13 where there are 5 cars (measured
 * live 2026-08-03). We count records instead. Copying a number we know to be
 * wrong for the sake of matching would be exactly the kind of lie this page
 * exists to remove.
 *
 * Auth: requireAdmin() from _lib/admin-auth (the __Secure-lag_admin session
 * cookie). There is no Cloudflare Access application in front of this route.
 *
 * Query params (GET):
 *   ?scope=quick  runtime probe only -- no sitemap reads, no feed probes.
 *                 Used by the admin hub, which loads on every admin page
 *                 view and must not fire 10 subrequests to draw one badge.
 *   ?fresh=1      pass ?fresh=1 through to /api/inventory, bypassing the
 *                 edge cache. Slow (pays a full Railway cold start, ~23s)
 *                 but reports the true current state rather than what the
 *                 edge cached up to 60s ago.
 */

import { requireAdmin, type AdminAuthEnv } from "../../_lib/admin-auth";

interface Env extends AdminAuthEnv {
  /**
   * Cloudflare Pages deploy hook URL for this project. Set as a SECRET in
   * Pages -> Settings -> Environment variables (Production + Preview), never
   * committed: anyone holding it can trigger unlimited builds. The hook id
   * is recorded in the ops notes.
   *
   * Server-side only. It is read here inside the Function and never reaches
   * the browser -- the client only learns whether it is configured.
   */
  CF_PAGES_DEPLOY_HOOK_URL?: string;
}

type Health = "ok" | "degraded" | "unknown";

/** Our own ceiling on the runtime probe. /api/inventory itself budgets
 *  3s warm + 20s cold, so anything past ~25s means it never returned. */
const RUNTIME_PROBE_TIMEOUT_MS = 27_000;

/**
 * Per-feed ceiling. A feed's own fetchInventory() budgets 5s + 25s + 25s,
 * so a cold DMS can legitimately keep one busy for ~55s. We refuse to wait
 * that long seven times over, and a probe that hits this ceiling is reported
 * as "unknown" (no answer in 10s), NOT as "down" -- we did not prove the
 * feed is broken, we proved we stopped waiting.
 */
const FEED_PROBE_TIMEOUT_MS = 10_000;

/** Cap on how much of a feed body we pull just to count rows. */
const MAX_FEED_BYTES = 256 * 1024;

/**
 * The 7 vehicle feeds -- i.e. every feed that reads the DMS and can 503.
 * /api/feed/google-local-inventory.csv is deliberately absent: it is the
 * static Google POS store-address file with no inventory dependency, so
 * probing it would only ever confirm that a constant is still a constant.
 */
const FEEDS: ReadonlyArray<{ name: string; path: string }> = [
  { name: "CarGurus (+ AutoList, MSN Autos)", path: "/api/feed/cargurus.xml" },
  { name: "Facebook Marketplace", path: "/api/feed/facebook.csv" },
  { name: "AutoTrader / generic CSV", path: "/api/feed/autotrader.csv" },
  { name: "DealerCenter", path: "/api/feed/dealercenter.csv" },
  { name: "Google Vehicle Ads", path: "/api/feed/google-vehicle-ads.csv" },
  { name: "Google vehicle listings", path: "/api/feed/google-vehicles.csv" },
  {
    name: "Google local inventory",
    path: "/api/feed/google-vehicle-inventory.csv",
  },
];

/** The deployed artifacts that advertise VDP URLs to crawlers. Both are
 *  static files emitted by the build, so reading them is edge-cheap and
 *  tells us what THIS deployment actually published. */
const SITEMAPS: ReadonlyArray<{ name: string; path: string }> = [
  { name: "sitemap.xml", path: "/sitemap.xml" },
  { name: "sitemap-vehicles.xml", path: "/sitemap-vehicles.xml" },
];

interface RuntimeVehicle {
  vin: string;
  stockNumber: string;
  slug: string;
  label: string;
  status: string;
  make: string;
}

interface RuntimeProbe {
  health: Health;
  /** X-Inventory-Source verbatim: "live-dms" when fresh, "none" when the
   *  DMS could not be read and the client keeps its build-time snapshot. */
  source: string | null;
  httpStatus: number | null;
  latencyMs: number;
  cacheBypassed: boolean;
  vehicleCount: number | null;
  vehicles: RuntimeVehicle[] | null;
  /** When the live read happened (set by /api/inventory at response time). */
  syncedAt: string | null;
  note: string;
  error?: string;
}

interface SitemapProbe {
  name: string;
  path: string;
  health: Health;
  httpStatus: number | null;
  vdpUrlCount: number | null;
  error?: string;
}

interface FeedProbe {
  name: string;
  path: string;
  health: Health;
  httpStatus: number | null;
  rows: number | null;
  latencyMs: number;
  note: string;
  error?: string;
}

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  const url = new URL(request.url);
  const quick = url.searchParams.get("scope") === "quick";
  const fresh = url.searchParams.get("fresh") === "1";

  // Runtime probe FIRST, always. Two reasons: it is the headline signal, and
  // on a hibernating Railway it is the request that wakes the container --
  // so by the time the feed probes run, the DMS behind them is warm.
  const runtime = await probeRuntime(request, fresh);

  if (quick) {
    return json(200, {
      scope: "quick",
      runtime,
      sitemaps: null,
      feeds: null,
      rebuild: rebuildStatus(env),
      generatedAt: new Date().toISOString(),
    });
  }

  const [sitemaps, feeds] = await Promise.all([
    Promise.all(SITEMAPS.map((s) => probeSitemap(request, s))),
    Promise.all(FEEDS.map((f) => probeFeed(request, f))),
  ]);

  return json(200, {
    scope: "full",
    runtime,
    sitemaps,
    feeds,
    rebuild: rebuildStatus(env),
    generatedAt: new Date().toISOString(),
  });
};

/**
 * POST -- trigger a Cloudflare Pages rebuild.
 *
 * This is the honest replacement for the old "Sync now" button, which POSTed
 * at the deleted sync worker's /run endpoint. A rebuild is the ONLY thing
 * that fixes a stale deploy: the prebuild step re-reads the DMS, and the
 * build regenerates every VDP and both sitemaps from what it finds.
 *
 * The DMS already fires this same hook automatically whenever public-visible
 * inventory changes. This button is the manual override for when that did not
 * happen, or when the automatic build failed.
 */
export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  const hook = (env.CF_PAGES_DEPLOY_HOOK_URL ?? "").trim();
  if (!hook) {
    return json(503, {
      ok: false,
      error:
        "CF_PAGES_DEPLOY_HOOK_URL is not set on this Pages project, so there " +
        "is nothing to trigger. Add it as a SECRET under Pages -> Settings " +
        "-> Environment variables (Production and Preview), then redeploy " +
        "once so the binding takes effect.",
    });
  }

  // Guard the destination. This env var is the only thing deciding where an
  // authenticated POST goes; pinning it to Cloudflare's own hook host keeps a
  // fat-fingered value from turning the admin session into an SSRF gadget.
  let hookUrl: URL;
  try {
    hookUrl = new URL(hook);
  } catch {
    return json(500, {
      ok: false,
      error: "CF_PAGES_DEPLOY_HOOK_URL is not a valid URL.",
    });
  }
  if (
    hookUrl.protocol !== "https:" ||
    !/(^|\.)cloudflare\.com$/.test(hookUrl.hostname)
  ) {
    return json(500, {
      ok: false,
      error:
        "CF_PAGES_DEPLOY_HOOK_URL must be an https URL on cloudflare.com. " +
        "Refusing to POST to " +
        hookUrl.hostname +
        ".",
    });
  }

  try {
    const res = await fetch(hookUrl.toString(), { method: "POST" });
    // Deliberately not returning the hook's body verbatim -- it echoes
    // nothing useful and the response is rendered into an admin page.
    if (!res.ok) {
      return json(502, {
        ok: false,
        httpStatus: res.status,
        error:
          "Cloudflare rejected the deploy hook (HTTP " +
          res.status +
          "). The hook may have been deleted or rotated.",
      });
    }
    return json(200, {
      ok: true,
      triggeredAt: new Date().toISOString(),
      httpStatus: res.status,
    });
  } catch (err) {
    return json(502, {
      ok: false,
      error: "Deploy hook call failed: " + (err as Error).message,
    });
  }
};

function rebuildStatus(env: Env): { configured: boolean } {
  return { configured: Boolean((env.CF_PAGES_DEPLOY_HOOK_URL ?? "").trim()) };
}

/**
 * Probe the public runtime endpoint the site itself uses. We deliberately
 * call /api/inventory rather than the DMS directly: the question is not "is
 * Railway up", it is "what is this website serving to customers right now",
 * and only the real endpoint (with its own timeouts, retries and edge cache)
 * can answer that.
 */
async function probeRuntime(
  request: Request,
  fresh: boolean
): Promise<RuntimeProbe> {
  const target = new URL(
    fresh ? "/api/inventory?fresh=1" : "/api/inventory",
    request.url
  );
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), RUNTIME_PROBE_TIMEOUT_MS);

  try {
    const res = await fetch(target.toString(), {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
      // No cookies forwarded: /api/inventory is public and must not see
      // admin credentials.
    });
    const latencyMs = Date.now() - started;
    const source = res.headers.get("X-Inventory-Source");

    if (res.status === 204 || source === "none") {
      return {
        health: "degraded",
        source: source ?? "none",
        httpStatus: res.status,
        latencyMs,
        cacheBypassed: fresh,
        vehicleCount: null,
        vehicles: null,
        syncedAt: null,
        note:
          "The DMS did not answer, so the site is serving every visitor its " +
          "build-time snapshot instead of live data. Prices and availability " +
          "are as of the last deploy. Check Railway.",
      };
    }

    if (!res.ok) {
      return {
        health: "unknown",
        source,
        httpStatus: res.status,
        latencyMs,
        cacheBypassed: fresh,
        vehicleCount: null,
        vehicles: null,
        syncedAt: null,
        note:
          "The inventory endpoint returned an unexpected status, so we cannot " +
          "say what customers are being served.",
      };
    }

    const body = (await res.json()) as {
      syncedAt?: string;
      vehicles?: Array<{
        vin?: string;
        stockNumber?: string;
        slug?: string;
        year?: number;
        make?: string;
        model?: string;
        trim?: string;
        status?: string;
      }>;
    };
    if (!body || !Array.isArray(body.vehicles)) {
      return {
        health: "unknown",
        source,
        httpStatus: res.status,
        latencyMs,
        cacheBypassed: fresh,
        vehicleCount: null,
        vehicles: null,
        syncedAt: null,
        note: "The inventory endpoint answered with a payload we could not read.",
      };
    }

    const vehicles: RuntimeVehicle[] = body.vehicles.map((v) => ({
      vin: v.vin ?? "",
      stockNumber: v.stockNumber ?? "",
      slug: v.slug ?? "",
      label: [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ").trim(),
      status: v.status ?? "",
      make: v.make ?? "",
    }));

    return {
      health: "ok",
      source: source ?? "live-dms",
      httpStatus: res.status,
      latencyMs,
      cacheBypassed: fresh,
      vehicleCount: vehicles.length,
      vehicles,
      syncedAt: body.syncedAt ?? null,
      note: fresh
        ? "Read straight from the DMS just now, bypassing the edge cache."
        : "This is what the edge is serving visitors right now. It can be up " +
          "to 60 seconds old; use Re-check to bypass the cache.",
    };
  } catch (err) {
    const latencyMs = Date.now() - started;
    const aborted = (err as Error).name === "AbortError";
    return {
      health: "unknown",
      source: null,
      httpStatus: null,
      latencyMs,
      cacheBypassed: fresh,
      vehicleCount: null,
      vehicles: null,
      syncedAt: null,
      note: aborted
        ? "No answer within " +
          Math.round(RUNTIME_PROBE_TIMEOUT_MS / 1000) +
          " seconds. That is longer than the endpoint's own budget, so " +
          "treat the site as degraded until this clears."
        : "Could not reach the inventory endpoint from here.",
      error: (err as Error).message,
    };
  } finally {
    clearTimeout(timer);
  }
}

/** Count the VDP URLs a deployed sitemap advertises. Static file, edge-cheap. */
async function probeSitemap(
  request: Request,
  spec: { name: string; path: string }
): Promise<SitemapProbe> {
  const target = new URL(spec.path, request.url);
  try {
    const res = await fetch(target.toString(), {
      headers: { Accept: "application/xml" },
    });
    if (!res.ok) {
      return {
        name: spec.name,
        path: spec.path,
        health: "degraded",
        httpStatus: res.status,
        vdpUrlCount: null,
        error: "HTTP " + res.status,
      };
    }
    const text = await res.text();
    // Count <loc> entries that are actual VDPs.
    //
    // Matching on "/inventory/" alone is WRONG and would overstate the count:
    // sitemap.xml also lists /inventory/ itself and the seven make/body
    // landing pages (/inventory/used-lexus/, /inventory/used-suvs/, ...).
    // Measured against a real build: 13 URLs contain /inventory/, only 5 are
    // cars. A VDP slug is always year-make-model[-trim]-stock, so it always
    // starts with a 4-digit year -- and the landing pages always start with
    // "used-". That is the discriminator.
    const count = (
      text.match(/<loc>[^<]*\/inventory\/(?:19|20)\d{2}-[^<]*<\/loc>/g) ?? []
    ).length;
    return {
      name: spec.name,
      path: spec.path,
      health: "ok",
      httpStatus: res.status,
      vdpUrlCount: count,
    };
  } catch (err) {
    return {
      name: spec.name,
      path: spec.path,
      health: "unknown",
      httpStatus: null,
      vdpUrlCount: null,
      error: (err as Error).message,
    };
  }
}

/**
 * Probe one marketplace feed. XML counts <vehicle> tags; CSV counts RECORDS,
 * not lines -- see countCsvRecords() below for why that distinction matters.
 */
async function probeFeed(
  request: Request,
  spec: { name: string; path: string }
): Promise<FeedProbe> {
  const target = new URL(spec.path, request.url);
  const started = Date.now();
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FEED_PROBE_TIMEOUT_MS);

  try {
    const res = await fetch(target.toString(), { signal: ctrl.signal });
    const latencyMs = Date.now() - started;

    if (res.status === 503) {
      return {
        name: spec.name,
        path: spec.path,
        health: "degraded",
        httpStatus: 503,
        rows: null,
        latencyMs,
        note:
          "Publishing nothing on purpose: the feed could not read inventory, " +
          "so it returns 503 rather than an empty catalog a marketplace would " +
          "read as 'this dealer has no cars'. Clears when the DMS answers.",
      };
    }
    if (!res.ok) {
      return {
        name: spec.name,
        path: spec.path,
        health: "degraded",
        httpStatus: res.status,
        rows: null,
        latencyMs,
        note: "Unexpected status. Marketplaces pulling this now get an error.",
        error: "HTTP " + res.status,
      };
    }

    const text = await readCapped(res);
    const isXml = spec.path.endsWith(".xml");
    const rows = isXml
      ? (text.match(/<vehicle>/g) ?? []).length
      : countCsvRecords(text);

    return {
      name: spec.name,
      path: spec.path,
      health: "ok",
      httpStatus: res.status,
      rows,
      latencyMs,
      note:
        rows === 0
          ? "Served a valid but EMPTY list. The read succeeded, so this is " +
            "real data, not an outage -- check whether anything is listed."
          : "Serving " + rows + " vehicles.",
    };
  } catch (err) {
    const latencyMs = Date.now() - started;
    const aborted = (err as Error).name === "AbortError";
    return {
      name: spec.name,
      path: spec.path,
      health: "unknown",
      httpStatus: null,
      rows: null,
      latencyMs,
      note: aborted
        ? "No answer within " +
          Math.round(FEED_PROBE_TIMEOUT_MS / 1000) +
          "s. A cold DMS can legitimately keep a feed busy for ~55s, so this " +
          "is not proof the feed is broken -- only that we stopped waiting."
        : "Could not reach the feed from here.",
      error: (err as Error).message,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Count data records in a CSV -- NOT lines.
 *
 * These feeds embed vehicle descriptions as quoted fields, and those
 * descriptions contain newlines. Splitting on newlines therefore counts one
 * car several times: measured live 2026-08-03, facebook.csv reported 13
 * "rows" for 5 cars. A feed panel that says 13 when the answer is 5 is a
 * dashboard that lies, which is the thing this page exists to stop.
 *
 * So: walk the text, track whether we are inside a quoted field (RFC 4180 --
 * a doubled "" inside quotes is an escaped quote, not a terminator), and only
 * treat a newline outside quotes as a record boundary. Blank lines do not
 * count. Subtract the header row.
 *
 * Verified against Python's csv module on all six live CSV feeds
 * (2026-08-03): identical counts, 5/5/5/4/5/5, where the naive line count
 * gave 13/13/13/10/13/5.
 *
 * NOTE: love-auto-dms /api/v1/feeds/health still uses the naive line count
 * and therefore overstates. It should be fixed the same way.
 */
function countCsvRecords(text: string): number {
  let records = 0;
  let inQuotes = false;
  let sawContent = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      if (inQuotes && text[i + 1] === '"') {
        i++; // escaped quote -- consume both, stay inside the field
        continue;
      }
      inQuotes = !inQuotes;
      sawContent = true;
    } else if (ch === "\n" && !inQuotes) {
      if (sawContent) records++;
      sawContent = false;
    } else if (ch !== "\r") {
      sawContent = true;
    }
  }
  if (sawContent) records++;

  // Minus the header. A file with only a header is 0 vehicles, not -1.
  return Math.max(0, records - 1);
}

/** Read at most MAX_FEED_BYTES of a response body. */
async function readCapped(res: Response): Promise<string> {
  const reader = res.body?.getReader();
  if (!reader) return "";
  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;
    chunks.push(value);
    received += value.byteLength;
    if (received > MAX_FEED_BYTES) {
      try {
        await reader.cancel();
      } catch {
        /* noop */
      }
      break;
    }
  }
  const total = chunks.reduce((n, c) => n + c.byteLength, 0);
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(out);
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Admin data must never be stored by a browser, a shared proxy, or
      // Cloudflare's edge. public/_headers does NOT cover Pages Functions
      // responses, so the header has to be set right here.
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
