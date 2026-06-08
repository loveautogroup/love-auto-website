/**
 * Same-origin proxy: website form -> DMS public intake (S27).
 *
 * WHY THIS EXISTS: NEXT_PUBLIC_DMS_INTAKE_KEY never inlines into the
 * client bundles on this build pipeline — it compiles to a RUNTIME
 * process.env read that is empty in the browser, so direct browser ->
 * DMS posts die with 401 "Missing x-intake-key". (The LeadForm had the
 * same silent failure.) Cloudflare Pages Functions DO see every project
 * env var at runtime, so this proxy attaches the key server-side — which
 * is also better hygiene: the key no longer ships in any JS bundle.
 *
 * The DMS still enforces its own CORS + per-key origin allowlist; we
 * forward an explicit Origin (allowed in Workers fetch, unlike browsers).
 */
interface Env {
  NEXT_PUBLIC_DMS_INTAKE_KEY?: string;
}

const UPSTREAM = "https://dms.loveautogroup.net/api/v1/public/leads";

export async function onRequestPost(ctx: { request: Request; env: Env }) {
  const key = ctx.env.NEXT_PUBLIC_DMS_INTAKE_KEY ?? "";
  if (!key) {
    return new Response(
      JSON.stringify({ error: "Intake key not configured. Please call us at (630) 359-3643." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
  let body: string;
  try {
    body = await ctx.request.text();
    if (body.length > 64_000) throw new Error("too large");
  } catch {
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const upstream = await fetch(UPSTREAM, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-intake-key": key,
      Origin: "https://www.loveautogroup.net",
      // Real client IP for the DMS rate limiter / consent audit trail.
      "x-forwarded-for": ctx.request.headers.get("cf-connecting-ip") ?? "",
    },
    body,
  });
  const text = await upstream.text();
  return new Response(text, {
    status: upstream.status,
    headers: { "Content-Type": "application/json" },
  });
}
