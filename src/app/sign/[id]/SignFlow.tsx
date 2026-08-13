"use client";

/**
 * Customer-facing e-signature flow.
 *
 * Flow:
 *   1. Load session by ID from /api/sign/:id
 *   2. Show ESIGN + UETA consent screen; customer ticks + clicks "Agree"
 *      which POSTs to the same URL to flip status → "consented".
 *   3. For each document on the session, show the title + body, then the
 *      SignaturePad. On submit, PATCH /api/sign/:id with the base64 PNG.
 *   4. When all docs are signed, show a completion screen with timestamps.
 */

import { useEffect, useState } from "react";
import SignaturePad, { type SignatureMetadata } from "@/components/SignaturePad";
import { SITE_CONFIG } from "@/lib/constants";

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
}

interface SignedDocument {
  kind: DocumentKind;
  title: string;
  signatureDataUrl: string;
  signatureMeta: SignatureMetadata;
}

interface Session {
  id: string;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  vehicle?: string;
  documents: Document[];
  expiresAt: string;
  status: string;
  openedAt?: string;
  consentedAt?: string;
  signedDocuments?: SignedDocument[];
  completedAt?: string;
}

export default function SignFlow() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [consent, setConsent] = useState(false);

  // Pull session ID from URL. Client-side only — we're in a client component.
  function getId(): string | null {
    if (typeof window === "undefined") return null;
    const parts = window.location.pathname.split("/").filter(Boolean);
    // /sign/{id}
    return parts[1] ?? null;
  }

  async function loadSession() {
    const id = getId();
    if (!id || id === "placeholder") {
      setError("Missing session ID. Use the link the dealer sent you.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/sign/${id}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      const data = await res.json();
      setSession(data.session as Session);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function acceptConsent() {
    const id = getId();
    if (!id) return;
    setWorking(true);
    try {
      const res = await fetch(`/api/sign/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consent: true }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSession(data.session as Session);
    } catch (err) {
      alert(`Could not record consent: ${(err as Error).message}`);
    } finally {
      setWorking(false);
    }
  }

  async function submitSignature(
    doc: Document,
    dataUrl: string,
    meta: SignatureMetadata
  ) {
    const id = getId();
    if (!id) return;
    setWorking(true);
    try {
      const res = await fetch(`/api/sign/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: doc.kind,
          signatureDataUrl: dataUrl,
          signatureMeta: meta,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setSession(data.session as Session);
    } catch (err) {
      alert(`Could not save signature: ${(err as Error).message}`);
    } finally {
      setWorking(false);
    }
  }

  if (loading) {
    return <p className="text-center text-brand-gray-500 mt-12">Loading…</p>;
  }

  if (error || !session) {
    return (
      <div className="bg-white rounded-xl border border-brand-red/20 p-6 text-center mt-12">
        <p className="text-brand-red font-semibold">Could not open session</p>
        <p className="text-sm text-brand-gray-600 mt-2">{error}</p>
        <p className="text-sm text-brand-gray-600 mt-4">
          If you think this is a mistake, call Love Auto Group at{" "}
          <a
            href={`tel:${SITE_CONFIG.phoneRaw}`}
            className="text-brand-red font-semibold hover:underline"
          >
            {SITE_CONFIG.phone}
          </a>
          .
        </p>
      </div>
    );
  }

  // Already fully signed?
  if (session.status === "signed" || session.status === "archived") {
    return (
      <CompletedView
        customer={session.customer}
        completedAt={session.completedAt}
      />
    );
  }

  // Still need consent?
  const needsConsent =
    session.status === "created" || session.status === "opened";

  if (needsConsent) {
    return (
      <ConsentView
        customer={session.customer}
        vehicle={session.vehicle}
        docCount={session.documents.length}
        consent={consent}
        onConsentChange={setConsent}
        onAccept={acceptConsent}
        working={working}
      />
    );
  }

  // Next unsigned document
  const signedKinds = new Set(
    (session.signedDocuments ?? []).map((d) => d.kind)
  );
  const nextDoc = session.documents.find((d) => !signedKinds.has(d.kind));
  const signedCount = session.signedDocuments?.length ?? 0;
  const totalCount = session.documents.length;

  return (
    <div>
      <Header customer={session.customer} vehicle={session.vehicle} />
      <div className="mb-4 text-sm text-brand-gray-500 text-center">
        Document {signedCount + 1} of {totalCount}
      </div>
      {nextDoc && (
        <DocumentSignCard
          doc={nextDoc}
          working={working}
          onSubmit={(url, meta) => submitSignature(nextDoc, url, meta)}
        />
      )}
    </div>
  );
}

function Header({
  customer,
  vehicle,
}: {
  customer: { firstName: string; lastName: string };
  vehicle?: string;
}) {
  return (
    <header className="text-center mb-6">
      <h1 className="text-2xl md:text-3xl font-bold text-brand-gray-900">
        E-Sign Your Paperwork
      </h1>
      <p className="text-sm text-brand-gray-600 mt-2">
        For <strong>{customer.firstName} {customer.lastName}</strong>
        {vehicle ? <> · {vehicle}</> : null}
      </p>
    </header>
  );
}

function ConsentView({
  customer,
  vehicle,
  docCount,
  consent,
  onConsentChange,
  onAccept,
  working,
}: {
  customer: { firstName: string; lastName: string };
  vehicle?: string;
  docCount: number;
  consent: boolean;
  onConsentChange: (v: boolean) => void;
  onAccept: () => void;
  working: boolean;
}) {
  return (
    <>
      <Header customer={customer} vehicle={vehicle} />
      <div className="bg-white rounded-xl border border-brand-gray-200 p-6">
        <h2 className="text-lg font-bold text-brand-gray-900 mb-3">
          Before you sign
        </h2>
        <p className="text-sm text-brand-gray-700 leading-relaxed mb-3">
          Love Auto Group is about to ask you to electronically sign{" "}
          <strong>{docCount}</strong> document
          {docCount === 1 ? "" : "s"} for your purchase. Under the U.S. ESIGN
          Act and the Illinois Uniform Electronic Transactions Act, your
          electronic signature has the same legal effect as a handwritten
          signature.
        </p>
        <p className="text-sm text-brand-gray-700 leading-relaxed mb-3">
          To sign electronically, you need a device with a screen (this one
          works) and some way to draw your signature — your finger, a
          stylus, or a mouse. You can clear and redraw as many times as you
          want before submitting each signature.
        </p>
        <p className="text-sm text-brand-gray-700 leading-relaxed mb-6">
          If you prefer to sign on paper, simply close this window and stop
          by our Villa Park lot at 735 N Yale Ave. No harm, no foul.
        </p>

        <label className="flex items-start gap-2 text-sm text-brand-gray-900 leading-relaxed p-3 bg-brand-gray-50 rounded-lg cursor-pointer">
          <input
            type="checkbox"
            className="w-4 h-4 mt-0.5 shrink-0"
            checked={consent}
            onChange={(e) => onConsentChange(e.target.checked)}
          />
          <span>
            <strong>I consent</strong> to conduct this transaction
            electronically. I agree that my electronic signature will have
            the same legal effect as a handwritten signature, and I
            understand I can request paper copies of any signed document
            from Love Auto Group at any time.
          </span>
        </label>

        <button
          onClick={onAccept}
          disabled={!consent || working}
          className="mt-5 w-full py-3 bg-brand-red hover:bg-brand-red-dark text-white font-semibold rounded-xl disabled:bg-brand-gray-300 disabled:cursor-not-allowed"
        >
          {working ? "Saving…" : "I agree — continue to sign"}
        </button>
      </div>
    </>
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
      <p className="text-sm font-medium text-brand-gray-900 mb-2">
        Sign below to accept this document
      </p>
      {working ? (
        <p className="text-center text-brand-gray-500 py-8">Saving signature…</p>
      ) : (
        <SignaturePad
          height={180}
          submitLabel="Submit this signature"
          onSubmit={onSubmit}
        />
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
      <svg
        className="w-16 h-16 text-brand-green mx-auto mb-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
      <h1 className="text-2xl font-bold text-brand-gray-900 mb-2">
        All signed!
      </h1>
      <p className="text-brand-gray-600 max-w-md mx-auto">
        Thank you, <strong>{customer.firstName}</strong>. Your signatures have
        been recorded and sent to Love Auto Group. We&apos;ll email you a
        copy of every signed document within one business day.
      </p>
      {completedAt && (
        <p className="text-xs text-brand-gray-400 mt-4">
          Completed at {new Date(completedAt).toLocaleString()}
        </p>
      )}
      <a
        href="tel:6303593643"
        className="mt-6 inline-block text-brand-red font-semibold hover:underline"
      >
        Questions? Call (630) 359-3643
      </a>
    </div>
  );
}
