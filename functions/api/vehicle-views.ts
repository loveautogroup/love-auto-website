/**
 * GET /api/vehicle-views?path=/inventory/{slug}/
 *
 * W2 demand capture: real per-VDP view counts from Cloudflare Web
 * Analytics (RUM). Queries the GraphQL API for pageload visits on the
 * given path over the last 7 days, cached in the INVENTORY KV namespace
 * for an hour so the GraphQL API is hit at most ~24x/day per vehicle.
 *
 * Fails soft by design: missing env vars, GraphQL errors, or zero data
 * all return { views: null } and the VDP chip simply doesn't render.
 * Web Analytics was enabled Jun 7 2026 — counts accumulate from then.
 *
 * Env (CF Pages project settings):
 *   CF_ANALYTICS_TOKEN  API token, Account Analytics:Read
 *   CF_WA_SITE_TAG      Web Analytics site tag for loveautogroup.net
 */

interface Env {
  INVENTORY: KVNamespace;
  CF_ANALYTICS_TOKEN?: string;
  CF_WA_SITE_TAG?: string;
}

const ACCOUNT_TAG = "e5ffda225b59e007e064e76788d65d80";
const CACHE_TTL_S = 3600;

function json(body: unknown, maxAge = 300): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${maxAge}`,
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
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
