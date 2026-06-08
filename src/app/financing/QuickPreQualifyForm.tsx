"use client";

/**
 * Quick Pre-Qualify — the SHORT no-SSN form (S27, Jeremiah's ask).
 *
 * Five fields + consents, ~60 seconds. Posts to the legacy KV pipeline
 * (/api/finance-application) with formType:"prequal" — the validator
 * skips address/DOB/housing for this type. Shows up in the DMS
 * /dashboard/finance-apps list next to full applications.
 * NO SSN is collected here by design; the full Credit Application tab
 * handles that path.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success" }
  | { kind: "error"; messages: string[] };

export default function QuickPreQualifyForm() {
  const [values, setValues] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    employmentStatus: "",
    monthlyIncome: "",
    vehicleInterest: "",
    desiredDownPayment: "",
    tcpaConsent: false,
    privacyConsent: false,
    honeypot: "",
  });
  const [state, setState] = useState<State>({ kind: "idle" });
  const renderTimestamp = useRef<number>(0);

  useEffect(() => {
    renderTimestamp.current = Date.now();
    try {
      const q = new URLSearchParams(window.location.search);
      const v = q.get("vehicle");
      const down = q.get("down");
      setValues((prev) => ({
        ...prev,
        vehicleInterest: prev.vehicleInterest || (v ?? ""),
        desiredDownPayment: prev.desiredDownPayment || (down ?? ""),
      }));
    } catch {
      /* best effort */
    }
  }, []);

  function update<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.kind === "submitting") return;
    setState({ kind: "submitting" });
    try {
      const res = await fetch("/api/finance-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          formType: "prequal",
          hasTradeIn: false,
          hasCoBuyer: false,
          ...values,
          monthlyIncome: Number(values.monthlyIncome || 0),
          renderTimestamp: renderTimestamp.current,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setState({
          kind: "error",
          messages: Array.isArray(data.errors)
            ? data.errors
            : [data.error ?? "Could not submit. Please call us at (630) 359-3643."],
        });
        return;
      }
      setState({ kind: "success" });
    } catch {
      setState({ kind: "error", messages: ["Network error. Please try again or call (630) 359-3643."] });
    }
  }

  const disabled = state.kind === "submitting";
  const fieldClass =
    "w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red disabled:bg-brand-gray-50";

  if (state.kind === "success") {
    return (
      <div className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-8 text-center">
        <h3 className="text-xl font-bold text-brand-gray-900 mb-2">You&apos;re In!</h3>
        <p className="text-brand-gray-600 max-w-md mx-auto">
          We&apos;ll review your info and reach out within 1 business day with
          options. Want to talk now? Call{" "}
          <a href="tel:6303593643" className="text-brand-red font-semibold hover:underline">
            (630) 359-3643
          </a>{" "}
          or browse{" "}
          <Link href="/inventory" className="text-brand-red hover:underline">
            our inventory
          </Link>
          .
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="bg-white border border-brand-gray-200 rounded-xl p-6 sm:p-8 space-y-5">
      <div>
        <h2 className="text-xl font-bold text-brand-gray-900">Quick Pre-Qualify</h2>
        <p className="text-sm text-brand-gray-500 mt-1">
          60 seconds, no Social Security number, no impact to your credit.
          We&apos;ll text or call you with options.
        </p>
      </div>

      {state.kind === "error" && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-sm text-red-700">
          <p className="font-semibold mb-1">Please fix the following:</p>
          <ul className="list-disc ml-5 space-y-0.5">
            {state.messages.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="block text-sm font-medium text-brand-gray-900 mb-1">
            First name <span className="text-brand-red">*</span>
          </span>
          <input type="text" required autoComplete="given-name" className={fieldClass}
            value={values.firstName} onChange={(e) => update("firstName", e.target.value)} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-brand-gray-900 mb-1">
            Last name <span className="text-brand-red">*</span>
          </span>
          <input type="text" required autoComplete="family-name" className={fieldClass}
            value={values.lastName} onChange={(e) => update("lastName", e.target.value)} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-brand-gray-900 mb-1">
            Phone <span className="text-brand-red">*</span>
          </span>
          <input type="tel" required autoComplete="tel" placeholder="(630) 555-1234" className={fieldClass}
            value={values.phone} onChange={(e) => update("phone", e.target.value)} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-brand-gray-900 mb-1">
            Email <span className="text-brand-red">*</span>
          </span>
          <input type="email" required autoComplete="email" className={fieldClass}
            value={values.email} onChange={(e) => update("email", e.target.value)} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-brand-gray-900 mb-1">
            Employment status <span className="text-brand-red">*</span>
          </span>
          <select required className={fieldClass} value={values.employmentStatus}
            onChange={(e) => update("employmentStatus", e.target.value)}>
            <option value="">Select…</option>
            <option value="employed">Employed (W-2)</option>
            <option value="self-employed">Self-employed</option>
            <option value="retired">Retired</option>
            <option value="student">Student</option>
            <option value="unemployed">Unemployed</option>
            <option value="other">Other</option>
          </select>
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-brand-gray-900 mb-1">
            Monthly income (before taxes) <span className="text-brand-red">*</span>
          </span>
          <input type="number" required inputMode="numeric" min={0} placeholder="$" className={fieldClass}
            value={values.monthlyIncome} onChange={(e) => update("monthlyIncome", e.target.value)} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-brand-gray-900 mb-1">Vehicle you&apos;re interested in</span>
          <input type="text" placeholder="e.g. 2017 Lexus GS 350" className={fieldClass}
            value={values.vehicleInterest} onChange={(e) => update("vehicleInterest", e.target.value)} />
        </label>
        <label className="block">
          <span className="block text-sm font-medium text-brand-gray-900 mb-1">Down payment</span>
          <input type="number" inputMode="numeric" min={0} placeholder="$" className={fieldClass}
            value={values.desiredDownPayment} onChange={(e) => update("desiredDownPayment", e.target.value)} />
        </label>
      </div>

      {/* Honeypot — hidden from humans */}
      <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
        <label>
          Company website
          <input type="text" tabIndex={-1} autoComplete="off" value={values.honeypot}
            onChange={(e) => update("honeypot", e.target.value)} />
        </label>
      </div>

      <fieldset className="space-y-3 border-t border-brand-gray-200 pt-4" disabled={disabled}>
        <label className="flex items-start gap-2 text-xs text-brand-gray-700 leading-relaxed">
          <input type="checkbox" required checked={values.tcpaConsent}
            onChange={(e) => update("tcpaConsent", e.target.checked)} className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            <span className="font-semibold">Text message consent (required):</span>{" "}
            By checking this box, I consent to receive text messages from Love
            Auto Group at the phone number provided, including texts sent via
            automated systems, about my inquiry. Message and data rates may
            apply. Message frequency varies. Reply STOP to opt out at any time.
            Consent is not a condition of purchase.
          </span>
        </label>
        <label className="flex items-start gap-2 text-xs text-brand-gray-700 leading-relaxed">
          <input type="checkbox" required checked={values.privacyConsent}
            onChange={(e) => update("privacyConsent", e.target.checked)} className="w-4 h-4 mt-0.5 shrink-0" />
          <span>
            <span className="font-semibold">Privacy acknowledgment (required):</span>{" "}
            I acknowledge I have read and agree to the{" "}
            <Link href="/privacy-policy" className="text-brand-red hover:underline" target="_blank">
              Privacy Policy
            </Link>
            . I understand this is a pre-qualification request, not an
            application for credit, and no credit report will be pulled. A full
            credit application with written authorization comes later if I
            decide to proceed.
          </span>
        </label>
      </fieldset>

      <button type="submit" disabled={disabled}
        className="w-full bg-brand-red hover:bg-brand-red-dark disabled:bg-brand-gray-400 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold transition-colors">
        {disabled ? "Submitting…" : "Get Pre-Qualified"}
      </button>
    </form>
  );
}
