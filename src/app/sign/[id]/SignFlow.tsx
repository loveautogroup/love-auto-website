"use client";

/**
 * Customer-facing e-signature flow.
 *
 *   1. Load /api/sign/:id. Without the access code the API returns a preview
 *      (first name, document count, expiry) — the link alone shows nothing
 *      more and signs nothing (Diane, 2026-09-02).
 *   2. Enter the six-digit code the dealer gave by phone. A correct code
 *      returns a signer token; it is kept in sessionStorage for this tab and
 *      sent as X-Signer-Token on every later call.
 *   3. Consent: the five ESIGN elements from shared/esignConsent.ts, the
 *      demonstration PDF (type the word it shows), the checkbox. The server
 *      records the consent version + text hash.
 *   4. Sign each document; the server binds each signature to the document's
 *      content hash. 5. Completion screen.
 */

import { useEffect, useState } from "react";
import SignaturePad, { type SignatureMetadata } from "@/components/SignaturePad";
import { SITE_CONFIG } from "@/lib/constants";
import {
  ESIGN_CONSENT_SECTIONS,
  ESIGN_CONSENT_STATEMENT,
  ESIGN_CONSENT_VERSION,
  ESIGN_DEMO_PDF_PATH,
} from "../../../../shared/esignConsent";

type DocumentKind =
  | "buyers-order"
  | "odometer-disclosure"
  | "title-application"
  | "power-of-attorney"
  | "as-is-disclosure"
  | "arbitration-agreement"
  | "other";

interface Document {
  kind: DocumentKind;
  title: string;
  body?: string;
  contentHash?: string;
}

interface SignedDocument {
  kind: DocumentKind;
  title: string;
  documentHash?: string;
  signatureDataUrl: string;
  signatureMeta: SignatureMetadata;
}

/** The API answers with a preview until the code is entered. */
interface Preview {
  id: string;
  status: string;
  needsCode: true;
  customer: { firstName: string };
  docCount: number;
  expiresAt: string;
}

interface Session {
  id: string;
  createdAt: string;
  needsCode: false;
  customer: { firstName: string; lastName: string; email?: string; phone?: string };
  vehicle?: string;
  documents: Document[];
  expiresAt: string;
  status: string;
  openedAt?: string;
  consentedAt?: string;
  consentVersion?: string;
  signedDocuments?: SignedDocument[];
  completedAt?: string;
}

type Loaded = Preview | Session;

const TOKEN_KEY = (id: string) => `lag-esign-token:${id}`;

function readToken(id: string): string | null {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY(id));
  } catch {
    return null;
  }
}
function writeToken(id: string, token: string) {
  try {
    window.sessionStorage.setItem(TOKEN_KEY(id), token);
  } catch {
    /* private mode — the token still lives in React state for this page */
  }
}

