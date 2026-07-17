/**
 * GET /api/vehicle-views?path=/inventory/{slug}/
 * GET /api/vehicle-views?stocks=11332,11344,...          (D6 batch mode)
 *
 * W2 demand capture: real per-VDP view counts from Cloudflare Web
 * Analytics (RUM). Queries the GraphQL API for pageload visits on the
 * given path over the last 7 days, cached in the INVENTORY KV namespace
 * for an hour so the GraphQL API is hit at most ~24x/day per vehicle.
 *
 * D6 (2026-07-17, mobile fix pack): batch mode for the mobile app. Takes
 * up to 100 stock numbers, resolves each to its VDP slug via the KV
 * inventory snapshot (`inventory:current`, same data the site serves),
 * answers cached paths from the shared `views:{path}` keys, and fetches
 * every cache miss in ONE GraphQL query grouped by requestPath. Response:
 * `{ views: { [stockNumber]: number } }`. Replaces mobile's per-vehicle
 * fan-out that pointed at a dashboard route which never existed.
 *
 * Fails soft by design: missing env vars, GraphQL errors, or zero data
 * all return { views: null } (batch: { views: {} }) and the chips simply
 * don't render. Web Analytics was enabled Jun 7 2026 — counts accumulate
 * from then.
 *
 * Env (CF Pages project settings):
 *   CF_ANALYTICS_TOKEN  API token, Account Analytics:Read
 *   CF_WA_SITE_TAG      Web Analytics site tag for loveautogroup.net
 */

import { vehicleSlug } from "../../shared/slug";

interface Env {
  INVENTORY: KVNamespace;
  CF_ANALYTICS_TOKEN?: string;
  CF_WA_SITE_TAG?: string;
}

const ACCOUNT_TAG = "e5ffda225b59e007e064e76788d65d80";
const CACHE_TTL_S = 3600;
/** Same key functions/api/inventory.ts writes the site's KV snapshot to. */
const KV_KEY_CURRENT = "inventory:current";
const MAX_BATCH_STOCKS = 100;
/** Live DMS public mirror — same source /api/inventory and the [slug].ts
 *  VDP bridge use when KV is empty. camelCase fields (stockNumber, vin…). */
const DMS_PUBLIC_URL = "https://dms.loveautogroup.net/api/v1/public/inventory";

