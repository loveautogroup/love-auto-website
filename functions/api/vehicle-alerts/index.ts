/**
 * POST /api/vehicle-alerts
 *
 * W2 demand capture: per-make new-arrival email subscriptions. The DMS
 * notification sweep (love-auto-dms src/lib/notify.ts sweepVehicleAlerts)
 * reads these and emails subscribers via Gmail when a matching vehicle
 * goes live. Unsubscribe handled by ./unsubscribe.ts.
 *
 * KV layout (LEADS namespace):
 *   valert:{makeLower}:{emailLower} -> subscription JSON (dedupe = key)
 *
 * The DMS sweep additionally writes (same namespace):
 *   valertinit:{makeLower}:{emailLower}  -> first-sweep marker (baseline:
 *       currently-live matches are marked sent WITHOUT emailing, so a new
 *       subscriber is only alerted for vehicles that arrive AFTER signup)
 *   valertsent:{vin}:{emailLower}        -> per-vehicle send marker
 *
 * Anti-abuse mirrors sell-your-car.ts: honeypot + min-elapsed + 5/hour/IP.
 */

interface Env {
  LEADS: KVNamespace;
}

interface AlertInput {
  email?: string;
  make?: string;
  locale?: string;
  website?: string; // honeypot
  startedAt?: number;
}

async function checkRateLimit(ip: string | undefined, env: Env): Promise<boolean> {
  if (!ip) return true;
  const key = `rate:valert:${ip}`;
  const now = Math.floor(Date.now() / 1000);
  const raw = await env.LEADS.get(key);
  const attempts: number[] = raw ? JSON.parse(raw) : [];
  const recent = attempts.filter((t) => now - t < 3600);
  if (recent.length >= 5) return false;
  recent.push(now);
  await env.LEADS.put(key, JSON.stringify(recent), { expirationTtl: 3700 });
  return true;
}

function bad(msg: string, status = 400): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const ip = ctx.request.headers.get("CF-Connecting-IP") ?? undefined;
  if (!(await checkRateLimit(ip, ctx.env))) {
    return bad("Too many requests. Try again in an hour.", 429);
  }

  let body: AlertInput;
  try {
    body = await ctx.request.json();
  } catch {
    return bad("Invalid request body.");
  }

  if (body.website) return bad("Submission rejected.");
  if (body.startedAt && Date.now() - body.startedAt < 2500) {
    return bad("Submission rejected.");
  }

  const email = (body.email ?? "").trim().toLowerCase();
  // Pragmatic email shape check (full RFC validation is a fool's errand).
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
    return bad("Valid email required.");
  }

  const make = (body.make ?? "any").trim().toLowerCase() || "any";
  if (!/^[a-z0-9][a-z0-9 -]{1,19}$/.test(make)) return bad("Invalid make.");

  const key = `valert:${make}:${email}`;
  const existing = await ctx.env.LEADS.get(key);
  if (existing) {
    // Already subscribed — idempotent success, keep the original token.
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const token = crypto.randomUUID().replace(/-/g, "");
  const sub = {
    email,
    make,
    locale: body.locale === "es" ? "es" : "en",
    token,
    createdAt: new Date().toISOString(),
    sourceIp: ip ?? null,
    userAgent: ctx.request.headers.get("User-Agent") ?? null,
  };
  await ctx.env.LEADS.put(key, JSON.stringify(sub));

  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