export default function SignFlow() {
  const [data, setData] = useState<Loaded | null>(null);
  // The token a previous step of THIS tab stored; read once, lazily, so the
  // effect below does not set state directly (react-hooks/set-state-in-effect).
  const [token, setToken] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const parts = window.location.pathname.split("/").filter(Boolean);
    return parts[1] ? readToken(parts[1]) : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [locked, setLocked] = useState(false);
  const [working, setWorking] = useState(false);

  // Pull session ID from URL. Client-side only — we're in a client component.
  function getId(): string | null {
    if (typeof window === "undefined") return null;
    const parts = window.location.pathname.split("/").filter(Boolean);
    // /sign/{id}
    return parts[1] ?? null;
  }

  function authHeaders(tok: string | null): Record<string, string> {
    return tok ? { "X-Signer-Token": tok } : {};
  }

  async function loadSession(tok: string | null) {
    const id = getId();
    if (!id || id === "shell" || id === "placeholder") {
      setError("Missing session ID. Use the link the dealer sent you.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sign/${id}`, { headers: authHeaders(tok), cache: "no-store" });
      if (res.status === 423) {
        setLocked(true);
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? `HTTP ${res.status}`);
      }
      const j = await res.json();
      setData(j.session as Loaded);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot fetch on mount that flips `loading`; the session id lives in `window.location`, which does not exist during the static export's render, so it cannot be a lazy initializer (React #418). Pre-existing in this file.
    loadSession(token);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifyCode(code: string): Promise<string | null> {
    const id = getId();
    if (!id) return "Missing session ID.";
    setWorking(true);
    try {
      const res = await fetch(`/api/sign/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify-code", code }),
      });
      const j = await res.json().catch(() => ({}));
      if (res.status === 423) {
        setLocked(true);
        return null;
      }
      if (!res.ok) return j.error ?? `HTTP ${res.status}`;
      writeToken(id, j.signerToken);
      setToken(j.signerToken);
      setData(j.session as Session);
      return null;
    } catch (err) {
      return (err as Error).message;
    } finally {
      setWorking(false);
    }
  }

  async function acceptConsent(pdfWord: string): Promise<string | null> {
    const id = getId();
    if (!id) return "Missing session ID.";
    setWorking(true);
    try {
      const res = await fetch(`/api/sign/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ action: "consent", consent: true, consentVersion: ESIGN_CONSENT_VERSION, pdfWord }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) return j.error ?? `HTTP ${res.status}`;
      setData(j.session as Session);
      return null;
    } catch (err) {
      return (err as Error).message;
    } finally {
      setWorking(false);
    }
  }

  async function submitSignature(doc: Document, dataUrl: string, meta: SignatureMetadata) {
    const id = getId();
    if (!id) return;
    setWorking(true);
    try {
      const res = await fetch(`/api/sign/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ kind: doc.kind, signatureDataUrl: dataUrl, signatureMeta: meta }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error ?? `HTTP ${res.status}`);
      setData(j.session as Session);
    } catch (err) {
      alert(`Could not save signature: ${(err as Error).message}`);
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return <p className="text-center text-brand-gray-500 mt-12">Loading…</p>;
  }

  if (locked) {
    return (
      <Problem
        title="This link is locked"
        detail="Too many wrong codes were entered. Nothing has been signed. Call us and we will send a new link."
      />
    );
  }

  if (error || !data) {
    return <Problem title="Could not open session" detail={error ?? "Unknown error"} />;
  }

  // Step 2 — the code.
  if (data.needsCode) {
    return (
      <>
        <Header firstName={data.customer.firstName} />
        <CodeView docCount={data.docCount} expiresAt={data.expiresAt} working={working} onSubmit={verifyCode} />
      </>
    );
  }

  const session = data;

  if (session.status === "signed" || session.status === "archived") {
    return <CompletedView customer={session.customer} completedAt={session.completedAt} />;
  }

  // Step 3 — consent.
  if (session.status === "created" || session.status === "opened") {
    return (
      <>
        <Header firstName={session.customer.firstName} lastName={session.customer.lastName} vehicle={session.vehicle} />
        <ConsentView documents={session.documents} working={working} onAccept={acceptConsent} />
      </>
    );
  }

  // Step 4 — sign, one document at a time.
  const signedKinds = new Set((session.signedDocuments ?? []).map((d) => d.kind));
  const nextDoc = session.documents.find((d) => !signedKinds.has(d.kind));
  const signedCount = session.signedDocuments?.length ?? 0;
  const totalCount = session.documents.length;

  return (
    <div>
      <Header firstName={session.customer.firstName} lastName={session.customer.lastName} vehicle={session.vehicle} />
      <div className="mb-4 text-sm text-brand-gray-500 text-center">
        Document {signedCount + 1} of {totalCount}
      </div>
      {nextDoc && (
        <DocumentSignCard doc={nextDoc} working={working} onSubmit={(url, meta) => submitSignature(nextDoc, url, meta)} />
      )}
    </div>
  );
}

function Problem({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="bg-white rounded-xl border border-brand-red/20 p-6 text-center mt-12">
      <p className="text-brand-red font-semibold">{title}</p>
      <p className="text-sm text-brand-gray-600 mt-2">{detail}</p>
      <p className="text-sm text-brand-gray-600 mt-4">
        If you think this is a mistake, call Love Auto Group at{" "}
        <a href={`tel:${SITE_CONFIG.phoneRaw}`} className="text-brand-red font-semibold hover:underline">
          {SITE_CONFIG.phone}
        </a>
        .
      </p>
    </div>
  );
}

function Header({ firstName, lastName, vehicle }: { firstName: string; lastName?: string; vehicle?: string }) {
  return (
    <header className="text-center mb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-brand-gray-900">E-Sign Your Paperwork</h1>
      <p className="text-sm text-brand-gray-600 mt-2">
        For{" "}
        <strong>
          {firstName}
          {lastName ? ` ${lastName}` : ""}
        </strong>
        {vehicle ? <> · {vehicle}</> : null}
      </p>
    </header>
  );
}

function CodeView({
  docCount,
  expiresAt,
  working,
  onSubmit,
}: {
  docCount: number;
  expiresAt: string;
  working: boolean;
  onSubmit: (code: string) => Promise<string | null>;
}) {
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const digits = code.replace(/\D/g, "").slice(0, 6);

  async function go() {
    setErr(null);
    const e = await onSubmit(digits);
    if (e) setErr(e);
  }

  return (
    <div className="bg-white rounded-xl border border-brand-gray-200 p-6">
      <h2 className="text-lg font-bold text-brand-gray-900 mb-2">Enter your access code</h2>
      <p className="text-sm text-brand-gray-700 leading-relaxed mb-4">
        Love Auto Group has {docCount} document{docCount === 1 ? "" : "s"} ready for you to sign. To make
        sure it is you, enter the 6-digit code we gave you by phone. This link expires{" "}
        {new Date(expiresAt).toLocaleString()}.
      </p>
      <input
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9]*"
        value={digits}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && digits.length === 6) void go();
        }}
        placeholder="000000"
        aria-label="6-digit access code"
        className="w-full text-center font-mono text-3xl tracking-[0.4em] border border-brand-gray-300 rounded-xl px-4 py-3"
      />
      {err && <p className="text-sm text-brand-red mt-3">{err}</p>}
      <button
        onClick={() => void go()}
        disabled={digits.length !== 6 || working}
        className="mt-5 w-full py-3 bg-brand-red hover:bg-brand-red-dark text-white font-semibold rounded-xl disabled:bg-brand-gray-300 disabled:cursor-not-allowed"
      >
        {working ? "Checking…" : "Continue"}
      </button>
      <p className="text-xs text-brand-gray-500 mt-4 text-center">
        Don&apos;t have the code? Call us at{" "}
        <a href={`tel:${SITE_CONFIG.phoneRaw}`} className="text-brand-red font-semibold">
          {SITE_CONFIG.phone}
        </a>
        .
      </p>
    </div>
  );
}

function ConsentView({
  documents,
  working,
  onAccept,
}: {
  documents: Document[];
  working: boolean;
  onAccept: (pdfWord: string) => Promise<string | null>;
}) {
  const [consent, setConsent] = useState(false);
  const [pdfWord, setPdfWord] = useState("");
  const [err, setErr] = useState<string | null>(null);

  async function go() {
    setErr(null);
    const e = await onAccept(pdfWord);
    if (e) setErr(e);
  }

  return (
    <div className="bg-white rounded-xl border border-brand-gray-200 p-6">
      <h2 className="text-lg font-bold text-brand-gray-900 mb-1">Before you sign</h2>
      <p className="text-xs text-brand-gray-500 mb-4">Consent to electronic records and signatures, version {ESIGN_CONSENT_VERSION}</p>

      <div className="mb-4">
        <p className="text-sm font-semibold text-brand-gray-900 mb-1">The documents you will be asked to sign</p>
        <ol className="list-decimal pl-5 text-sm text-brand-gray-700">
          {documents.map((d) => (
            <li key={d.kind}>{d.title}</li>
          ))}
        </ol>
      </div>

      {ESIGN_CONSENT_SECTIONS.map((s) => (
        <section key={s.heading} className="mb-4">
          <h3 className="text-sm font-semibold text-brand-gray-900 mb-1">{s.heading}</h3>
          <p className="text-sm text-brand-gray-700 leading-relaxed">{s.body}</p>
        </section>
      ))}

      <div className="rounded-lg border border-brand-gray-200 bg-brand-gray-50 p-4 mb-4">
        <p className="text-sm font-semibold text-brand-gray-900 mb-2">Test: can your device open our PDFs?</p>
        <a
          href={ESIGN_DEMO_PDF_PATH}
          target="_blank"
          rel="noopener"
          className="inline-block text-sm font-semibold text-brand-red hover:underline"
        >
          Open the test PDF
        </a>
        <label className="block mt-3 text-sm text-brand-gray-700">
          Type the word shown in large letters in that file
          <input
            value={pdfWord}
            onChange={(e) => setPdfWord(e.target.value)}
            autoCapitalize="characters"
            autoComplete="off"
            className="mt-1 w-full border border-brand-gray-300 rounded-lg px-3 py-2 uppercase tracking-widest"
            aria-label="Word from the test PDF"
          />
        </label>
      </div>

      <label className="flex items-start gap-2 text-sm text-brand-gray-900 leading-relaxed p-3 bg-brand-gray-50 rounded-lg cursor-pointer">
        <input
          type="checkbox"
          className="w-4 h-4 mt-0.5 shrink-0"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>{ESIGN_CONSENT_STATEMENT}</span>
      </label>

      {err && <p className="text-sm text-brand-red mt-3">{err}</p>}

      <button
        onClick={() => void go()}
        disabled={!consent || !pdfWord.trim() || working}
        className="mt-5 w-full py-3 bg-brand-red hover:bg-brand-red-dark text-white font-semibold rounded-xl disabled:bg-brand-gray-300 disabled:cursor-not-allowed"
      >
        {working ? "Saving…" : "I agree — continue to sign"}
      </button>
      <p className="text-xs text-brand-gray-500 mt-3 text-center">
        Prefer paper? Close this page and call {SITE_CONFIG.phone}. Nothing is signed until you draw a signature.
      </p>
    </div>
  );
}

function DocumentSignCard({
  doc,
  working,
  onSubmit,
}: {
  doc: Document;
  working: boolean;
  onSubmit: (dataUrl: string, meta: SignatureMetadata) => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-brand-gray-200 p-6">
      <h2 className="text-lg font-bold text-brand-gray-900 mb-2">{doc.title}</h2>
      {doc.body && (
        <div className="text-sm text-brand-gray-700 leading-relaxed whitespace-pre-wrap mb-5 max-h-64 overflow-y-auto border border-brand-gray-200 rounded-lg p-4 bg-brand-gray-50">
          {doc.body}
        </div>
      )}
      {doc.contentHash && (
        <p className="text-[11px] text-brand-gray-400 mb-3 break-all">
          Document fingerprint {doc.contentHash.slice(0, 16)}… — your signature is recorded against this exact text.
        </p>
      )}
      <p className="text-sm font-medium text-brand-gray-900 mb-2">Sign below to accept this document</p>
      {working ? (
        <p className="text-center text-brand-gray-500 py-8">Saving signature…</p>
      ) : (
        <SignaturePad height={180} submitLabel="Submit this signature" onSubmit={onSubmit} />
      )}
    </div>
  );
}

function CompletedView({
  customer,
  completedAt,
}: {
  customer: { firstName: string; lastName: string };
  completedAt?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-brand-green/30 p-8 text-center">
      <svg className="w-16 h-16 text-brand-green mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <h1 className="text-2xl font-bold text-brand-gray-900 mb-2">All signed!</h1>
      <p className="text-brand-gray-600 max-w-md mx-auto">
        Thank you, <strong>{customer.firstName}</strong>. Your signatures have been recorded with Love Auto Group.
        Ask us for a copy of any signed document at any time, on paper or as a PDF, free.
      </p>
      {completedAt && (
        <p className="text-xs text-brand-gray-400 mt-4">Completed at {new Date(completedAt).toLocaleString()}</p>
      )}
      <a href={`tel:${SITE_CONFIG.phoneRaw}`} className="mt-6 inline-block text-brand-red font-semibold hover:underline">
        Questions? Call {SITE_CONFIG.phone}
      </a>
    </div>
  );
}
