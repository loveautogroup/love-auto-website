/**
 * Types and validation for the e-signature flow.
 *
 * A "signing session" is created by the dealer (Jeremiah) for a specific
 * customer + document set. It produces a one-time URL that the customer
 * opens on their own device (or Jeremiah's iPad at the lot). The customer
 * signs in a browser, their signature is captured, and the resulting
 * PDFs are archived.
 *
 * Legal note (Diane):
 *   ESIGN Act + IL UETA require:
 *     - Consent to conduct business electronically
 *     - Clear intent to sign
 *     - Association of signature with the record
 *     - Retention of the record
 *     - Signer identity verification
 *   This module enforces (1), (2), and (3). (4) is retention by KV +
 *   future PDF archive. (5) — identity — is dealer-confirmed via
 *   Jeremiah seeing the customer's ID at the lot, plus the session's
 *   SMS-link delivery acting as a soft second-factor on remote sign.
 */

export type DocumentKind =
  | "buyers-order"
  | "odometer-disclosure"
  | "title-application"
  | "power-of-attorney"
  | "as-is-disclosure"
  | "arbitration-agreement"
  | "other";

export interface SigningDocument {
  kind: DocumentKind;
  /** Jeremiah-provided label, e.g. "Buyer's Order — 2016 Honda Pilot". */
  title: string;
  /** Plain-text body the customer sees before signing. Keep simple. */
  body?: string;
}

export type SessionStatus =
  | "created" // Jeremiah made it, customer hasn't opened yet
  | "opened" // Customer loaded the signing page
  | "consented" // Customer ticked the ESIGN consent checkbox
  | "signed" // All signatures captured
  | "archived" // PDFs generated + filed (future)
  | "void"; // Cancelled / expired

export interface SignedDocument {
  kind: DocumentKind;
  title: string;
  /** Base64 PNG data URL of the signature. */
  signatureDataUrl: string;
  /** Any metadata captured from the signature pad. */
  signatureMeta: {
    strokeCount: number;
    canvasWidthCss: number;
    canvasHeightCss: number;
    capturedAt: string;
  };
}

export interface SigningSession {
  /** Session ID — also the URL token. UUID v4. */
  id: string;
  /** ISO timestamp when Jeremiah created the session. */
  createdAt: string;
  createdBy: string;
  /** Who the session is for. */
  customer: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  /** What vehicle this deal is on (optional — free text). */
  vehicle?: string;
  /** Documents the customer needs to sign, in order. */
  documents: SigningDocument[];
  /** How many hours the session is valid after creation. Default 48h. */
  expiresAt: string;
  status: SessionStatus;
  /** Set when customer loads the signing page. */
  openedAt?: string;
  /** IP + UA captured at open + sign, for audit trail. */
  openedIp?: string;
  openedUa?: string;
  /** Set when the customer ticks the ESIGN consent checkbox. */
  consentedAt?: string;
  consentIp?: string;
  /** Populated as the customer signs each document. */
  signedDocuments?: SignedDocument[];
  /** Set when every document is signed. */
  completedAt?: string;
  completedIp?: string;
  completedUa?: string;
}

// ── Which documents may be signed on this canvas ─────────────────────────────
//
// Diane, 2026-09-02 (review #1): three kinds cannot lawfully be e-signed here
// and are refused at mint AND at signature time:
//   odometer-disclosure  49 CFR 580.5 — electronic odometer signatures only
//                        through a state system NHTSA has approved; Illinois
//                        status unconfirmed. Wet ink or ERT/CVR until then.
//   power-of-attorney    49 CFR 580.13 — the odometer POA must be on a
//                        state-issued secure form. Wet ink, always.
//   title-application    VSD-190 is a prescribed SOS form (625 ILCS 5/3-104);
//                        electronic only via ERT/CVR.
//   other                unbounded; gated until a kind is named.
// `VALID_KINDS` stays the type's vocabulary; `ESIGNABLE_KINDS` is what the
// server accepts. Widening this list is a legal decision, not a code one.
export const ESIGNABLE_KINDS: readonly DocumentKind[] = [
  "buyers-order",
  "as-is-disclosure",
  "arbitration-agreement",
];

// ── Expiry ──────────────────────────────────────────────────────────────────
//
// Review 2026-09-02 #1. The session is minted with `expirationTtl`, but every
// later `put` from the public endpoints (opened / consented / signed) wrote it
// back WITHOUT one — and a KV put without an expiration removes the earlier
// one (measured on the live namespace: a 60 s key rewritten with no TTL was
// still there at 100 s). So an opened session lived forever and the "expired"
// link kept accepting signatures. Two rules, both used by every write:
//   1. `isSessionExpired` — the code checks `expiresAt` itself, never relying
//      on KV to have deleted the key.
//   2. `sessionPutOptions` — every write re-passes the absolute `expiration`
//      so the key dies when the session does. KV refuses an expiration under
//      60 s away; a session that close to the end is treated as expired.

/** Refuse an expired session before reading or writing it. */
export function isSessionExpired(session: Pick<SigningSession, "expiresAt">, nowMs = Date.now()): boolean {
  const exp = Date.parse(session.expiresAt);
  if (!Number.isFinite(exp)) return true; // no parsable expiry = not trusted
  return exp - nowMs < 60_000;
}