function json(body: unknown, maxAge = 300): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${maxAge}`,
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/** Minimal shape we need off the KV snapshot's vehicles for slug building. */
interface SnapshotVehicle {
  id?: string | number;
  vin?: string;
  stockNumber?: string | number;
  year?: number | string;
  make?: string;
  model?: string;
  trim?: string | null;
}

/** D6 batch mode: ?stocks=a,b,c → { views: { [stock]: number } }. */
async function handleBatch(
  ctx: Parameters<PagesFunction<Env>>[0],
  stocksParam: string,
): Promise<Response> {
  const stocks = Array.from(
    new Set(
      stocksParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    ),
  ).slice(0, MAX_BATCH_STOCKS);
  if (stocks.length === 0) return json({ views: {} });

  const token = ctx.env.CF_ANALYTICS_TOKEN;
  const siteTag = ctx.env.CF_WA_SITE_TAG ?? "2e53d0ae1d184af9896e40b3669ae5ac";
  // `reason` is a debug affordance on the fail-soft empty shape: mobile only
  // reads `views`, but a human hitting the URL can see WHICH leg came up dry.
  if (!token) return json({ views: {}, reason: "analytics-token-missing" }, 60);

  // Resolve stock → VDP path. First choice: the KV inventory snapshot.
  // NOTE (2026-07-17): that snapshot is written by the LEGACY DC-feed cron
  // worker (workers/inventory-sync) and may be absent or stale — the site
  // itself reads the live DMS mirror first (/api/inventory mode 1, and the
  // [slug].ts VDP bridge). So when KV yields nothing we do the same live
  // fallback rather than returning empty.
  let snapshot: { vehicles?: SnapshotVehicle[] } | null = null;
  try {
    snapshot = (await ctx.env.INVENTORY.get(KV_KEY_CURRENT, {
      type: "json",
    })) as { vehicles?: SnapshotVehicle[] } | null;
  } catch {
    snapshot = null;
  }
  let vehicles = snapshot?.vehicles ?? [];
  if (vehicles.length === 0) {
    try {
      const res = await fetch(DMS_PUBLIC_URL, {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const data = (await res.json()) as { vehicles?: SnapshotVehicle[] };
        vehicles = Array.isArray(data?.vehicles) ? data.vehicles : [];
      }
    } catch {
      /* fail soft below */
    }
  }
  if (vehicles.length === 0)
    return json({ views: {}, reason: "no-inventory-source" }, 60);

  const wanted = new Set(stocks.map(String));
  const pathByStock = new Map<string, string>();
  for (const v of vehicles) {
    const stock = v.stockNumber != null ? String(v.stockNumber) : "";
    if (!stock || !wanted.has(stock) || pathByStock.has(stock)) continue;
    try {
      const slug = vehicleSlug({
        vin: v.vin ?? "",
        year: v.year ?? "",
        make: v.make ?? "",
        model: v.model ?? "",
        trim: v.trim ?? null,
        stockNumber: stock,
        id: v.id,
      } as Parameters<typeof vehicleSlug>[0]);
      if (slug) pathByStock.set(stock, `/inventory/${slug}`);
    } catch {
      /* one bad row never breaks the batch */
    }
  }
  if (pathByStock.size === 0)
    return json({ views: {}, reason: "stocks-not-found" }, 60);

  const out: Record<string, number> = {};
  const misses: Array<{ stock: string; path: string }> = [];

  // Shared per-path cache (same keys the single-path mode writes).
  await Promise.all(
    Array.from(pathByStock.entries()).map(async ([stock, path]) => {
      try {
        const cached = await ctx.env.INVENTORY.get(`views:${path}`);
        if (cached) {
          const parsed = JSON.parse(cached) as { views?: number | null };
          out[stock] = typeof parsed.views === "number" ? parsed.views : 0;
          return;
        }
      } catch {
        /* treat as miss */
      }
      misses.push({ stock, path });
    }),
  );

  if (misses.length > 0) {
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const until = new Date().toISOString();
    // One GraphQL round-trip for every miss, grouped per path.
    const query = `
      query ViewsBatch($accountTag: string, $siteTag: string, $since: Time, $until: Time, $paths: [string!]) {
        viewer {
          accounts(filter: { accountTag: $accountTag }) {
            rumPageloadEventsAdaptiveGroups(
              filter: {
                AND: [
                  { siteTag: $siteTag }
                  { datetime_geq: $since }
                  { datetime_leq: $until }
                  { requestPath_in: $paths }
                ]
              }
              limit: ${MAX_BATCH_STOCKS * 2}
              dimensions { requestPath }
            ) {
              dimensions { requestPath }
              sum { visits }
              count
            }
          }
        }
      }`;
    try {
      const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          variables: {
            accountTag: ACCOUNT_TAG,
            siteTag,
            since,
            until,
            paths: misses.flatMap((m) => [m.path, `${m.path}/`]),
          },
        }),
      });
      if (res.ok) {
        const data = (await res.json()) as {
          data?: {
            viewer?: {
              accounts?: {
                rumPageloadEventsAdaptiveGroups?: Array<{
                  dimensions?: { requestPath?: string };
                  sum?: { visits?: number };
                  count?: number;
                }>;
              }[];
            };
          };
          errors?: unknown[];
        };
        const groups =
          data.errors && data.errors.length > 0
            ? []
            : data.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups ?? [];
        const byPath = new Map<string, number>();
        for (const g of groups) {
          const p = (g.dimensions?.requestPath ?? "").replace(/\/$/, "");
          if (!p) continue;
          byPath.set(p, (byPath.get(p) ?? 0) + (g.sum?.visits ?? g.count ?? 0));
        }
        const since7 = since;
        await Promise.all(
          misses.map(async ({ stock, path }) => {
            const views = byPath.get(path) ?? 0;
            out[stock] = views;
            try {
              await ctx.env.INVENTORY.put(
                `views:${path}`,
                JSON.stringify({ views, since: since7 }),
                { expirationTtl: CACHE_TTL_S },
              );
            } catch {
              /* cache write is best-effort */
            }
          }),
        );
      } else {
        for (const { stock } of misses) out[stock] = 0;
      }
    } catch {
      for (const { stock } of misses) out[stock] = 0;
    }
  }

  return json({ views: out });
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);

  // D6: batch mode for the mobile app.
  const stocksParam = url.searchParams.get("stocks");
  if (stocksParam !== null) return handleBatch(ctx, stocksParam);

  const rawPath = url.searchParams.get("path") ?? "";
  // Only VDP paths are queryable — this is not a general analytics proxy.
  if (!/^\/inventory\/[a-z0-9-]+\/?$/.test(rawPath)) {
    return json({ views: null });
  }
  const path = rawPath.replace(/\/$/, "");

  const token = ctx.env.CF_ANALYTICS_TOKEN;
  // Site tag discovered Jun 7 2026 (loveautogroup.net RUM site, active
  // since May 15). Env var only needs to exist if the site is recreated.
  const siteTag = ctx.env.CF_WA_SITE_TAG ?? "2e53d0ae1d184af9896e40b3669ae5ac";
  if (!token) return json({ views: null });

  const cacheKey = `views:${path}`;
  const cached = await ctx.env.INVENTORY.get(cacheKey);
  if (cached) {
    try {
      return json(JSON.parse(cached));
    } catch {
      /* fall through to refetch */
    }
  }

  const since = new Date(Date.now() - 7 * 86400000).toISOString();
  const until = new Date().toISOString();
  const query = `
    query Views($accountTag: string, $siteTag: string, $since: Time, $until: Time, $paths: [string!]) {
      viewer {
        accounts(filter: { accountTag: $accountTag }) {
          rumPageloadEventsAdaptiveGroups(
            filter: {
              AND: [
                { siteTag: $siteTag }
                { datetime_geq: $since }
                { datetime_leq: $until }
                { requestPath_in: $paths }
              ]
            }
            limit: 1
          ) {
            sum { visits }
            count
          }
        }
      }
    }`;

  try {
    const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {
          accountTag: ACCOUNT_TAG,
          siteTag,
          since,
          until,
          paths: [path, `${path}/`],
        },
      }),
    });
    if (!res.ok) return json({ views: null });
    const data = (await res.json()) as {
      data?: {
        viewer?: {
          accounts?: {
            rumPageloadEventsAdaptiveGroups?: { sum?: { visits?: number }; count?: number }[];
          }[];
        };
      };
      errors?: unknown[];
    };
    if (data.errors && data.errors.length > 0) return json({ views: null });
    const groups = data.data?.viewer?.accounts?.[0]?.rumPageloadEventsAdaptiveGroups ?? [];
    const views = groups.reduce((acc, g) => acc + (g.sum?.visits ?? g.count ?? 0), 0);
    const payload = { views, since };
    await ctx.env.INVENTORY.put(cacheKey, JSON.stringify(payload), { expirationTtl: CACHE_TTL_S });
    return json(payload);
  } catch {
    return json({ views: null });
  }
};
