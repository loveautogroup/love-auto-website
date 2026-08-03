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
 *
 * EDGE ANTI-SPAM (2026-08-03, test-drive flow). Every guard below is keyed on
 * a field only the newer forms send, so the original LeadForm path is
 * byte-for-byte unchanged:
 *   - honeypot non-empty -> silent 200, not forwarded. The DMS already drops
 *     these (silent 200, no row); doing it here just saves the upstream call.
 *     Real users always send "".
 *   - startedAt present and < MIN_ELAPSED_MS -> 400. LeadForm never sends
 *     startedAt, so this is a no-op for it.
 *   - per-IP rate limit scoped to source === "website-test-drive" only, via
 *     the LEADS KV namespace. Deliberately NOT applied to general inquiries:
 *     throttling the main lead path is a revenue risk, and the DMS already
 *     enforces 5 per IP per 10 min on every submission.
 */
interface Env {
  NEXT_PUBLIC_DMS_INTAKE_KEY?: string;
  LEADS?: KVNamespace;
}

const UPSTREAM = "https://dms.loveautogroup.net/api/v1/public/leads";

/** leadSource tag written by src/components/TestDriveForm.tsx. */
const TEST_DRIVE_SOURCE = "website-test-drive";
const MIN_ELAPSED_MS = 4_000;      // form must be open >= 4 s
const RL_WINDOW_SECONDS = 600;     // 10 minutes
const RL_MAX_ATTEMPTS = 3;         // test-drive requests per IP per window

function json(payload: unknown, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function onRequestPost(ctx: { request: Request; env: Env }) {
  const key = ctx.env.NEXT_PUBLIC_DMS_INTAKE_KEY ?? "";
  if (!key) {
    return json(
      { error: "Intake key not configured. Please call us at (630) 359-3643." },
      500
    );
  }

  const ip =
    ctx.request.headers.get("cf-connecting-ip") ??
    ctx.request.headers.get("x-forwarded-for") ??
    "";

  let body: string;
  let parsed: Record<string, unknown> = {};
  try {
    body = await ctx.request.text();
    if (body.length > 64_000) throw new Error("too large");
    parsed = JSON.parse(body) as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid request" }, 400);
  }

  // Honeypot: bots fill it. Accept silently so the trap is not revealed.
  const honeypot = parsed["honeypot"];
  if (typeof honeypot === "string" && honeypot !== "") {
    return json({ ok: true }, 200);
  }

  // Timing guard - only engages for forms that send startedAt.
  const startedAt = parsed["startedAt"];
  if (typeof startedAt === "number" && Date.now() - startedAt < MIN_ELAPSED_MS) {
    return json({ error: "Submission too fast. Please try again." }, 400);
  }

  // Per-IP rate limit, test-drive requests only (see header note).
  const isTestDrive = parsed["source"] === TEST_DRIVE_SOURCE;
  const rlKey = `ratelimit:testdrive:${ip}`;
  if (isTestDrive && ctx.env.LEADS && ip) {
    const attempts = parseInt((await ctx.env.LEADS.get(rlKey)) ?? "0", 10);
    if (attempts >= RL_MAX_ATTEMPTS) {
      return json(
        {
          error:
            "Too many requests. Please try again later or call us at (630) 359-3643.",
        },
        429
      );
    }
    await ctx.env.LEADS.put(rlKey, String(attempts + 1), {
      expirationTtl: RL_WINDOW_SECONDS,
    });
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
