"use client";

/**
 * In-house FULL credit application (S27, Jun 7 2026) — replaces the
 * DealerCenter hosted iframe. Modeled on DC's SecuredForms coverage.
 *
 * POSTs to the DMS public endpoint
 * https://dms.loveautogroup.net/api/v1/public/credit-applications
 * (x-intake-key gated, rate-limited). SSN + driver's license number are
 * encrypted AT REST in the DMS (AES-256-GCM); this form sends them over
 * TLS only, never stores them client-side, and never echoes them back.
 *
 * IMPORTANT LEGAL NOTES (Diane):
 *   - FCRA credit authorization checkbox is REQUIRED (mirrors the
 *     DealerCenter (a)/(b)/(c) authorization language).
 *   - TCPA consent for SMS is REQUIRED (explicit opt-in checkbox).
 *   - Privacy notice acknowledgment REQUIRED (ECOA / GLBA).
 *   - The DMS endpoint logs IP + user-agent as the consent audit trail.
 */

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { trackFormSubmit, trackLeadFinancing } from "@/lib/analytics";
import { consentHashesFor, CONSENT_LANGUAGE, splitAroundPhrase } from "@/lib/consent-language";
import { useLanguage } from "@/context/LanguageContext";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

/** Everything a single applicant (buyer or co-buyer) captures. */
interface ApplicantFields {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  /** Collected for the lender credit pull; encrypted at rest in the DMS. */
  ssn: string;
  dlNumber: string;
  dlState: string;
  dlIssueDate: string;
  dlExpiryDate: string;
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
  employerPhone: string;
  monthlyIncome: string;
  timeAtJobMonths: string;
}

interface FormValues extends ApplicantFields {
  // Contact (buyer only)
  email: string;
  phone: string;
  // Shared address
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  // Housing (buyer only — co-buyer sharing address)
  housingStatus: "own" | "rent" | "other" | "";
  monthlyHousingPayment: string;
  // Vehicle / deal
  vehicleInterest: string;
  desiredMonthlyPayment: string;
  desiredDownPayment: string;
  hasTradeIn: boolean;
  tradeInDetails: string;
  // Co-buyer
  hasCoBuyer: boolean;
  coBuyer: ApplicantFields;
  // Consents + anti-spam
  tcpaConsent: boolean;
  privacyConsent: boolean;
  /** FCRA credit-report authorization — mandatory for a full application. */
  fcraConsent: boolean;
  honeypot: string;
}

const CONSENT_VERSION = "creditapp-2026-07" as const;

const EMPTY_APPLICANT: ApplicantFields = {
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  ssn: "",
  dlNumber: "",
  dlState: "IL",
  dlIssueDate: "",
  dlExpiryDate: "",
  employmentStatus: "",
  employer: "",
  jobTitle: "",
  employerPhone: "",
  monthlyIncome: "",
  timeAtJobMonths: "",
};

const INITIAL: FormValues = {
  // Buyer fields
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  ssn: "",
  addressStreet: "",
  addressCity: "",
  addressState: "IL",
  addressZip: "",
  dateOfBirth: "",
  dlNumber: "",
  dlState: "IL",
  dlIssueDate: "",
  dlExpiryDate: "",
  housingStatus: "",
  monthlyHousingPayment: "",
  employmentStatus: "",
  employer: "",
  jobTitle: "",
  employerPhone: "",
  monthlyIncome: "",
  timeAtJobMonths: "",
  vehicleInterest: "",
  desiredMonthlyPayment: "",
  desiredDownPayment: "",
  hasTradeIn: false,
  tradeInDetails: "",
  hasCoBuyer: false,
  coBuyer: { ...EMPTY_APPLICANT },
  tcpaConsent: false,
  privacyConsent: false,
  fcraConsent: false,
  honeypot: "",
};

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "success"; id: string }
  | { kind: "error"; messages: string[] };

