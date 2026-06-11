/**
 * POST /api/admin/login  — exchange the admin password for a session cookie.
 *
 * Body: { password: string }
 * Success: 200 { ok: true } + Set-Cookie (httpOnly signed session).
 * Failure: 401 { error }. Per-IP rate limited via the LEADS KV namespace.
 *
 * This route does NOT call requireAdmin (it is the entry point). It is the
 * only /api/admin/* route that is intentionally pre-auth.
 */
import {
  AdminAuthEnv,
  signSession,
  sessionSetCookie,
  sessionClearCookie,
  timingSafeEqual,
} from "../../_lib/admin-auth";

interface Env extends AdminAuthEnv {
  LEADS?: KVNamespace; // reused for a simple per-IP attempt counter
}

const MAX_ATTEMPTS = 8;
const WINDOW_SECONDS = 15 * 60;

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  if (!env.ADMIN_PASSWORD || !env.ADMIN_AUTH_SECRET) {
    return json(503, { error: "Admin login is not configured." });
  }

  const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
  const rlKey = `adminlogin:${ip}`;

  // Rate limit (best-effort; KV may be absent in some envs).
  if (env.LEADS) {
    const raw = await env.LEADS.get(rlKey);
    const attempts = raw ? parseInt(raw, 10) || 0 : 0;
    if (attempts >= MAX_ATTEMPTS) {
      return json(429, { error: "Too many attempts. Try again later." });
    }
  }

  let body: { password?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json(400, { error: "Invalid request." });
  }
  const password = typeof body.password === "string" ? body.password : "";

  if (!timingSafeEqual(password, env.ADMIN_PASSWORD)) {
    if (env.LEADS) {
      const raw = await env.LEADS.get(rlKey);
      const attempts = (raw ? parseInt(raw, 10) || 0 : 0) + 1;
      await env.LEADS.put(rlKey, String(attempts), { expirationTtl: WINDOW_SECONDS });
    }
    return json(401, { error: "Incorrect password." });
  }

  // Success — clear the rate-limit counter and issue a session.
  if (env.LEADS) await env.LEADS.delete(rlKey);
  const token = await signSession(env);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": sessionSetCookie(token),
      "Cache-Control": "no-store",
    },
  });
};

// Optional logout: POST is used for login; a GET clears the cookie.
export const onRequestGet: PagesFunction<Env> = async () => {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": sessionClearCookie(),
    },
  });
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}
