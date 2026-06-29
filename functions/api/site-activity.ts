/**
 * GET /api/site-activity
 *
 * Site-wide Cloudflare Web Analytics (RUM) rollup for the DMS "Website
 * Activity" page: visits + pageviews for the last 7 and 30 days, a 30-day
 * by-day series, and the top pages. Same CF token + site tag as
 * vehicle-views.ts. Fails soft → { ok:false } so the DMS page degrades.
 *
 * Env (CF Pages): CF_ANALYTICS_TOKEN (Account Analytics:Read), CF_WA_SITE_TAG.
 */
interface Env { CF_ANALYTICS_TOKEN?: string; CF_WA_SITE_TAG?: string; }
const ACCOUNT_TAG = "e5ffda225b59e007e064e76788d65d80";

function json(body: unknown, maxAge = 600): Response {
  return new Response(JSON.stringify(body), {
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": `public, max-age=${maxAge}`,
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const token = ctx.env.CF_ANALYTICS_TOKEN;
  const siteTag = ctx.env.CF_WA_SITE_TAG ?? "2e53d0ae1d184af9896e40b3669ae5ac";
  if (!token) return json({ ok: false, reason: "no_token" });

  const now = Date.now();
  const until = new Date(now).toISOString();
  const since7 = new Date(now - 7 * 86400000).toISOString();
  const since30 = new Date(now - 30 * 86400000).toISOString();

  const query = `
    query Activity($a: string, $s: string, $s7: Time, $s30: Time, $u: Time) {
      viewer { accounts(filter: { accountTag: $a }) {
        t7: rumPageloadEventsAdaptiveGroups(filter: { AND: [{ siteTag: $s }, { datetime_geq: $s7 }, { datetime_leq: $u }] }, limit: 1) { sum { visits } count }
        t30: rumPageloadEventsAdaptiveGroups(filter: { AND: [{ siteTag: $s }, { datetime_geq: $s30 }, { datetime_leq: $u }] }, limit: 1) { sum { visits } count }
        byDay: rumPageloadEventsAdaptiveGroups(filter: { AND: [{ siteTag: $s }, { datetime_geq: $s30 }, { datetime_leq: $u }] }, orderBy: [date_ASC], limit: 60) { dimensions { date } sum { visits } count }
        topPages: rumPageloadEventsAdaptiveGroups(filter: { AND: [{ siteTag: $s }, { datetime_geq: $s30 }, { datetime_leq: $u }] }, orderBy: [count_DESC], limit: 12) { dimensions { requestPath } sum { visits } count }
      } }
    }`;

  try {
    const res = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables: { a: ACCOUNT_TAG, s: siteTag, s7: since7, s30: since30, u: until } }),
    });
    if (!res.ok) return json({ ok: false, reason: `http_${res.status}` });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await res.json();
    if (data.errors && data.errors.length) return json({ ok: false, reason: "graphql_error" });
    const acc = data.data?.viewer?.accounts?.[0] ?? {};
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const one = (g: any) => ({ visits: g?.[0]?.sum?.visits ?? 0, pageviews: g?.[0]?.count ?? 0 });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const byDay = (acc.byDay ?? []).map((g: any) => ({ date: g.dimensions?.date, visits: g.sum?.visits ?? 0, pageviews: g.count ?? 0 }));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topPages = (acc.topPages ?? []).map((g: any) => ({ path: g.dimensions?.requestPath, visits: g.sum?.visits ?? 0, pageviews: g.count ?? 0 }));
    return json({ ok: true, d7: one(acc.t7), d30: one(acc.t30), byDay, topPages, since30 });
  } catch {
    return json({ ok: false, reason: "exception" });
  }
};
