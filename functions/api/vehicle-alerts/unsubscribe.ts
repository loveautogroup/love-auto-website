/**
 * GET /api/vehicle-alerts/unsubscribe?e={email}&t={token}
 *
 * One-click unsubscribe for new-arrival alert emails (CAN-SPAM). Deletes
 * every valert:* subscription for the email whose stored token matches.
 * Always renders a friendly page — never an error a customer has to parse.
 */

interface Env {
  LEADS: KVNamespace;
}

function page(message: string): Response {
  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Love Auto Group</title>
<style>
  body{font-family:Montserrat,system-ui,sans-serif;background:#0a0a0a;color:#fff;
       display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0}
  .card{max-width:420px;padding:40px;text-align:center}
  .logo{font-weight:900;font-size:28px;letter-spacing:2px}
  .logo span{color:#dc2626}
  p{color:#d4d4d4;line-height:1.6}
  a{color:#dc2626;text-decoration:none;font-weight:600}
</style></head>
<body><div class="card">
  <div class="logo">LOVE <span>AUTO GROUP</span></div>
  <p>${message}</p>
  <p><a href="https://www.loveautogroup.net/inventory/">Browse our inventory</a></p>
</div></body></html>`;
  return new Response(html, {
    status: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const url = new URL(ctx.request.url);
  const email = (url.searchParams.get("e") ?? "").trim().toLowerCase();
  const token = (url.searchParams.get("t") ?? "").trim();

  if (!email || !token) {
    return page("That unsubscribe link is incomplete. If you keep getting emails you don't want, just reply to one and we'll take you off the list.");
  }

  let removed = 0;
  let cursor: string | undefined;
  do {
    const listing = await ctx.env.LEADS.list({ prefix: "valert:", cursor });
    for (const k of listing.keys) {
      if (!k.name.endsWith(`:${email}`)) continue;
      const raw = await ctx.env.LEADS.get(k.name);
      if (!raw) continue;
      try {
        const sub = JSON.parse(raw) as { token?: string };
        if (sub.token === token) {
          await ctx.env.LEADS.delete(k.name);
          removed++;
        }
      } catch {
        /* malformed record — leave it */
      }
    }
    cursor = listing.list_complete ? undefined : listing.cursor;
  } while (cursor);

  if (removed > 0) {
    return page("You're unsubscribed. No more new-arrival emails from us.");
  }
  return page("You're already off the list. No more new-arrival emails from us.");
};
