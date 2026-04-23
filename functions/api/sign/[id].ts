/**
 * Public /api/sign/:id
 *
 * GET — fetch the signing session (customer-facing — strips internal
 *       fields like createdBy email).
 * POST — customer gives ESIGN consent (flips status from "created"
 *        → "consented"; stamps IP + UA + timestamp).
 * PATCH — append a signed document (one call per signed doc). When all
 *         documents are signed, flips status to "signed" and stamps
 *         completedAt.
 *
 * No auth — access is gated by knowledge of the session ID, which is a
 * UUID v4 delivered to the customer by SMS/email. IDs are single-use in
 * the sense that once a session is "signed", PATCH returns 409.
 */

import {
  validateSignDocumentInput,
  type SigningSession,
  type SignedDocument,
} from "../../_lib/signing";

interface Env {
  SIGNING: KVNamespace;
}

const MAX_BODY_BYTES = 3 * 1024 * 1024; // 3MB — plenty for one PNG signature

function stripInternal(s: SigningSession) {
  // Don't leak dealer email or audit IPs back to the public endpoint.
  const {
    createdBy: _cb,
    openedIp: _oi,
    openedUa: _ou,
    consentIp: _ci,
    completedIp: _comi,
    completedUa: _comu,
    ...rest
  } = s;
  return rest;
}

async function loadSession(env: Env, id: string): Promise<SigningSession | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const s = await env.SIGNING.get(`session:${id}`, { type: "json" });
  return (s as SigningSession | null) ?? null;
}

export const onRequestGet: PagesFunction<Env, "id"> = async ({
  params,
  request,
  env,
}) => {
  const id = String(params.id ?? "");
  const session = await loadSession(env, id);
  if (!session) {
    return json(404, { error: "Session not found or expired." });
  }

  // Stamp first-open timestamp + audit bits on first GET (status === "created").
  if (session.status === "created") {
    session.status = "opened";
    session.openedAt = new Date().toISOString();
    session.openedIp = request.headers.get("cf-connecting-ip") ?? undefined;
    session.openedUa = request.headers.get("user-agent") ?? undefined;
    try {
      await env.SIGNING.put(`session:${id}`, JSON.stringify(session));
    } catch (err) {
      console.warn("[/api/sign] status update failed (non-fatal):", err);
    }
  }

  return json(200, { ok: true, session: stripInternal(session) });
};

export const onRequestPost: PagesFunction<Env, "id"> = async ({
  params,
  request,
  env,
}) => {
  // POST is the ESIGN consent acceptance.
  const id = String(params.id ?? "");
  const session = await loadSession(env, id);
  if (!session) {
    return json(404, { error: "Session not found or expired." });
  }
  if (session.status === "signed" || session.status === "archived") {
    return json(409, { error: "This session has already been completed." });
  }

  session.status = "consented";
  session.consentedAt = new Date().toISOString();
  session.consentIp = request.headers.get("cf-connecting-ip") ?? undefined;

  await env.SIGNING.put(`session:${id}`, JSON.stringify(session));

  return json(200, { ok: true, session: stripInternal(session) });
};

export const onRequestPatch: PagesFunction<Env, "id"> = async ({
  params,
  request,
  env,
}) => {
  const id = String(params.id ?? "");

  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return json(413, { error: "Signature too large. Max 3MB." });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  const v = validateSignDocumentInput(body);
  if (!v.ok) return json(400, { error: "Invalid signature", issues: v.issues });

  const session = await loadSession(env, id);
  if (!session) {
    return json(404, { error: "Session not found or expired." });
  }
  if (session.status !== "consented" && session.status !== "signed") {
    return json(400, {
      error: "You must accept the ESIGN consent before signing.",
    });
  }
  if (session.status === "signed" || session.status === "archived") {
    return json(409, { error: "This session has already been completed." });
  }

  // Verify the doc kind is actually on this session.
  const doc = session.documents.find((d) => d.kind === v.value.kind);
  if (!doc) {
    return json(400, { error: `This session has no document of kind "${v.value.kind}".` });
  }

  const signed: SignedDocument = {
    kind: v.value.kind,
    title: doc.title,
    signatureDataUrl: v.value.signatureDataUrl,
    signatureMeta: v.value.signatureMeta,
  };

  session.signedDocuments = session.signedDocuments ?? [];
  // Replace any existing signature for this doc (customer hit Clear and re-signed).
  session.signedDocuments = session.signedDocuments.filter((d) => d.kind !== v.value.kind);
  session.signedDocuments.push(signed);

  // If every document is signed, flip status to "signed" and stamp completion.
  if (session.signedDocuments.length === session.documents.length) {
    session.status = "signed";
    session.completedAt = new Date().toISOString();
    session.completedIp = request.headers.get("cf-connecting-ip") ?? undefined;
    session.completedUa = request.headers.get("user-agent") ?? undefined;
  }

  await env.SIGNING.put(`session:${id}`, JSON.stringify(session));

  return json(200, {
    ok: true,
    session: stripInternal(session),
    done: session.status === "signed",
  });
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
