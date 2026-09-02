/**
 * Public e-sign endpoint — GET / POST / PATCH /api/sign/:id
 *
 * The URL alone is NOT enough to sign (Diane, 2026-09-02). Holding the link
 * gets a preview: first name, document count, expiry. Signing needs:
 *
 *   1. The six-digit access code the dealer gives the customer by phone
 *      (POST { action: "verify-code", code }). Five wrong tries void the
 *      session. A correct code returns a signer token, which the browser
 *      sends as `X-Signer-Token` on everything after; only its hash is stored.
 *   2. Consent (POST { action: "consent", consent, consentVersion, pdfWord })
 *      against the CURRENT consent copy in shared/esignConsent.ts — the
 *      version and the text's hash are recorded — plus the word from the
 *      demonstration PDF, which is the ESIGN 7001(c)(1)(C)(ii) proof that the
 *      customer can open the format we email.
 *   3. Each signature (PATCH) is bound to the document's contentHash fixed at
 *      mint. If the stored text no longer hashes the same, signing is refused
 *      rather than recording a signature over words nobody can reproduce.
 *
 * Unfinished sessions expire at `expiresAt` (checked here AND re-passed to KV
 * on every write); a completed one is retained. Responses are never cached.
 */

import {
  ACCESS_CODE_MAX_ATTEMPTS,
  accessCodeHash,
  documentContentHash,
  isSessionExpired,
  mintSignerToken,
  pdfDemoPassed,
  sessionPutOptions,
  sha256Hex,
  validateConsentInput,
  validateSignDocumentInput,
  validateVerifyCodeInput,
  type SigningSession,
  type SignedDocument,
} from "../../_lib/signing";
import { timingSafeEqual } from "../../_lib/admin-auth";
import { ESIGN_CONSENT_VERSION, esignConsentText } from "../../../shared/esignConsent";

interface Env {
  SIGNING: KVNamespace;
}

const MAX_BODY_BYTES = 3 * 1024 * 1024; // 3MB — plenty for one PNG signature
const SIGNER_HEADER = "X-Signer-Token";

/** What a browser that has NOT entered the code may see. */
function preview(s: SigningSession) {
  return {
    id: s.id,
    status: s.status,
    needsCode: true,
    customer: { firstName: s.customer.firstName },
    docCount: s.documents.length,
    expiresAt: s.expiresAt,
  };
}

/** The full session for a verified signer — secrets and audit internals removed. */
function stripInternal(s: SigningSession) {
  const {
    createdBy: _cb,
    openedIp: _oi,
    openedUa: _ou,
    consentIp: _ci,
    completedIp: _comi,
    completedUa: _comu,
    codeHash: _ch,
    codeAttempts: _ca,
    signerTokenHash: _sth,
    ...rest
  } = s;
  return { ...rest, needsCode: false };
}

async function loadSession(env: Env, id: string): Promise<SigningSession | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const s = (await env.SIGNING.get(`session:${id}`, { type: "json" })) as SigningSession | null;
  if (!s) return null;
  // Review 2026-09-02 #1: check the date ourselves. The public writes below
  // used to drop the key's KV expiry, so "expired" links kept working.
  if (isSessionExpired(s)) return null;
  return s;
}

async function save(env: Env, session: SigningSession): Promise<void> {
  await env.SIGNING.put(`session:${session.id}`, JSON.stringify(session), sessionPutOptions(session));
}

/** True iff the request carries the signer token minted for this session. */
async function isVerifiedSigner(request: Request, session: SigningSession): Promise<boolean> {
  if (!session.signerTokenHash || !session.codeVerifiedAt) return false;
  const token = request.headers.get(SIGNER_HEADER) ?? "";
  if (!/^[0-9a-f]{64}$/.test(token)) return false;
  return timingSafeEqual(await sha256Hex(token), session.signerTokenHash);
}

export const onRequestGet: PagesFunction<Env, "id"> = async ({ params, request, env }) => {
  const id = String(params.id ?? "");
  const session = await loadSession(env, id);
  if (!session) return json(404, { error: "Session not found or expired." });
  if (session.status === "void") return json(423, { error: "This link has been locked after too many wrong codes. Call us at (630) 359-3643." });

  if (session.status === "created") {
    session.status = "opened";
    session.openedAt = new Date().toISOString();
    session.openedIp = request.headers.get("cf-connecting-ip") ?? undefined;
    session.openedUa = request.headers.get("user-agent") ?? undefined;
    try {
      await save(env, session);
    } catch (err) {
      console.warn("[/api/sign] status update failed (non-fatal):", err);
    }
  }

  if (await isVerifiedSigner(request, session)) {
    return json(200, { ok: true, session: stripInternal(session) });
  }
  return json(200, { ok: true, session: preview(session) });
};

