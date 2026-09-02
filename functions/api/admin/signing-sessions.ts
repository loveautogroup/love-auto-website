/**
 * Admin /api/admin/signing-sessions
 *
 * POST — Jeremiah creates a new signing session. Returns the signing URL
 *        to send the customer.
 * GET  — lists all sessions (Jeremiah's dashboard).
 *
 * Sessions are stored in the SIGNING KV namespace. Each session has a
 * UUID id + a short-lived TTL (default 48h).
 */

import {
  accessCodeHash,
  documentContentHash,
  mintAccessCode,
  validateCreateSessionInput,
  type SigningSession,
} from "../../_lib/signing";

import { requireAdmin, type AdminAuthEnv } from "../../_lib/admin-auth";

interface Env extends AdminAuthEnv {
  SIGNING: KVNamespace;
}

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;
  const accessEmail =
    "admin";

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

  // Diane 2026-09-02: the URL alone must not be enough to sign. A six-digit
  // code is minted here, shown to the dealer ONCE, and only its hash is kept.
  // The dealer gives it by phone — never in the same message as the link.
  const accessCode = mintAccessCode();
  const codeHash = await accessCodeHash(id, accessCode);

  // Freeze what is being signed: each document's text is hashed now, and a
  // signature later binds to that hash (refused if the text no longer matches).
  const frozenDocuments = await Promise.all(
    documents.map(async (d) => ({ ...d, contentHash: await documentContentHash(d) })),
  );

  const session: SigningSession = {
    id,
    createdAt: now.toISOString(),
    createdBy: accessEmail,
    customer,
    vehicle,
    documents: frozenDocuments,
    expiresAt,
    status: "created",
    codeHash,
    codeAttempts: 0,
    codeToPhone: customer.phone,
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

  const signingUrl = `https://www.loveautogroup.net/sign/${id}/`;

  // The code is returned once and is deliberately NOT in the SMS text.
  const { codeHash: _omit, ...sessionForAdmin } = session;
  return json(200, {
    ok: true,
    session: sessionForAdmin,
    signingUrl,
    accessCode,
    codeInstructions:
      `Call ${customer.phone ?? "the customer"} and read this code aloud. Never put it in the same text or email as the link. It is not saved anywhere — if it is lost, create a new session. The number you read it to is recorded on the session.`,
    smsText:
      `Hi ${customer.firstName}, here is your link to e-sign your paperwork with Love Auto Group: ${signingUrl} (expires in ${expiresHours}h). I will call you with the 6-digit code that opens it.`,
  });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

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
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Admin data must never be stored by a browser, a shared proxy, or
      // Cloudflare's edge. public/_headers does NOT cover Pages Functions
      // responses, so the header has to be set right here.
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
