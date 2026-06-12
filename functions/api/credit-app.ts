/**
 * Same-origin proxy: website form -> DMS public intake (S27).
 *
 * WHY THIS EXISTS: NEXT_PUBLIC_DMS_INTAKE_KEY never inlines into the
 * client bundles on this build pipeline -- it compiles to a RUNTIME
 * process.env read that is empty in the browser, so direct browser ->
 * DMS posts die with 401 "Missing x-intake-key". (The LeadForm had the
 * same silent failure.) Cloudflare Pages Functions DO see every project
 * env var at runtime, so this proxy attaches the key server-side -- which
 * is also better hygiene: the key no longer ships in any JS bundle.
 *
 * The DMS still enforces its own CORS + per-key origin allowlist; we
 * forward an explicit Origin (allowed in Workers fetch, unlike browsers).
 *
 * M3 (security hardening, S41):
 *   - Honeypot field: reject if non-empty (bot trap)
 *   - Min-elapsed guard: reject if < 8 s since form load (bot timing)
 *   - Per-IP rate limit: max 3 attempts per 10 min via LEADS KV namespace
 */
interface Env {
  NEXT_PUBLIC_DMS_INTAKE_KEY?: string;
  LEADS?: KVNamespace;
}

const UPSTREAM = "https://dms.loveautogroup.net/api/v1/public/credit-applications";
const RL_WINDOW_SECONDS = 600; // 10 minutes
const RL_MAX_ATTEMPTS = 3;
const MIN_ELAPSED_MS = 8_000; // 8 seconds

export async function onRequestPost(ctx: { request: Request; env: Env }) {
  const key = ctx.env.NEXT_PUBLIC_DMS_INTAKE_KEY ?? "";
  if (!key) {
    return new Response(
      JSON.stringify({ error: "Intake key not configured. Please call us at (630) 359-3643." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  // Per-IP rate limit (uses LEADS KV namespace — already bound to this Pages project).
  const ip =
    ctx.request.headers.get("cf-connecting-ip") ??
    ctx.request.headers.get("x-forwarded-for") ??
    "unknown";
  const rlKey = `ratelimit:creditapp:${ip}`;
  if (ctx.env.LEADS) {
    const attempts = parseInt((await ctx.env.LEADS.get(rlKey)) ?? "0", 10);
    if (attempts >= RL_MAX_ATTEMPTS) {
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later or call us at (630) 359-3643." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }
    await ctx.env.LEADS.put(rlKey, String(attempts + 1), {
      expirationTtl: RL_WINDOW_SECONDS,
    });
  }

  let body: string;
  let parsed: Record<string, unknown>;
  try {
    body = await ctx.request.text();
    if (body.length > 64_000) throw new Error("too large");
    parsed = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Honeypot: bot trap field must be absent or empty string.
  const honeypot = parsed["honeypot"];
  if (honeypot !== undefined && honeypot !== "" && honeypot !== null) {
    // Silently accept but do not forward (don't reveal the trap).
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Timing guard: form must have been open >= 8 s before submission.
  const startedAt = parsed["startedAt"];
  if (typeof startedAt === "number") {
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_ELAPSED_MS) {
      return new Response(JSON.stringify({ error: "Submission too fast. Please try again." }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Clear rate-limit counter on a seemingly legitimate submission.
  if (ctx.env.LEADS) {
    await ctx.env.LEADS.delete(rlKey);
  }

  const upstream = await fetch(UPSTREAM, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-intake-key": key,
      Origin: "https://www.loveautogroup.net",
      // Real client IP for the DMS rate limiter / consent audit trail.
      "x-forwarded-for": ip,
    },
    body,
  });
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
