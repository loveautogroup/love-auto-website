"use client";

/**
 * Financing pre-qualification form.
 *
 * POSTs to /api/finance-application (Cloudflare Pages Function). Lead is
 * stored in KV and Jeremiah gets a notification email (when RESEND_API_KEY
 * is configured).
 *
 * IMPORTANT LEGAL NOTES (Diane):
 *   - This is a SOFT pre-qualification form. It does NOT collect SSN.
 *     SSN is collected at the dealership during final approval, on a
 *     separately-signed credit authorization.
 *   - TCPA consent for SMS is REQUIRED (explicit opt-in checkbox).
 *   - Privacy notice acknowledgment REQUIRED (ECOA / GLBA).
 *   - Form submits to /api/finance-application; that endpoint logs
 *     IP + user-agent for audit trail.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

interface FormValues {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  dateOfBirth: string;
  housingStatus: "own" | "rent" | "other" | "";
  monthlyHousingPayment: string;
  employmentStatus:
    | "employed"
    | "self-employed"
    | "retired"
    | "student"
    | "unemployed"
    | "other"
    | "";
  employer: string;
  jobTitle: string;
  monthlyIncome: string;
  timeAtJobMonths: string;
  vehicleInterest: string;
  desiredMonthlyPayment: string;
  desiredDownPayment: string;
  hasTradeIn: boolean;
  tradeInDetails: string;
  tcpaConsent: boolean;
  privacyConsent: boolean;
  honeypot: string;
}

const INITIAL: FormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  addressStreet: "",
  addressCity: "",
  addressState: "IL",
  addressZip: "",
  dateOfBirth: "",
  housingStatus: "",
  monthlyHousingPayment: "",
  employmentStatus: "",
  employer: "",
  jobTitle: "",
  monthlyIncome: "",
  timeAtJobMonths: "",
  vehicleInterest: "",
  desiredMonthlyPayment: "",
  desiredDownPayment: "",
  hasTradeIn: false,
  tradeInDetails: "",
  tcpaConsent: false,
  privacyConsent: false,
  honeypot: "",
};

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; id: string }
  | { kind: "error"; messages: string[] };

export default function FinancingForm() {
  const [values, setValues] = useState<FormValues>(INITIAL);
  const [state, setState] = useState<SubmitState>({ kind: "idle" });
  const renderTimestamp = useRef<number>(0);

  useEffect(() => {
    // Capture timestamp on mount for the min-elapsed anti-spam check.
    renderTimestamp.current = Date.now();
  }, []);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.kind === "submitting") return;
    setState({ kind: "submitting" });

    // Coerce numbers before send.
    const payload = {
      ...values,
      monthlyHousingPayment:
        values.monthlyHousingPayment === ""
          ? undefined
          : Number(values.monthlyHousingPayment),
      monthlyIncome: Number(values.monthlyIncome || 0),
      timeAtJobMonths:
        values.timeAtJobMonths === "" ? undefined : Number(values.timeAtJobMonths),
      desiredMonthlyPayment:
        values.desiredMonthlyPayment === ""
          ? undefined
          : Number(values.desiredMonthlyPayment),
      desiredDownPayment:
        values.desiredDownPayment === ""
          ? undefined
          : Number(values.desiredDownPayment),
      renderTimestamp: renderTimestamp.current,
    };

    try {
      const res = await fetch("/api/finance-application", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
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
      setState({ kind: "success", id: data.id ?? "" });
    } catch (err) {
      console.error("Financing submit failed:", err);
      setState({
        kind: "error",
        messages: [
          "Network error. Please try again or call us at (630) 359-3643.",
        ],
      });
    }
  }

  if (state.kind === "success") {
    return (
      <div className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-8 text-center">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-12 h-12 text-brand-green mx-auto mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        <h3 className="text-xl font-bold text-brand-gray-900 mb-2">
          Application Received!
        </h3>
        <p className="text-brand-gray-600 max-w-md mx-auto">
          Jordan will review your info and reach out within 1 business day with
          financing options. If you&apos;d rather talk now, call{" "}
          <a
            href="tel:6303593643"
            className="text-brand-red font-semibold hover:underline"
          >
            (630) 359-3643
          </a>
          . Meanwhile, browse{" "}
          <Link href="/inventory" className="text-brand-red hover:underline">
            our inventory
          </Link>
          .
        </p>
      </div>
    );
  }

  const disabled = state.kind === "submitting";
  const fieldClass =
    "w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red disabled:bg-brand-gray-50";

  return (
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-xl border border-brand-gray-200 p-6 space-y-6"
      noValidate
    >
      <div>
        <h2 className="text-xl font-bold text-brand-gray-900">
          Financing Pre-Qualification
        </h2>
        <p className="text-sm text-brand-gray-500 mt-1">
          Quick form, no commitment. This is a soft pre-qualification — we
          collect no Social Security numbers on this form. Fields marked with{" "}
          <span className="text-brand-red">*</span> are required.
        </p>
      </div>

      {state.kind === "error" && (
        <div className="bg-brand-red/10 border border-brand-red/20 rounded-lg p-4 text-sm text-brand-red">
          <p className="font-semibold mb-1">Please fix the following:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {state.messages.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── Contact ─── */}
      <fieldset className="space-y-4" disabled={disabled}>
        <legend className="text-sm font-bold text-brand-gray-900 mb-2 uppercase tracking-wide">
          Contact
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              First name <span className="text-brand-red">*</span>
            </span>
            <input
              type="text"
              required
              autoComplete="given-name"
              className={fieldClass}
              value={values.firstName}
              onChange={(e) => update("firstName", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              Last name <span className="text-brand-red">*</span>
            </span>
            <input
              type="text"
              required
              autoComplete="family-name"
              className={fieldClass}
              value={values.lastName}
              onChange={(e) => update("lastName", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              Email <span className="text-brand-red">*</span>
            </span>
            <input
              type="email"
              required
              autoComplete="email"
              className={fieldClass}
              value={values.email}
              onChange={(e) => update("email", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              Phone <span className="text-brand-red">*</span>
            </span>
            <input
              type="tel"
              required
              autoComplete="tel"
              placeholder="(630) 555-1234"
              className={fieldClass}
              value={values.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </label>
        </div>
      </fieldset>

      {/* ─── Address ─── */}
      <fieldset className="space-y-4" disabled={disabled}>
        <legend className="text-sm font-bold text-brand-gray-900 mb-2 uppercase tracking-wide">
          Home Address
        </legend>
        <label className="block">
          <span className="block text-sm font-medium text-brand-gray-900 mb-1">
            Street <span className="text-brand-red">*</span>
          </span>
          <input
            type="text"
            required
            autoComplete="street-address"
            className={fieldClass}
            value={values.addressStreet}
            onChange={(e) => update("addressStreet", e.target.value)}
          />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_120px_140px] gap-4">
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              City <span className="text-brand-red">*</span>
            </span>
            <input
              type="text"
              required
              autoComplete="address-level2"
              className={fieldClass}
              value={values.addressCity}
              onChange={(e) => update("addressCity", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              State <span className="text-brand-red">*</span>
            </span>
            <select
              required
              autoComplete="address-level1"
              className={fieldClass}
              value={values.addressState}
              onChange={(e) => update("addressState", e.target.value)}
            >
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              ZIP <span className="text-brand-red">*</span>
            </span>
            <input
              type="text"
              required
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="60181"
              className={fieldClass}
              value={values.addressZip}
              onChange={(e) => update("addressZip", e.target.value)}
            />
          </label>
        </div>
      </fieldset>

      {/* ─── Personal ─── */}
      <fieldset className="space-y-4" disabled={disabled}>
        <legend className="text-sm font-bold text-brand-gray-900 mb-2 uppercase tracking-wide">
          Personal
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              Date of birth <span className="text-brand-red">*</span>
            </span>
            <input
              type="date"
              required
              autoComplete="bday"
              className={fieldClass}
              value={values.dateOfBirth}
              onChange={(e) => update("dateOfBirth", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              Housing status <span className="text-brand-red">*</span>
            </span>
            <select
              required
              className={fieldClass}
              value={values.housingStatus}
              onChange={(e) =>
                update("housingStatus", e.target.value as FormValues["housingStatus"])
              }
            >
              <option value="">Select…</option>
              <option value="own">Own</option>
              <option value="rent">Rent</option>
              <option value="other">Other</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="block text-sm font-medium text-brand-gray-900 mb-1">
            Monthly housing payment (rent or mortgage)
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder="$"
            className={fieldClass}
            value={values.monthlyHousingPayment}
            onChange={(e) => update("monthlyHousingPayment", e.target.value)}
          />
        </label>
      </fieldset>

      {/* ─── Employment ─── */}
      <fieldset className="space-y-4" disabled={disabled}>
        <legend className="text-sm font-bold text-brand-gray-900 mb-2 uppercase tracking-wide">
          Employment & Income
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              Employment status <span className="text-brand-red">*</span>
            </span>
            <select
              required
              className={fieldClass}
              value={values.employmentStatus}
              onChange={(e) =>
                update(
                  "employmentStatus",
                  e.target.value as FormValues["employmentStatus"]
                )
              }
            >
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
              Monthly gross income <span className="text-brand-red">*</span>
            </span>
            <input
              type="number"
              required
              inputMode="numeric"
              min={0}
              placeholder="$"
              className={fieldClass}
              value={values.monthlyIncome}
              onChange={(e) => update("monthlyIncome", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              Employer
            </span>
            <input
              type="text"
              autoComplete="organization"
              className={fieldClass}
              value={values.employer}
              onChange={(e) => update("employer", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              Job title
            </span>
            <input
              type="text"
              autoComplete="organization-title"
              className={fieldClass}
              value={values.jobTitle}
              onChange={(e) => update("jobTitle", e.target.value)}
            />
          </label>
        </div>
        <label className="block">
          <span className="block text-sm font-medium text-brand-gray-900 mb-1">
            Time at current job (months)
          </span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={720}
            className={fieldClass}
            value={values.timeAtJobMonths}
            onChange={(e) => update("timeAtJobMonths", e.target.value)}
          />
        </label>
      </fieldset>

      {/* ─── Vehicle interest ─── */}
      <fieldset className="space-y-4" disabled={disabled}>
        <legend className="text-sm font-bold text-brand-gray-900 mb-2 uppercase tracking-wide">
          Vehicle Interest
        </legend>
        <label className="block">
          <span className="block text-sm font-medium text-brand-gray-900 mb-1">
            Vehicle you&apos;re interested in (optional)
          </span>
          <input
            type="text"
            placeholder="e.g. 2016 Honda Pilot, or 'SUV under $12,000'"
            className={fieldClass}
            value={values.vehicleInterest}
            onChange={(e) => update("vehicleInterest", e.target.value)}
          />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              Desired monthly payment
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="$"
              className={fieldClass}
              value={values.desiredMonthlyPayment}
              onChange={(e) => update("desiredMonthlyPayment", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              Down payment
            </span>
            <input
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="$"
              className={fieldClass}
              value={values.desiredDownPayment}
              onChange={(e) => update("desiredDownPayment", e.target.value)}
            />
          </label>
        </div>
      </fieldset>

      {/* ─── Trade-in ─── */}
      <fieldset className="space-y-3" disabled={disabled}>
        <legend className="text-sm font-bold text-brand-gray-900 mb-2 uppercase tracking-wide">
          Trade-In
        </legend>
        <label className="flex items-center gap-2 text-sm text-brand-gray-900">
          <input
            type="checkbox"
            checked={values.hasTradeIn}
            onChange={(e) => update("hasTradeIn", e.target.checked)}
            className="w-4 h-4"
          />
          I have a vehicle to trade in
        </label>
        {values.hasTradeIn && (
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              Trade-in details (year / make / model / mileage / condition)
            </span>
            <textarea
              rows={3}
              className={fieldClass}
              value={values.tradeInDetails}
              onChange={(e) => update("tradeInDetails", e.target.value)}
              placeholder="e.g. 2012 Honda Civic LX, 140k miles, runs great, one owner"
            />
          </label>
        )}
      </fieldset>

      {/* Honeypot — hidden from users, bots fill it */}
      <label
        aria-hidden="true"
        className="absolute left-[-9999px] w-px h-px overflow-hidden"
      >
        Website
        <input
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={values.honeypot}
          onChange={(e) => update("honeypot", e.target.value)}
        />
      </label>

      {/* ─── Consents ─── */}
      <fieldset
        className="space-y-3 border-t border-brand-gray-200 pt-5"
        disabled={disabled}
      >
        <legend className="text-sm font-bold text-brand-gray-900 mb-2 uppercase tracking-wide">
          Consent
        </legend>
        <label className="flex items-start gap-2 text-xs text-brand-gray-700 leading-relaxed">
          <input
            type="checkbox"
            required
            checked={values.tcpaConsent}
            onChange={(e) => update("tcpaConsent", e.target.checked)}
            className="w-4 h-4 mt-0.5 shrink-0"
          />
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
          <input
            type="checkbox"
            required
            checked={values.privacyConsent}
            onChange={(e) => update("privacyConsent", e.target.checked)}
            className="w-4 h-4 mt-0.5 shrink-0"
          />
          <span>
            <span className="font-semibold">
              Privacy acknowledgment (required):
            </span>{" "}
            I acknowledge I have read and agree to the{" "}
            <Link
              href="/privacy-policy"
              className="text-brand-red hover:underline"
              target="_blank"
            >
              Privacy Policy
            </Link>
            . I understand this is a pre-qualification and is not an
            application for credit. A full credit application and written
            authorization for a credit report will be collected at the
            dealership if I decide to proceed.
          </span>
        </label>
        <p className="text-xs text-brand-gray-500 leading-relaxed pt-2 border-t border-brand-gray-100">
          <span className="font-semibold">Equal Credit Opportunity Act:</span>{" "}
          The Federal Equal Credit Opportunity Act prohibits creditors from
          discriminating against credit applicants on the basis of race, color,
          religion, national origin, sex, marital status, age (provided the
          applicant has the capacity to enter into a binding contract); because
          all or part of the applicant&apos;s income derives from any public
          assistance program; or because the applicant has in good faith
          exercised any right under the Consumer Credit Protection Act.
        </p>
      </fieldset>

      <button
        type="submit"
        disabled={disabled}
        className="w-full bg-brand-red hover:bg-brand-red-dark disabled:bg-brand-gray-400 disabled:cursor-not-allowed text-white py-3.5 rounded-xl font-semibold transition-colors"
      >
        {disabled ? "Submitting…" : "Submit Application"}
      </button>
    </form>
  );
}
