/**
 * Same-origin proxy: website chat widget -> DMS public web chat.
 *
 * Owner, 2026-09-13: "Let's complete the rest of the messenger portion."
 *
 * WHY A PROXY, the same reason as functions/api/leads.ts: NEXT_PUBLIC_* values
 * never inline into a browser bundle on this build pipeline, and a key in a
 * bundle is a key anyone has. Pages Functions see the project env at runtime,
 * so the intake key is attached here and never reaches the browser.
 *
 *   POST /api/chat                         -> POST /api/v1/public/web-chat
 *   GET  /api/chat?session_id=&after_id=   -> GET  /api/v1/public/web-chat
 *
 * ⚠️ NO KV HERE. Every other edge guard on this site counts in KV, and the chat
 * polls every few seconds while it is open. The free tier's daily write budget
 * ran out on 2026-09-03 and took three sweeps down with it; a chat window left
 * open would do that on its own. The DMS rate-limits both verbs per IP.
 */
interface Env {
  NEXT_PUBLIC_DMS_INTAKE_KEY?: string;
}

const UPSTREAM = "https://dms.loveautogroup.net/api/v1/public/web-chat";
const ORIGIN = "https://www.loveautogroup.net";

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function clientIp(request: Request): string {
  return (
    request.headers.get("cf-connecting-ip") ??
    request.headers.get("x-forwarded-for") ??
    ""
  );
}

export async function onRequestPost(ctx: { request: Request; env: Env }) {
  const key = ctx.env.NEXT_PUBLIC_DMS_INTAKE_KEY ?? "";
  if (!key) return json({ reply: "", handoff: true, error: "chat unavailable" }, 200);

  let body: string;
  try {
    body = await ctx.request.text();
    if (body.length > 8_000) throw new Error("too large");
    JSON.parse(body);
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  try {
    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-intake-key": key,
        Origin: ORIGIN,
        "x-forwarded-for": clientIp(ctx.request),
      },
      body,
    });
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return json({ reply: "", handoff: true, error: "chat unavailable" }, 200);
  }
}

export async function onRequestGet(ctx: { request: Request; env: Env }) {
  const key = ctx.env.NEXT_PUBLIC_DMS_INTAKE_KEY ?? "";
  if (!key) return json({ turns: [], owner_handling: false }, 200);

  const url = new URL(ctx.request.url);
  const sid = url.searchParams.get("session_id") ?? "";
  const after = url.searchParams.get("after_id") ?? "0";
  if (!/^[A-Za-z0-9-]{16,64}$/.test(sid) || !/^[0-9]{1,12}$/.test(after)) {
    return json({ turns: [], owner_handling: false }, 200);
  }

  try {
    const upstream = await fetch(
      `${UPSTREAM}?session_id=${encodeURIComponent(sid)}&after_id=${after}`,
      {
        headers: {
          "x-intake-key": key,
          Origin: ORIGIN,
          "x-forwarded-for": clientIp(ctx.request),
        },
      },
    );
    const text = await upstream.text();
    return new Response(text, {
      status: upstream.status,
      headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    });
  } catch {
    return json({ turns: [], owner_handling: false }, 200);
  }
}
