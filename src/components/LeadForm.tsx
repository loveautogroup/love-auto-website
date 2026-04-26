"use client";

/**
 * LeadForm — the single inquiry form used across the site.
 *
 * Mounted on:
 *   - /contact page (full layout)
 *   - VDP "Ask about this" modal (pre-fills vehicleInterest)
 *   - Sticky site-wide "Get a quote" modal
 *
 * Posts to https://dms.loveautogroup.net/api/v1/public/leads which writes
 * to Prisma's customer table with leadStatus='NEW' so leads appear in
 * /dashboard/leads on the DMS side. The endpoint also fires SMS + email
 * notifications via a Railway webhook (Commit 3).
 *
 * Honeypot: hidden 'website' field for bot traps.
 * TCPA: consent checkbox required for SMS follow-up.
 */

import { useState } from "react";

const DMS_API_BASE =
  process.env.NEXT_PUBLIC_DMS_API_BASE ?? "https://dms.loveautogroup.net";

export interface LeadFormProps {
  /** Where this form lives — used as the leadSource tag. */
  source?: string;
  /** Pre-filled vehicle interest (e.g. "2017 Subaru Forester"). */
  initialVehicleInterest?: string;
  /** VIN context for VDP form. Sent to backend, included in lead notes. */
  vehicleVin?: string;
  /** Submit-button label override. */
  submitLabel?: string;
  /** Callback fired on successful submission with the new lead id. */
  onSuccess?: (leadId: string) => void;
  /** Compact mode — denser layout for modal use. */
  compact?: boolean;
}

interface FormValues {
  name: string;
  phone: string;
  email: string;
  vehicleInterest: string;
  message: string;
  tcpaConsent: boolean;
  // Honeypot — bots fill, humans don't see
  website: string;
}

const INITIAL: FormValues = {
  name: "",
  phone: "",
  email: "",
  vehicleInterest: "",
  message: "",
  tcpaConsent: false,
  website: "",
};

export default function LeadForm({
  source = "website",
  initialVehicleInterest = "",
  vehicleVin,
  submitLabel = "Send message",
  onSuccess,
  compact = false,
}: LeadFormProps) {
  const [values, setValues] = useState<FormValues>({
    ...INITIAL,
    vehicleInterest: initialVehicleInterest,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
    if (error) setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!values.name.trim()) {
      setError("Please enter your name.");
      return;
    }
    if (!values.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }
    if (!values.tcpaConsent) {
      setError("Please agree to be contacted before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`${DMS_API_BASE}/api/v1/public/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name,
          phone: values.phone,
          email: values.email || undefined,
          vehicleInterest: values.vehicleInterest || undefined,
          vehicleVin,
          message: values.message || undefined,
          source,
          tcpaConsent: values.tcpaConsent,
          // honeypot — leave empty for humans; bots will fill it and trip
          // the schema's max-length check
          ...(values.website ? { website: values.website } : {}),
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error ||
            "We couldn't send your message. Please call (630) 359-3643."
        );
      }

      const body = await res.json();
      setSuccess(
        `Thanks ${values.name.split(" ")[0]}! We'll reach out shortly. ` +
          "If you don't hear back within an hour during business hours, " +
          "call or text (630) 359-3643."
      );
      setValues({ ...INITIAL });
      if (onSuccess) onSuccess(body.leadId);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong. Please call (630) 359-3643."
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-xl border border-brand-green/30 bg-brand-green/10 p-6">
        <div className="flex items-start gap-3">
          <svg
            className="w-6 h-6 text-brand-green flex-shrink-0 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <div>
            <h3 className="font-bold text-brand-gray-900">Message received</h3>
            <p className="mt-1 text-sm text-brand-gray-700">{success}</p>
          </div>
        </div>
      </div>
    );
  }

  const inputCss =
    "w-full rounded-lg border border-brand-gray-200 bg-white px-3 py-2.5 text-sm text-brand-gray-900 placeholder:text-brand-gray-400 focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red";

  return (
    <form onSubmit={handleSubmit} className={compact ? "space-y-3" : "space-y-4"}>
      {/* Honeypot — hidden via CSS, bots fill it */}
      <div aria-hidden="true" className="absolute -left-[9999px] -top-[9999px]">
        <label>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={(e) => update("website", e.target.value)}
          />
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-gray-700 mb-1">
          Name <span className="text-brand-red">*</span>
        </label>
        <input
          type="text"
          required
          className={inputCss}
          placeholder="First and last name"
          value={values.name}
          onChange={(e) => update("name", e.target.value)}
          autoComplete="name"
        />
      </div>

      <div className={compact ? "" : "grid grid-cols-1 sm:grid-cols-2 gap-4"}>
        <div>
          <label className="block text-sm font-medium text-brand-gray-700 mb-1">
            Phone <span className="text-brand-red">*</span>
          </label>
          <input
            type="tel"
            required
            className={inputCss}
            placeholder="(630) 555-1234"
            value={values.phone}
            onChange={(e) => update("phone", e.target.value)}
            autoComplete="tel"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-brand-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            className={inputCss}
            placeholder="you@example.com"
            value={values.email}
            onChange={(e) => update("email", e.target.value)}
            autoComplete="email"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-gray-700 mb-1">
          Vehicle of interest
        </label>
        <input
          type="text"
          className={inputCss}
          placeholder={
            initialVehicleInterest
              ? initialVehicleInterest
              : "e.g. 2017 Subaru Forester or just 'AWD SUV under 15k'"
          }
          value={values.vehicleInterest}
          onChange={(e) => update("vehicleInterest", e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-brand-gray-700 mb-1">
          Message
        </label>
        <textarea
          rows={compact ? 3 : 4}
          className={inputCss + " resize-none"}
          placeholder="Tell us a little about what you're looking for..."
          value={values.message}
          onChange={(e) => update("message", e.target.value)}
        />
      </div>

      <label className="flex items-start gap-2 text-xs text-brand-gray-700 cursor-pointer select-none">
        <input
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 rounded border-brand-gray-300 text-brand-red focus:ring-brand-red"
          checked={values.tcpaConsent}
          onChange={(e) => update("tcpaConsent", e.target.checked)}
        />
        <span>
          I agree that Love Auto Group may contact me by phone, text, or email
          about my inquiry. I understand that consent is not required to make
          a purchase. Standard rates may apply.
        </span>
      </label>

      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-lg bg-brand-red text-white font-semibold px-4 py-3 hover:bg-brand-red-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {submitting ? "Sending..." : submitLabel}
      </button>
    </form>
  );
}
