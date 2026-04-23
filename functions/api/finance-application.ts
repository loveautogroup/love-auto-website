/**
 * POST /api/finance-application
 *
 * Receives credit-application submissions from the public /financing form,
 * validates them, stores them in Cloudflare KV for Jordan to review, and
 * (once RESEND_API_KEY is configured) emails Jeremiah a notification.
 *
 * Data flow:
 *   Customer fills form → POST here → validate → store in KV → send email
 *                                                           → respond OK
 *
 * Sam's notes:
 *   - KV key namespacing: "lead:{ISO timestamp}:{random}" so they naturally
 *     sort chronologically and won't collide.
 *   - Every submission gets IP + user-agent logged for audit trail.
 *   - Rate limiting via Cloudflare's per-IP quota — if we see abuse,
 *     add a KV-backed rate limiter here (first complaint).
 *   - Email is best-effort; if Resend fails we still return success so
 *     the customer isn't confused, but we log the failure for Jeremiah
 *     to investigate (and the lead is still in KV).
 *
 * Diane's notes:
 *   - Honeypot + min-elapsed time enforced in validation.
 *   - No SSN accepted on the form (caught in validator).
 *   - TCPA + privacy consents required.
 */

import {
  validateFinanceApplication,
  type FinanceApplicationInput,
} from "../_lib/finance-validation";

interface Env {
  /** KV namespace binding for storing leads. Configure in wrangler.jsonc. */
  LEADS: KVNamespace;
  /** Resend API key (optional — if unset, email notification is skipped). */
  RESEND_API_KEY?: string;
  /** Email recipient for lead notifications (defaults to loveautogroup@gmail.com). */
  LEAD_NOTIFICATION_EMAIL?: string;
}

interface StoredLead extends FinanceApplicationInput {
  id: string;
  submittedAt: string;
  sourceIp?: string;
  userAgent?: string;
  status: "new" | "contacted" | "qualified" | "lost";
}

/** Simple KV-backed per-IP rate limiter. Caps at 3 submissions per hour. */
async function checkRateLimit(
  ip: string | undefined,
  env: Env
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  if (!ip) return { ok: true }; // no IP → let through; CF edge should always give us one
  const key = `rate:finance:${ip}`;
  const now = Math.floor(Date.now() / 1000);
  const raw = await env.LEADS.get(key);
  const attempts: number[] = raw ? JSON.parse(raw) : [];
  // Keep only timestamps within the last hour
  const recent = attempts.filter((t) => now - t < 3600);
  if (recent.length >= 3) {
    const oldestRecent = Math.min(...recent);
    return { ok: false, retryAfterSec: 3600 - (now - oldestRecent) };
  }
  recent.push(now);
  await env.LEADS.put(key, JSON.stringify(recent), { expirationTtl: 3600 });
  return { ok: true };
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const { request, env } = ctx;

  // Anti-abuse: per-IP rate limit. 3 per hour.
  const ip = request.headers.get("cf-connecting-ip") ?? undefined;
  const rl = await checkRateLimit(ip, env);
  if (!rl.ok) {
    return new Response(
      JSON.stringify({
        ok: false,
        error:
          "You've submitted several applications recently. If this was in error, call us at (630) 359-3643.",
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Retry-After": String(rl.retryAfterSec),
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  const result = validateFinanceApplication(body);
  if (!result.ok) {
    return json({ ok: false, errors: result.issues }, 400);
  }

  const submittedAt = new Date().toISOString();
  const id = `${submittedAt}-${crypto.randomUUID().slice(0, 8)}`;

  const lead: StoredLead = {
    ...result.value,
    id,
    submittedAt,
    sourceIp: request.headers.get("cf-connecting-ip") ?? undefined,
    userAgent: request.headers.get("user-agent") ?? undefined,
    status: "new",
  };

  try {
    await env.LEADS.put(`lead:${id}`, JSON.stringify(lead));
  } catch (err) {
    console.error("[/api/finance-application] KV write failed:", err);
    return json(
      { ok: false, error: "Could not save application. Please try again or call us." },
      503
    );
  }

  // Best-effort email notification — don't block on it.
  // If RESEND_API_KEY isn't configured yet, this silently returns.
  ctx.waitUntil(sendLeadEmail(lead, env));

  return json({
    ok: true,
    message: "Application received. We'll be in touch shortly.",
    id,
  });
};

// Preflight for the public fetch()
export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Max-Age": "86400",
    },
  });

function json(payload: object, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/**
 * Sends a lead-notification email via Resend.
 * Skips silently if API key isn't configured.
 */
async function sendLeadEmail(lead: StoredLead, env: Env): Promise<void> {
  if (!env.RESEND_API_KEY) return;

  const to = env.LEAD_NOTIFICATION_EMAIL ?? "loveautogroup@gmail.com";
  const subject = `New finance application: ${lead.firstName} ${lead.lastName}`;

  // Plain-text body. Jeremiah's phone-friendly; structured enough to triage
  // at a glance.
  const lines = [
    `New finance application received.`,
    ``,
    `Applicant: ${lead.firstName} ${lead.lastName}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email}`,
    ``,
    `Address: ${lead.addressStreet}, ${lead.addressCity}, ${lead.addressState} ${lead.addressZip}`,
    `DOB: ${lead.dateOfBirth}`,
    ``,
    `Housing: ${lead.housingStatus}${
      lead.monthlyHousingPayment ? ` ($${lead.monthlyHousingPayment}/mo)` : ""
    }`,
    `Employment: ${lead.employmentStatus}`,
    lead.employer ? `Employer: ${lead.employer}` : "",
    lead.jobTitle ? `Job title: ${lead.jobTitle}` : "",
    lead.timeAtJobMonths ? `Time at job: ${lead.timeAtJobMonths} months` : "",
    `Monthly income: $${lead.monthlyIncome}`,
    ``,
    lead.vehicleInterest ? `Vehicle of interest: ${lead.vehicleInterest}` : "",
    lead.desiredMonthlyPayment
      ? `Desired payment: $${lead.desiredMonthlyPayment}/mo`
      : "",
    lead.desiredDownPayment
      ? `Down payment: $${lead.desiredDownPayment}`
      : "",
    ``,
    lead.hasTradeIn ? `Has trade-in: ${lead.tradeInDetails}` : "No trade-in",
    ``,
    `Submitted: ${lead.submittedAt}`,
    `Lead ID: ${lead.id}`,
    ``,
    `— Submitted via loveautogroup.net/financing`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Love Auto Group <leads@loveautogroup.net>",
        to: [to],
        reply_to: lead.email,
        subject,
        text: lines,
      }),
    });
    if (!res.ok) {
      const errText = await res.text();
      console.error(
        `[/api/finance-application] Resend ${res.status}: ${errText}`
      );
    }
  } catch (err) {
    console.error("[/api/finance-application] Email send failed:", err);
  }
}
