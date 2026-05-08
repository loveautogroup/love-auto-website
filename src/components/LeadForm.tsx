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
 * /dashboard/leads on the DMS side.
 *
 * Auth: x-intake-key header (ENG-107). Key is baked in at build time via
 *   NEXT_PUBLIC_DMS_INTAKE_KEY env var on Cloudflare Pages. Bridge mode on
 *   the DMS accepts missing keys until the env var is wired.
 *
 * Honeypot: hidden 'honeypot' field. Bots fill it; humans don't see it.
 *   The DMS silently accepts and drops honeypot-flagged submissions (200, no row).
 * TCPA: marketingOptIn checkbox required by schema.
 *
 * Phone normalization: user may type any US format; we normalize to E.164
 *   (+1XXXXXXXXXX) before sending so the DMS regex validates cleanly.
 */

import { useState } from "react";

const DMS_API_BASE =
  process.env.NEXT_PUBLIC_DMS_API_BASE ?? "https://dms.loveautogroup.net";

/** Intake key baked in at Cloudflare Pages build time. Empty = bridge mode. */
// EMERGENCY FALLBACK (Bill, 2026-05-08 ~03:00 UTC):
// Cloudflare Pages was NOT passing NEXT_PUBLIC_DMS_INTAKE_KEY to the build
// runner — every form submission since 2026-05-01 (when REQUIRE_INTAKE_KEY
// went live on Vercel) returned 401, silently swallowing 7+ days of leads.
// Customer Dawn Schlienz reported the bug May 7 7:13 AM. CF Pages dashboard
// was unresponsive (maintenance window) and the API didn't surface the env
// var in the build log no matter how I PATCH'd it.
//
// The intake key is a *public-bundled fingerprint*, not a secret — Next.js
// inlines it into client JS that ships to every browser. The actual security
// gate is the bcrypt-validated WebsiteLeadIntakeKey row on Vercel and the
// per-key Origin allowlist. Hardcoding this fallback restores lead capture
// immediately. Rotating the key is still possible (revoke the row in
// WebsiteLeadIntakeKey via DMS dashboard, push a new fallback here).
//
// TODO (Charlotte/Bill): figure out why Cloudflare Pages stopped exposing
// NEXT_PUBLIC_* env vars to `next build`. Until that's fixed, every rotation
// requires a code push. Investigate via CF dashboard once it's responsive.
const INTAKE_KEY =
  process.env.NEXT_PUBLIC_DMS_INTAKE_KEY ??
  "k_prod_dd45d4138e03e1bad8a416ef298ef1d1c3f22716f4928805";

/** Version tag for the TCPA consent language shown in this form. */
const OPT_IN_LANGUAGE_VERSION = "v1-2026-04";

/**
 * Normalize any US phone string to E.164 (+1XXXXXXXXXX).
 * Strips all non-digits; prepends +1 if 10 digits remain.
 * Returns the cleaned string unchanged if it can't be normalized
 * (DMS schema will reject it and surface a validation error).
 */
function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  // Already E.164-ish or non-US — return as-is, DMS validates
  return raw.trim();
}

export interface LeadFormProps {
  /** Where this form lives — used as the leadSource tag. */
  source?: string;
  /** Pre-filled vehicle interest (e.g. "2017 Subaru Forester"). */
  initialVehicleInterest?: string;
  /**
   * VIN context for VDP form. Reserved for a future vehicle-id lookup
   * (when the site can resolve a VIN to a DMS vehicleId). Currently unused
   * in the payload — vehicleInterestText carries the human-readable label.
   */
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
  marketingOptIn: boolean;
  // Honeypot — hidden via CSS; bots fill it, humans leave it blank
  honeypot: string;
}

const INITIAL: FormValues = {
  name: "",
  phone: "",
  email: "",
  vehicleInterest: "",
  message: "",
  marketingOptIn: false,
  honeypot: "",
};

export default function LeadForm({
  source = "website",
  initialVehicleInterest = "",
  vehicleVin: _vehicleVin,  // reserved — see prop comment
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

  // Derive firstName / lastName from a single name field at submission time.
  function splitName(full: string): { firstName: string; lastName: string } {
    const parts = full.trim().split(/\s+/);
    const firstName = parts[0] ?? "";
    const lastName = parts.slice(1).join(" ");
    return { firstName, lastName };
  }

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
    if (!values.marketingOptIn) {
      setError("Please agree to be contacted before submitting.");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const { firstName, lastName } = splitName(values.name);
      const phone = normalizePhone(values.phone);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      // Send intake key when present (bridge mode: key optional on DMS side
      // until REQUIRE_INTAKE_KEY=true is set in Vercel env).
      if (INTAKE_KEY) {
        headers["x-intake-key"] = INTAKE_KEY;
      }

      const res = await fetch(`${DMS_API_BASE}/api/v1/public/leads`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          firstName,
          lastName,
          phone,
          email: values.email || undefined,
          vehicleInterestText: values.vehicleInterest || undefined,
          message: values.message || undefined,
          source,
          marketingOptIn: values.marketingOptIn,
          optInLanguageVersion: OPT_IN_LANGUAGE_VERSION,
          // Honeypot — always sent; real users leave it blank.
          // DMS silently drops submissions where it's non-empty.
          honeypot: values.honeypot,
          // UTM / referrer attribution
          referrer:
            typeof window !== "undefined" ? document.referrer || undefined : undefined,
          sourceMetadata:
            typeof window !== "undefined"
              ? (() => {
                  const p = new URLSearchParams(window.location.search);
                  const meta: Record<string, string> = {};
                  for (const key of [
                    "utm_source",
                    "utm_medium",
                    "utm_campaign",
                    "utm_term",
                    "utm_content",
                    "gclid",
                    "fbclid",
                  ] as const) {
                    const v = p.get(key);
                    if (v) meta[key] = v;
                  }
                  if (typeof window !== "undefined") {
                    meta.landingPage = window.location.href;
                  }
                  return Object.keys(meta).length ? meta : undefined;
                })()
              : undefined,
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
      const leadId: string | null = body?.data?.leadId ?? null;
      setSuccess(
        `Thanks ${firstName}! We'll reach out shortly. ` +
          "If you don't hear back within an hour during business hours, " +
          "call or text (630) 359-3643."
      );
      setValues({ ...INITIAL, vehicleInterest: "" });
      if (onSuccess && leadId) onSuccess(leadId);
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
      {/* Honeypot — hidden via CSS; bots fill it, real users never see it */}
      <div aria-hidden="true" className="absolute -left-[9999px] -top-[9999px]">
        <label>
          Leave blank
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={values.honeypot}
            onChange={(e) => update("honeypot", e.target.value)}
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
          checked={values.marketingOptIn}
          onChange={(e) => update("marketingOptIn", e.target.checked)}
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
