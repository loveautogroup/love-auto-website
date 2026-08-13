"use client";

import { useEffect, useState } from "react";
import { getTemplate } from "@/data/signingTemplates";

type DocumentKind =
  | "buyers-order"
  | "odometer-disclosure"
  | "title-application"
  | "power-of-attorney"
  | "as-is-disclosure"
  | "arbitration-agreement"
  | "other";

const KIND_LABELS: Record<DocumentKind, string> = {
  "buyers-order": "Buyer's Order",
  "odometer-disclosure": "Odometer Disclosure",
  "title-application": "Title Application",
  "power-of-attorney": "Power of Attorney",
  "as-is-disclosure": "As-Is Disclosure",
  "arbitration-agreement": "Arbitration Agreement",
  other: "Other",
};

interface SessionDoc {
  kind: DocumentKind;
  title: string;
  body?: string;
}

interface Session {
  id: string;
  createdAt: string;
  createdBy: string;
  customer: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
  };
  vehicle?: string;
  documents: SessionDoc[];
  expiresAt: string;
  status: string;
  openedAt?: string;
  consentedAt?: string;
  signedDocuments?: unknown[];
  completedAt?: string;
}

export default function SigningAdmin() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create form state
  const [creating, setCreating] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicle, setVehicle] = useState("");
  const [docs, setDocs] = useState<SessionDoc[]>([
    { kind: "buyers-order", title: "Buyer's Order" },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [lastCreated, setLastCreated] = useState<{
    signingUrl: string;
    smsText: string;
  } | null>(null);

  async function fetchSessions() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/signing-sessions", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSessions((data.sessions ?? []) as Session[]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSessions();
  }, []);

  function addDoc() {
    setDocs((prev) => [...prev, { kind: "other", title: "" }]);
  }
  function removeDoc(i: number) {
    setDocs((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updateDoc<K extends keyof SessionDoc>(
    i: number,
    field: K,
    value: SessionDoc[K]
  ) {
    setDocs((prev) =>
      prev.map((d, idx) => (idx === i ? { ...d, [field]: value } : d))
    );
  }

  async function createSession(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/signing-sessions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer: {
            firstName,
            lastName,
            email: email || undefined,
            phone: phone || undefined,
          },
          vehicle: vehicle || undefined,
          documents: docs.filter((d) => d.title.trim().length > 0),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setLastCreated({
        signingUrl: data.signingUrl,
        smsText: data.smsText,
      });
      // Reset and refresh
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      setVehicle("");
      setDocs([{ kind: "buyers-order", title: "Buyer's Order" }]);
      setCreating(false);
      await fetchSessions();
    } catch (err) {
      alert(`Could not create session: ${(err as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <div className="flex gap-3 mb-6">
        <button
          onClick={() => setCreating((v) => !v)}
          className="bg-brand-red hover:bg-brand-red-dark text-white font-semibold px-4 py-2 rounded-lg"
        >
          {creating ? "Cancel" : "+ New signing session"}
        </button>
        <button
          onClick={fetchSessions}
          className="border-2 border-brand-gray-200 hover:bg-brand-gray-50 px-4 py-2 rounded-lg text-sm font-semibold"
        >
          ↻ Refresh
        </button>
      </div>

      {lastCreated && (
        <div className="bg-brand-green/10 border border-brand-green/30 rounded-xl p-5 mb-6">
          <p className="font-bold text-brand-gray-900 mb-2">
            Session created — send this to the customer:
          </p>
          <div className="space-y-3">
            <div>
              <p className="text-xs text-brand-gray-500 uppercase font-semibold mb-1">
                Signing URL
              </p>
              <p className="font-mono text-sm bg-white border border-brand-gray-200 p-2 rounded break-all">
                {lastCreated.signingUrl}
              </p>
            </div>
            <div>
              <p className="text-xs text-brand-gray-500 uppercase font-semibold mb-1">
                SMS-ready text (copy, paste into Messages)
              </p>
              <p className="text-sm bg-white border border-brand-gray-200 p-2 rounded">
                {lastCreated.smsText}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  navigator.clipboard.writeText(lastCreated.signingUrl)
                }
                className="text-sm font-semibold bg-white border border-brand-gray-200 px-3 py-1.5 rounded hover:bg-brand-gray-50"
              >
                Copy URL
              </button>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(lastCreated.smsText)
                }
                className="text-sm font-semibold bg-white border border-brand-gray-200 px-3 py-1.5 rounded hover:bg-brand-gray-50"
              >
                Copy SMS text
              </button>
              <button
                onClick={() => setLastCreated(null)}
                className="text-sm text-brand-gray-500 ml-auto"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {creating && (
        <form
          onSubmit={createSession}
          className="bg-white rounded-xl border border-brand-gray-200 p-6 mb-6 space-y-5"
        >
          <h2 className="text-lg font-bold text-brand-gray-900">
            New signing session
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Customer first name"
              required
              value={firstName}
              onChange={setFirstName}
            />
            <Field
              label="Customer last name"
              required
              value={lastName}
              onChange={setLastName}
            />
            <Field
              label="Email"
              type="email"
              value={email}
              onChange={setEmail}
              helper="Optional if phone is provided"
            />
            <Field
              label="Phone"
              type="tel"
              value={phone}
              onChange={setPhone}
              helper="Optional if email is provided"
            />
            <div className="sm:col-span-2">
              <Field
                label="Vehicle (optional)"
                placeholder="e.g. 2016 Honda Pilot Touring"
                value={vehicle}
                onChange={setVehicle}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-semibold text-brand-gray-900">
                Documents to sign
              </label>
              <button
                type="button"
                onClick={addDoc}
                className="text-sm text-brand-red hover:underline font-semibold"
              >
                + Add document
              </button>
            </div>
            <ul className="space-y-3">
              {docs.map((doc, i) => (
                <li
                  key={i}
                  className="border border-brand-gray-200 rounded-lg p-3 space-y-2"
                >
                  <div className="flex gap-2 items-center">
                    <select
                      value={doc.kind}
                      onChange={(e) =>
                        updateDoc(i, "kind", e.target.value as DocumentKind)
                      }
                      className="border border-brand-gray-200 rounded px-2 py-1.5 text-sm bg-white"
                    >
                      {(Object.keys(KIND_LABELS) as DocumentKind[]).map((k) => (
                        <option key={k} value={k}>
                          {KIND_LABELS[k]}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Document title (what the customer sees)"
                      value={doc.title}
                      onChange={(e) => updateDoc(i, "title", e.target.value)}
                      className="flex-1 border border-brand-gray-200 rounded px-2 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const t = getTemplate(doc.kind);
                        if (t) {
                          updateDoc(i, "title", t.title);
                          updateDoc(i, "body", t.body);
                        } else {
                          alert(`No template available for "${KIND_LABELS[doc.kind]}" — fill in manually.`);
                        }
                      }}
                      disabled={doc.kind === "other"}
                      className="text-xs font-semibold bg-brand-gray-100 hover:bg-brand-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-brand-gray-700 px-2 py-1.5 rounded whitespace-nowrap"
                      title="Fill in the Diane-approved boilerplate for this document kind"
                    >
                      Use template
                    </button>
                    {docs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeDoc(i)}
                        className="text-brand-red hover:text-brand-red-dark"
                        aria-label="Remove document"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <textarea
                    placeholder="Document body (what the customer reads before signing). Optional — click 'Use template' for Diane-approved boilerplate, then edit any [bracketed] placeholders."
                    rows={4}
                    value={doc.body ?? ""}
                    onChange={(e) => updateDoc(i, "body", e.target.value)}
                    className="w-full border border-brand-gray-200 rounded px-2 py-1.5 text-sm font-mono"
                  />
                  {doc.body && doc.body.includes("[") && (
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                      ⚠ Template contains <code>[bracketed]</code>{" "}
                      placeholders — replace them with real values before
                      sending.
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-red hover:bg-brand-red-dark text-white font-semibold py-3 rounded-xl disabled:bg-brand-gray-300"
          >
            {submitting ? "Creating…" : "Create signing session"}
          </button>
        </form>
      )}

      {loading ? (
        <p className="text-brand-gray-500">Loading sessions…</p>
      ) : error ? (
        <div className="bg-brand-red/10 border border-brand-red/20 rounded-lg p-4 text-brand-red">
          {error}
        </div>
      ) : sessions.length === 0 ? (
        <p className="text-brand-gray-500 text-sm">
          No sessions yet. Create one above.
        </p>
      ) : (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="bg-white border border-brand-gray-200 rounded-xl p-4"
            >
              <div className="flex justify-between items-start gap-3 flex-wrap">
                <div>
                  <p className="font-semibold text-brand-gray-900">
                    {s.customer.firstName} {s.customer.lastName}
                  </p>
                  {s.vehicle && (
                    <p className="text-sm text-brand-gray-500">{s.vehicle}</p>
                  )}
                  <p className="text-xs text-brand-gray-500 mt-1">
                    Created {new Date(s.createdAt).toLocaleString()} · Expires{" "}
                    {new Date(s.expiresAt).toLocaleString()}
                  </p>
                </div>
                <StatusBadge status={s.status} />
              </div>
              <p className="text-sm text-brand-gray-600 mt-2">
                {s.documents.length} document{s.documents.length === 1 ? "" : "s"}:{" "}
                {s.documents.map((d) => d.title).join(", ")}
              </p>
              <div className="mt-3 flex gap-2">
                <a
                  href={`/sign/${s.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-semibold text-brand-red hover:underline"
                >
                  Open signing URL ↗
                </a>
                <button
                  onClick={() =>
                    navigator.clipboard.writeText(
                      `https://www.loveautogroup.net/sign/${s.id}`
                    )
                  }
                  className="text-sm text-brand-gray-500 hover:underline ml-auto"
                >
                  Copy URL
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  required,
  type = "text",
  placeholder,
  helper,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  helper?: string;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-brand-gray-900 mb-1">
        {label}
        {required && <span className="text-brand-red"> *</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-brand-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
      />
      {helper && <span className="block text-xs text-brand-gray-500 mt-1">{helper}</span>}
    </label>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    created: "bg-brand-gray-100 text-brand-gray-700",
    opened: "bg-blue-100 text-blue-700",
    consented: "bg-amber-100 text-amber-800",
    signed: "bg-green-100 text-green-800",
    archived: "bg-green-100 text-green-800",
    void: "bg-brand-red/10 text-brand-red",
  };
  return (
    <span
      className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${colors[status] ?? colors.created}`}
    >
      {status}
    </span>
  );
}