export const onRequestPost: PagesFunction<Env, "id"> = async ({ params, request, env }) => {
  const id = String(params.id ?? "");
  const session = await loadSession(env, id);
  if (!session) return json(404, { error: "Session not found or expired." });
  if (session.status === "void") return json(423, { error: "This link has been locked after too many wrong codes. Call us at (630) 359-3643." });
  if (session.status === "signed" || session.status === "archived") {
    return json(409, { error: "This session has already been completed." });
  }

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }
  const action = body.action ?? (body.consent === true ? "consent" : "");

  // ── 1. the access code ──────────────────────────────────────────────────
  if (action === "verify-code") {
    const v = validateVerifyCodeInput(body);
    if (!v.ok) return json(400, { error: v.issues.join("; ") });
    if (!session.codeHash) return json(409, { error: "This session was created without an access code. Ask the dealer for a new link." });
    const ok = timingSafeEqual(await accessCodeHash(session.id, v.code), session.codeHash);
    if (!ok) {
      session.codeAttempts = (session.codeAttempts ?? 0) + 1;
      const left = ACCESS_CODE_MAX_ATTEMPTS - session.codeAttempts;
      if (left <= 0) {
        session.status = "void";
        await save(env, session);
        return json(423, { error: "Too many wrong codes. This link is now locked; call us at (630) 359-3643 for a new one." });
      }
      await save(env, session);
      return json(401, { error: `That code is not right. ${left} ${left === 1 ? "try" : "tries"} left.`, attemptsLeft: left });
    }
    const token = mintSignerToken();
    session.signerTokenHash = await sha256Hex(token);
    session.codeVerifiedAt = new Date().toISOString();
    session.codeAttempts = 0;
    await save(env, session);
    return json(200, { ok: true, signerToken: token, session: stripInternal(session) });
  }

  // ── 2. consent ──────────────────────────────────────────────────────────
  if (action === "consent") {
    if (!(await isVerifiedSigner(request, session))) {
      return json(401, { error: "Enter the access code first." });
    }
    const v = validateConsentInput(body);
    if (!v.ok) return json(400, { error: v.issues.join("; ") });
    if (v.value.consentVersion !== ESIGN_CONSENT_VERSION) {
      return json(409, { error: "The consent text has been updated. Reload the page and read it again." });
    }
    if (!pdfDemoPassed(v.value.pdfWord)) {
      return json(400, { error: "That is not the word in the test PDF. Open the file and try again." });
    }
    session.status = "consented";
    session.consentedAt = new Date().toISOString();
    session.consentIp = request.headers.get("cf-connecting-ip") ?? undefined;
    session.consentVersion = ESIGN_CONSENT_VERSION;
    session.consentTextHash = await sha256Hex(esignConsentText());
    session.pdfDemoAt = session.consentedAt;
    await save(env, session);
    return json(200, { ok: true, session: stripInternal(session) });
  }

  return json(400, { error: "Unknown action." });
};

export const onRequestPatch: PagesFunction<Env, "id"> = async ({ params, request, env }) => {
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
  if (!session) return json(404, { error: "Session not found or expired." });
  if (session.status === "void") return json(423, { error: "This link has been locked." });
  if (session.status === "signed" || session.status === "archived") {
    return json(409, { error: "This session has already been completed." });
  }
  if (!(await isVerifiedSigner(request, session))) {
    return json(401, { error: "Enter the access code first." });
  }
  if (session.status !== "consented") {
    return json(400, { error: "You must accept the ESIGN consent before signing." });
  }

  const doc = session.documents.find((d) => d.kind === v.value.kind);
  if (!doc) {
    return json(400, { error: `This session has no document of kind "${v.value.kind}".` });
  }

  // ── 3. bind the signature to the exact text ──────────────────────────────
  const hashNow = await documentContentHash(doc);
  if (doc.contentHash && doc.contentHash !== hashNow) {
    return json(409, { error: "This document changed after it was prepared. Ask the dealer for a new link." });
  }

  const signed: SignedDocument = {
    kind: v.value.kind,
    title: doc.title,
    documentHash: hashNow,
    signatureDataUrl: v.value.signatureDataUrl,
    signatureMeta: v.value.signatureMeta,
  };

  session.signedDocuments = session.signedDocuments ?? [];
  session.signedDocuments = session.signedDocuments.filter((d) => d.kind !== v.value.kind);
  session.signedDocuments.push(signed);

  if (session.signedDocuments.length === session.documents.length) {
    session.status = "signed";
    session.completedAt = new Date().toISOString();
    session.completedIp = request.headers.get("cf-connecting-ip") ?? undefined;
    session.completedUa = request.headers.get("user-agent") ?? undefined;
  }

  await save(env, session); // a signed session is written WITHOUT expiry — it is a record now

  return json(200, {
    ok: true,
    session: stripInternal(session),
    done: session.status === "signed",
  });
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // A session carries the customer's name, contact and signature image.
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
