/**
 * Admin /api/admin/signing-sessions
 *
 * POST — Jeremiah creates a new signing session. Returns the signing URL
 *        to send the customer. Protected by Cloudflare Access.
 * GET  — lists all sessions (Jeremiah's dashboard).
 *
 * Sessions are stored in the SIGNING KV namespace. Each session has a
 * UUID id + a short-lived TTL (default 48h).
 */

import {
  validateCreateSessionInput,
  type SigningSession,
} from "../../_lib/signing";

interface Env {
  SIGNING: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const accessJwt = request.headers.get("cf-access-jwt-assertion");
  if (!accessJwt) {
    return json(401, { error: "Unauthenticated." });
  }
  const accessEmail =
    request.headers.get("cf-access-authenticated-user-email") ?? "unknown";

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  const v = validateCreateSessionInput(body);
  if (!v.ok) return json(400, { error: "Invalid session", issues: v.issues });

  const { customer, vehicle, documents, expiresHours = 48 } = v.value;
  const id = crypto.randomUUID();
  const now = new Date();
  const expiresAt = new Date(
    now.getTime() + expiresHours * 3600 * 1000
  ).toISOString();

  const session: SigningSession = {
    id,
    createdAt: now.toISOString(),
    createdBy: accessEmail,
    customer,
    vehicle,
    documents,
    expiresAt,
    status: "created",
  };

  try {
    await env.SIGNING.put(`session:${id}`, JSON.stringify(session), {
      expirationTtl: expiresHours * 3600,
      metadata: {
        createdBy: accessEmail,
        createdAt: session.createdAt,
        customer: `${customer.firstName} ${customer.lastName}`,
      },
    });
  } catch (err) {
    console.error("[/api/admin/signing-sessions POST] KV write failed:", err);
    return json(503, { error: "Could not save session." });
  }

  const signingUrl = `https://www.loveautogroup.net/sign/${id}`;

  return json(200, {
    ok: true,
    session,
    signingUrl,
    smsText:
      `Hi ${customer.firstName}, please click to e-sign your paperwork with Love Auto Group: ${signingUrl} (expires in ${expiresHours}h).`,
  });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const accessJwt = request.headers.get("cf-access-jwt-assertion");
  if (!accessJwt) {
    return json(401, { error: "Unauthenticated." });
  }

  try {
    const keys: string[] = [];
    let cursor: string | undefined;
    while (true) {
      const page = await env.SIGNING.list({
        prefix: "session:",
        cursor,
        limit: 1000,
      });
      keys.push(...page.keys.map((k) => k.name));
      if (page.list_complete) break;
      cursor = page.cursor;
      if (keys.length >= 5000) break;
    }
    const sessions = await Promise.all(
      keys.map((key) => env.SIGNING.get(key, { type: "json" }))
    );
    // Most recent first
    const valid = sessions.filter((s): s is SigningSession => !!s);
    valid.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return json(200, { ok: true, count: valid.length, sessions: valid });
  } catch (err) {
    console.error("[/api/admin/signing-sessions GET] KV read failed:", err);
    return json(503, { error: "Could not read sessions." });
  }
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