/** Options for `SIGNING.put` that keep the key's death tied to `expiresAt`. */
export function sessionPutOptions(session: Pick<SigningSession, "expiresAt">): { expiration: number } {
  return { expiration: Math.floor(Date.parse(session.expiresAt) / 1000) };
}

export interface CreateSessionInput {
  customer: SigningSession["customer"];
  vehicle?: string;
  documents: SigningDocument[];
  /** Hours until expiry. Default 48, max 168. */
  expiresHours?: number;
}

const VALID_KINDS: DocumentKind[] = [
  "buyers-order",
  "odometer-disclosure",
  "title-application",
  "power-of-attorney",
  "as-is-disclosure",
  "arbitration-agreement",
  "other",
];

const MAX_TITLE = 120;
const MAX_BODY = 5000;
const MAX_DOCS = 10;

export function validateCreateSessionInput(
  input: unknown
): { ok: true; value: CreateSessionInput } | { ok: false; issues: string[] } {
  const issues: string[] = [];
  if (!input || typeof input !== "object") {
    return { ok: false, issues: ["Body must be an object."] };
  }
  const o = input as Record<string, unknown>;

  // Customer
  const c = o.customer as Record<string, unknown> | undefined;
  if (!c || typeof c !== "object") {
    issues.push("customer is required");
  } else {
    if (typeof c.firstName !== "string" || c.firstName.trim().length === 0) {
      issues.push("customer.firstName is required");
    }
    if (typeof c.lastName !== "string" || c.lastName.trim().length === 0) {
      issues.push("customer.lastName is required");
    }
    // Need at least one contact method to deliver the link.
    if (
      (!c.email || typeof c.email !== "string") &&
      (!c.phone || typeof c.phone !== "string")
    ) {
      issues.push("customer must have at least one of: email, phone");
    }
  }

  // Vehicle (optional)
  if (o.vehicle !== undefined && typeof o.vehicle !== "string") {
    issues.push("vehicle must be a string");
  }

  // Documents
  if (!Array.isArray(o.documents) || o.documents.length === 0) {
    issues.push("documents must be a non-empty array");
  } else if (o.documents.length > MAX_DOCS) {
    issues.push(`documents cannot exceed ${MAX_DOCS} items`);
  } else {
    o.documents.forEach((d: unknown, i: number) => {
      const doc = d as Record<string, unknown>;
      if (!ESIGNABLE_KINDS.includes(doc.kind as DocumentKind)) {
        issues.push(
          `documents[${i}].kind "${String(doc.kind)}" cannot be e-signed here; allowed: ${ESIGNABLE_KINDS.join(", ")}`,
        );
      }
      if (
        typeof doc.title !== "string" ||
        doc.title.trim().length === 0 ||
        doc.title.length > MAX_TITLE
      ) {
        issues.push(`documents[${i}].title is required (≤ ${MAX_TITLE} chars)`);
      }
      if (doc.body !== undefined) {
        if (typeof doc.body !== "string" || doc.body.length > MAX_BODY) {
          issues.push(`documents[${i}].body must be a string ≤ ${MAX_BODY} chars`);
        }
      }
    });
  }

  // Expiry
  if (o.expiresHours !== undefined) {
    const n = Number(o.expiresHours);
    if (!Number.isFinite(n) || n < 1 || n > 168) {
      issues.push("expiresHours must be between 1 and 168");
    }
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, value: input as CreateSessionInput };
}

export interface SignDocumentInput {
  kind: DocumentKind;
  signatureDataUrl: string;
  signatureMeta: SignedDocument["signatureMeta"];
}

const DATA_URL_PNG_MAX_BYTES = 2 * 1024 * 1024; // 2MB base64 ≈ 1.5MB raw

export function validateSignDocumentInput(
  input: unknown
): { ok: true; value: SignDocumentInput } | { ok: false; issues: string[] } {
  const issues: string[] = [];
  if (!input || typeof input !== "object") {
    return { ok: false, issues: ["Body must be an object."] };
  }
  const o = input as Record<string, unknown>;

  if (!ESIGNABLE_KINDS.includes(o.kind as DocumentKind)) {
    issues.push("kind cannot be e-signed here");
  }
  if (
    typeof o.signatureDataUrl !== "string" ||
    !o.signatureDataUrl.startsWith("data:image/png;base64,") ||
    o.signatureDataUrl.length > DATA_URL_PNG_MAX_BYTES
  ) {
    issues.push("signatureDataUrl must be a PNG data URL under 2MB");
  }
  const m = o.signatureMeta as Record<string, unknown> | undefined;
  if (
    !m ||
    typeof m.strokeCount !== "number" ||
    typeof m.canvasWidthCss !== "number" ||
    typeof m.canvasHeightCss !== "number" ||
    typeof m.capturedAt !== "string"
  ) {
    issues.push("signatureMeta must include strokeCount, canvasWidthCss, canvasHeightCss, capturedAt");
  }

  if (issues.length > 0) return { ok: false, issues };
  return { ok: true, value: input as SignDocumentInput };
}