export default function FinancingForm() {
  const { t } = useLanguage();
  const [values, setValues] = useState<FormValues>(INITIAL);
  const [state, setState] = useState<SubmitState>({ kind: "idle" });
  const renderTimestamp = useRef<number>(0);
  // Identity of the car the applicant clicked "apply" from. Held in a ref, not
  // in FormValues, because it is machine-supplied and must not be editable --
  // the free-text "vehicle of interest" box remains the customer's own words.
  const vehicleIdent = useRef<{ vin?: string; stock?: string }>({});

  useEffect(() => {
    // Capture timestamp on mount for the min-elapsed anti-spam check.
    renderTimestamp.current = Date.now();
    // Prefill from VDP apply links: /financing/?vehicle=2018 Porsche 718&down=1000
    try {
      const q = new URLSearchParams(window.location.search);
      const v = q.get("vehicle");
      const down = q.get("down");
      // The VDP now carries the VIN and stock number through the apply link.
      // Before this, the application reached the DMS with only the display
      // label, so the lender document had no VIN to print -- zero of the 8
      // applications on file had one, though every applicant had come from a
      // specific car's page.
      vehicleIdent.current = {
        vin: q.get("vin") || undefined,
        stock: q.get("stock") || undefined,
      };
      setValues((prev) => ({
        ...prev,
        vehicleInterest: prev.vehicleInterest || (v ?? ""),
        desiredDownPayment: prev.desiredDownPayment || (down ?? ""),
      }));
    } catch {
      /* prefill is best-effort */
    }
  }, []);

  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function updateCoBuyer<K extends keyof ApplicantFields>(
    key: K,
    value: ApplicantFields[K]
  ) {
    setValues((prev) => ({ ...prev, coBuyer: { ...prev.coBuyer, [key]: value } }));
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (state.kind === "submitting") return;
    setState({ kind: "submitting" });

    // Shape an applicant into the DMS endpoint's PersonSchema.
    const person = (a: ApplicantFields) => ({
      firstName: a.firstName,
      lastName: a.lastName,
      dateOfBirth: a.dateOfBirth, // YYYY-MM-DD from <input type="date">
      ssn: a.ssn,
      dlNumber: a.dlNumber || undefined,
      dlState: a.dlState || undefined,
      dlIssueDate: a.dlIssueDate || undefined,
      dlExpiryDate: a.dlExpiryDate || undefined,
    });
    const employment = (a: ApplicantFields) => ({
      employerName: a.employer || a.employmentStatus || "Not provided",
      jobTitle: a.jobTitle || undefined,
      employerPhone: a.employerPhone || undefined,
      monthlyIncome: a.monthlyIncome === "" ? undefined : Number(a.monthlyIncome),
      yearsAtJob:
        a.timeAtJobMonths === "" ? undefined : Math.floor(Number(a.timeAtJobMonths) / 12),
      monthsAtJob:
        a.timeAtJobMonths === "" ? undefined : Number(a.timeAtJobMonths) % 12,
      incomeType: a.employmentStatus || undefined,
    });

    const payload = {
      honeypot: values.honeypot,
      startedAt: renderTimestamp.current,
      buyer: {
        ...person(values),
        email: values.email || "",
        phoneCell: values.phone || undefined,
      },
      residence: {
        street: values.addressStreet,
        city: values.addressCity,
        state: values.addressState,
        zip: values.addressZip,
        housingType: values.housingStatus || undefined,
        monthlyHousing:
          values.monthlyHousingPayment === ""
            ? undefined
            : Number(values.monthlyHousingPayment),
      },
      employment: employment(values),
      vehicle: {
        vin: vehicleIdent.current.vin,
        stock: vehicleIdent.current.stock,
        model: values.vehicleInterest || undefined,
        price:
          values.desiredMonthlyPayment === ""
            ? undefined
            : `~${values.desiredMonthlyPayment}/mo desired`,
        downPayment: values.desiredDownPayment || undefined,
      },
      tradeIn: values.hasTradeIn
        ? { model: values.tradeInDetails || "yes" }
        : undefined,
      coBuyer: values.hasCoBuyer
        ? { ...person(values.coBuyer), employment: employment(values.coBuyer) }
        : undefined,
      consents: {
        creditAuth: values.fcraConsent,
        privacy: values.privacyConsent,
        textMarketing: false,
        textUpdates: values.tcpaConsent,
      },
      consentLanguageVersion: CONSENT_VERSION,
      consentHashes: await consentHashesFor(CONSENT_VERSION),
    };

    try {
      // Same-origin Pages Function proxy — it attaches the intake key
      // server-side (NEXT_PUBLIC_* never inlines on this build pipeline;
      // see functions/api/credit-app.ts).
      const res = await fetch("/api/credit-app", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.data?.id) {
        setState({
          kind: "error",
          messages: [data.error ?? t.creditApp.errSubmit],
        });
        return;
      }
      trackFormSubmit("financing");
      trackLeadFinancing();
      setState({ kind: "success", id: data.data.id });
    } catch (err) {
      console.error("Financing submit failed:", err);
      setState({
        kind: "error",
        messages: [t.creditApp.errNetwork],
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
          {t.creditApp.successHeading}
        </h3>
        <p className="text-brand-gray-600 max-w-md mx-auto">
          {t.creditApp.successBodyPre}
          <a
            href="tel:6303593643"
            className="text-brand-red font-semibold hover:underline"
          >
            (630) 359-3643
          </a>
          {t.creditApp.successBodyMid}
          <Link href="/inventory" className="text-brand-red hover:underline">
            {t.creditApp.inventoryLinkText}
          </Link>
          {t.creditApp.successBodyPost}
        </p>
      </div>
    );
  }

  const disabled = state.kind === "submitting";
  const fieldClass =
    "w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red disabled:bg-brand-gray-50";

  return (
    // Found in the website audit: `noValidate` was set here with no
    // equivalent manual validation in onSubmit — every `required` field
    // below (including SSN and all three consent checkboxes, one of which
    // is the legally-required FCRA credit-pull authorization) could be
    // submitted blank. Removed rather than reimplement validation onSubmit:
    // every field already carries the right required/pattern/type attrs,
    // the co-buyer section's required fields are conditionally MOUNTED (not
    // just hidden) so they never trip "invalid unfocusable field", and the
    // sibling QuickPreQualifyForm already relies on native validation the
    // same way with no noValidate.
    <form
      onSubmit={onSubmit}
      className="bg-white rounded-xl border border-brand-gray-200 p-6 space-y-6"
    >
      <div>
        <h2 className="text-xl font-bold text-brand-gray-900">
          {t.creditApp.heading}
        </h2>
        <p className="text-sm text-brand-gray-500 mt-1">
          {t.creditApp.subtext.split("*")[0]}
          <span className="text-brand-red">*</span>
          {t.creditApp.subtext.split("*")[1]}
        </p>
      </div>

      {state.kind === "error" && (
        <div className="bg-brand-red/10 border border-brand-red/20 rounded-lg p-4 text-sm text-brand-red">
          <p className="font-semibold mb-1">{t.creditApp.fixFollowing}</p>
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
          {t.creditApp.sectionContact}
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              {t.creditApp.firstName} <span className="text-brand-red">*</span>
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
              {t.creditApp.lastName} <span className="text-brand-red">*</span>
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
              {t.creditApp.email} <span className="text-brand-red">*</span>
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
              {t.creditApp.phone} <span className="text-brand-red">*</span>
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
          {t.creditApp.sectionAddress}
        </legend>
        <label className="block">
          <span className="block text-sm font-medium text-brand-gray-900 mb-1">
            {t.creditApp.street} <span className="text-brand-red">*</span>
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
              {t.creditApp.city} <span className="text-brand-red">*</span>
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
              {t.creditApp.state} <span className="text-brand-red">*</span>
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
              {t.creditApp.zip} <span className="text-brand-red">*</span>
            </span>
            <input
              type="text"
              required
              inputMode="numeric"
              autoComplete="postal-code"
              placeholder="60181"
              pattern="\d{5}(-\d{4})?"
              title="5 digits, or 5+4 with a dash (60181 or 60181-1234)"
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
          {t.creditApp.sectionPersonal}
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              {t.creditApp.dob} <span className="text-brand-red">*</span>
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
              {t.creditApp.ssnLabel} <span className="text-brand-red">*</span>
            </span>
            <input
              type="text"
              required
              inputMode="numeric"
              autoComplete="off"
              placeholder="___-__-____"
              pattern="\d{3}-?\d{2}-?\d{4}"
              title="9 digits, with or without dashes"
              className={fieldClass}
              value={values.ssn}
              onChange={(e) => update("ssn", e.target.value)}
            />
            <span className="block text-[11px] text-brand-gray-500 mt-1">
              {t.creditApp.ssnHelper}
            </span>
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              {t.creditApp.housingStatus} <span className="text-brand-red">*</span>
            </span>
            <select
              required
              className={fieldClass}
              value={values.housingStatus}
              onChange={(e) =>
                update("housingStatus", e.target.value as FormValues["housingStatus"])
              }
            >
              <option value="">{t.creditApp.selectEllipsis}</option>
              <option value="own">{t.creditApp.own}</option>
              <option value="rent">{t.creditApp.rent}</option>
              <option value="other">{t.creditApp.other}</option>
            </select>
          </label>
        </div>
        <label className="block">
          <span className="block text-sm font-medium text-brand-gray-900 mb-1">
            {t.creditApp.monthlyHousing}
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

        {/* Driver's License (optional — saves a follow-up call when submitting to lender) */}
        <div className="pt-4 border-t border-brand-gray-100">
          <p className="text-xs uppercase tracking-wide text-brand-gray-500 font-semibold mb-3">
            {t.creditApp.dlSection}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-sm font-medium text-brand-gray-900 mb-1">
                {t.creditApp.dlNumber}
              </span>
              <input
                type="text"
                maxLength={30}
                className={fieldClass}
                value={values.dlNumber}
                onChange={(e) => update("dlNumber", e.target.value)}
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-brand-gray-900 mb-1">
                {t.creditApp.dlState}
              </span>
              <select
                className={fieldClass}
                value={values.dlState}
                onChange={(e) => update("dlState", e.target.value)}
              >
                {US_STATES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-brand-gray-900 mb-1">
                {t.creditApp.dlIssueDate}
              </span>
              <input
                type="date"
                className={fieldClass}
                value={values.dlIssueDate}
                onChange={(e) => update("dlIssueDate", e.target.value)}
              />
            </label>
            <label className="block">
              <span className="block text-sm font-medium text-brand-gray-900 mb-1">
                {t.creditApp.dlExpiryDate}
              </span>
              <input
                type="date"
                className={fieldClass}
                value={values.dlExpiryDate}
                onChange={(e) => update("dlExpiryDate", e.target.value)}
              />
            </label>
          </div>
        </div>
      </fieldset>

      {/* ─── Employment ─── */}
      <fieldset className="space-y-4" disabled={disabled}>
        <legend className="text-sm font-bold text-brand-gray-900 mb-2 uppercase tracking-wide">
          {t.creditApp.sectionEmployment}
        </legend>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              {t.creditApp.employmentStatus} <span className="text-brand-red">*</span>
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
              <option value="">{t.creditApp.selectEllipsis}</option>
              <option value="employed">{t.creditApp.employedW2}</option>
              <option value="self-employed">{t.creditApp.selfEmployed}</option>
              <option value="retired">{t.creditApp.retired}</option>
              <option value="student">{t.creditApp.student}</option>
              <option value="unemployed">{t.creditApp.unemployed}</option>
              <option value="other">{t.creditApp.other}</option>
            </select>
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              {t.creditApp.monthlyGrossIncome} <span className="text-brand-red">*</span>
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
              {t.creditApp.employer}
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
              {t.creditApp.jobTitle}
            </span>
            <input
              type="text"
              autoComplete="organization-title"
              className={fieldClass}
              value={values.jobTitle}
              onChange={(e) => update("jobTitle", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              {t.creditApp.employerPhone}
            </span>
            <input
              type="tel"
              inputMode="tel"
              autoComplete="work tel"
              placeholder="(555) 555-5555"
              className={fieldClass}
              value={values.employerPhone}
              onChange={(e) => update("employerPhone", e.target.value)}
            />
          </label>
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              {t.creditApp.timeAtJob}
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
        </div>
      </fieldset>

      {/* ─── Vehicle interest ─── */}
      <fieldset className="space-y-4" disabled={disabled}>
        <legend className="text-sm font-bold text-brand-gray-900 mb-2 uppercase tracking-wide">
          {t.creditApp.sectionVehicle}
        </legend>
        <label className="block">
          <span className="block text-sm font-medium text-brand-gray-900 mb-1">
            {t.creditApp.vehicleInterested}
          </span>
          <input
            type="text"
            placeholder={t.creditApp.vehicleInterestedPlaceholder}
            className={fieldClass}
            value={values.vehicleInterest}
            onChange={(e) => update("vehicleInterest", e.target.value)}
          />
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              {t.creditApp.desiredMonthly}
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
              {t.creditApp.downPayment}
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
          {t.creditApp.sectionTradeIn}
        </legend>
        <label className="flex items-center gap-2 text-sm text-brand-gray-900">
          <input
            type="checkbox"
            checked={values.hasTradeIn}
            onChange={(e) => update("hasTradeIn", e.target.checked)}
            className="w-4 h-4"
          />
          {t.creditApp.haveTradeIn}
        </label>
        {values.hasTradeIn && (
          <label className="block">
            <span className="block text-sm font-medium text-brand-gray-900 mb-1">
              {t.creditApp.tradeInDetails}
            </span>
            <textarea
              rows={3}
              className={fieldClass}
              value={values.tradeInDetails}
              onChange={(e) => update("tradeInDetails", e.target.value)}
              placeholder={t.creditApp.tradeInPlaceholder}
            />
          </label>
        )}
      </fieldset>

      {/* ─── Co-Buyer (optional) ─── */}
      <fieldset className="space-y-4" disabled={disabled}>
        <legend className="text-sm font-bold text-brand-gray-900 mb-2 uppercase tracking-wide">
          {t.creditApp.sectionCoBuyer}
        </legend>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="mt-1"
            checked={values.hasCoBuyer}
            onChange={(e) => update("hasCoBuyer", e.target.checked)}
          />
          <span className="text-sm text-brand-gray-700">
            {t.creditApp.addCoBuyer}{" "}
            <span className="text-brand-gray-500">
              {t.creditApp.coBuyerHelp}
            </span>
          </span>
        </label>

        {values.hasCoBuyer && (
          <div className="space-y-4 rounded-lg border border-brand-gray-200 bg-brand-gray-50 p-5">
            <p className="text-xs uppercase tracking-wide text-brand-gray-600 font-semibold">
              {t.creditApp.coBuyerInfo}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-sm font-medium text-brand-gray-900 mb-1">
                  {t.creditApp.firstName} <span className="text-brand-red">*</span>
                </span>
                <input
                  type="text"
                  required
                  className={fieldClass}
                  value={values.coBuyer.firstName}
                  onChange={(e) => updateCoBuyer("firstName", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-brand-gray-900 mb-1">
                  {t.creditApp.lastName} <span className="text-brand-red">*</span>
                </span>
                <input
                  type="text"
                  required
                  className={fieldClass}
                  value={values.coBuyer.lastName}
                  onChange={(e) => updateCoBuyer("lastName", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-brand-gray-900 mb-1">
                  {t.creditApp.dob} <span className="text-brand-red">*</span>
                </span>
                <input
                  type="date"
                  required
                  className={fieldClass}
                  value={values.coBuyer.dateOfBirth}
                  onChange={(e) => updateCoBuyer("dateOfBirth", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-brand-gray-900 mb-1">
                  {t.creditApp.ssnLabel} <span className="text-brand-red">*</span>
                </span>
                <input
                  type="text"
                  required
                  inputMode="numeric"
                  autoComplete="off"
                  placeholder="___-__-____"
                  pattern="\d{3}-?\d{2}-?\d{4}"
                  title="9 digits, with or without dashes"
                  className={fieldClass}
                  value={values.coBuyer.ssn}
                  onChange={(e) => updateCoBuyer("ssn", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-brand-gray-900 mb-1">
                  {t.creditApp.employmentStatus} <span className="text-brand-red">*</span>
                </span>
                <select
                  required
                  className={fieldClass}
                  value={values.coBuyer.employmentStatus}
                  onChange={(e) =>
                    updateCoBuyer(
                      "employmentStatus",
                      e.target.value as ApplicantFields["employmentStatus"]
                    )
                  }
                >
                  <option value="">{t.creditApp.selectEllipsis}</option>
                  <option value="employed">{t.creditApp.employedW2}</option>
                  <option value="self-employed">{t.creditApp.selfEmployed}</option>
                  <option value="retired">{t.creditApp.retired}</option>
                  <option value="student">{t.creditApp.student}</option>
                  <option value="unemployed">{t.creditApp.unemployed}</option>
                  <option value="other">{t.creditApp.other}</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-brand-gray-900 mb-1">
                  {t.creditApp.monthlyGrossIncome} <span className="text-brand-red">*</span>
                </span>
                <input
                  type="number"
                  required
                  inputMode="numeric"
                  min={0}
                  placeholder="$"
                  className={fieldClass}
                  value={values.coBuyer.monthlyIncome}
                  onChange={(e) => updateCoBuyer("monthlyIncome", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-brand-gray-900 mb-1">
                  {t.creditApp.employer}
                </span>
                <input
                  type="text"
                  className={fieldClass}
                  value={values.coBuyer.employer}
                  onChange={(e) => updateCoBuyer("employer", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-brand-gray-900 mb-1">
                  {t.creditApp.jobTitle}
                </span>
                <input
                  type="text"
                  className={fieldClass}
                  value={values.coBuyer.jobTitle}
                  onChange={(e) => updateCoBuyer("jobTitle", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-brand-gray-900 mb-1">
                  {t.creditApp.employerPhone}
                </span>
                <input
                  type="tel"
                  inputMode="tel"
                  placeholder="(555) 555-5555"
                  className={fieldClass}
                  value={values.coBuyer.employerPhone}
                  onChange={(e) => updateCoBuyer("employerPhone", e.target.value)}
                />
              </label>
              <label className="block">
                <span className="block text-sm font-medium text-brand-gray-900 mb-1">
                  {t.creditApp.timeAtJob}
                </span>
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={720}
                  className={fieldClass}
                  value={values.coBuyer.timeAtJobMonths}
                  onChange={(e) => updateCoBuyer("timeAtJobMonths", e.target.value)}
                />
              </label>
            </div>
            <p className="text-xs text-brand-gray-500 pt-2 border-t border-brand-gray-200">
              {t.creditApp.coBuyerDlNote}
            </p>
          </div>
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
          {t.creditApp.sectionConsent}
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
            {CONSENT_LANGUAGE[CONSENT_VERSION].tcpa_sms}
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
            {(() => {
              const text = CONSENT_LANGUAGE[CONSENT_VERSION].privacy;
              const parts = splitAroundPhrase(text, "Privacy Policy");
              if (!parts) return text;
              return (
                <>
                  {parts[0]}
                  <Link
                    href="/privacy-policy"
                    className="text-brand-red hover:underline"
                    target="_blank"
                  >
                    Privacy Policy
                  </Link>
                  {parts[1]}
                </>
              );
            })()}
          </span>
        </label>
        <label className="flex items-start gap-2 text-xs text-brand-gray-700 leading-relaxed">
          <input
            type="checkbox"
            required
            checked={values.fcraConsent}
            onChange={(e) => update("fcraConsent", e.target.checked)}
            className="w-4 h-4 mt-0.5 shrink-0"
          />
          <span>
            <span className="font-semibold">
              Credit report authorization (required):
            </span>{" "}
            {CONSENT_LANGUAGE[CONSENT_VERSION].fcra_credit_auth}
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
        {disabled ? t.creditApp.submitting : t.creditApp.submitDefault}
      </button>
    </form>
  );
}
