/**
 * Validation for incoming credit application submissions.
 *
 * Hand-rolled (no Zod dependency in Functions). Diane's rules baked in:
 *   - TCPA consent checkbox MUST be checked (text-message consent)
 *   - Privacy consent MUST be checked
 *   - No SSN collected on the form (collected at dealership on final approval)
 *   - Phone is required so we can follow up
 *
 * Sam's rules:
 *   - All free-text fields reject <, >, " and control chars (XSS / CSV injection)
 *   - Text fields have length caps
 *   - Honeypot field "_website" MUST be empty (bots fill it)
 *   - Submission timestamp MUST show at least 2s elapsed since form render
 *     (bots auto-submit instantly)
 */

export interface FinanceApplicationInput {
  // Contact
  firstName: string;
  lastName: string;
  email: string;
  phone: string;

  // Address
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;

  // Personal — NO SSN on the form
  dateOfBirth: string; // YYYY-MM-DD
  housingStatus: "own" | "rent" | "other";
  monthlyHousingPayment?: number;

  // Employment
  employmentStatus: "employed" | "self-employed" | "retired" | "student" | "unemployed" | "other";
  employer?: string;
  jobTitle?: string;
  monthlyIncome: number;
  timeAtJobMonths?: number;

  // Vehicle interest
  vehicleInterest?: string; // year/make/model they want, or just price range
  desiredMonthlyPayment?: number;
  desiredDownPayment?: number;

  // Trade-in
  hasTradeIn: boolean;
  tradeInDetails?: string; // year/make/model of trade if applicable

  // Legal disclosures + consents (Diane)
  tcpaConsent: boolean; // SMS consent
  privacyConsent: boolean; // Privacy policy acknowledgment

  // Anti-spam
  honeypot: string; // MUST be empty
  renderTimestamp: number; // when the form was rendered; used for min-elapsed check
}

export interface ValidationOk {
  ok: true;
  value: FinanceApplicationInput;
}
export interface ValidationFail {
  ok: false;
  issues: string[];
}

// Field length caps — generous but not unlimited
const MAX_NAME = 80;
const MAX_EMAIL = 120;
const MAX_PHONE = 20;
const MAX_ADDRESS = 120;
const MAX_CITY = 60;
const MAX_EMPLOYER = 120;
const MAX_JOB = 80;
const MAX_VEHICLE = 200;
const MAX_TRADE = 200;

const HOUSING_STATUSES = ["own", "rent", "other"] as const;
const EMPLOYMENT_STATUSES = [
  "employed",
  "self-employed",
  "retired",
  "student",
  "unemployed",
  "other",
] as const;

function assertSafeText(value: string, field: string, issues: string[]) {
  if (/[<>"]/.test(value)) {
    issues.push(`${field} may not contain <, >, or " characters.`);
  }
  // Control chars except \n. No free-text field here should have newlines.
  if (/[\x00-\x1F\x7F]/.test(value)) {
    issues.push(`${field} contains disallowed control characters.`);
  }
}

function isValidEmail(v: string): boolean {
  // Pragmatic — not exhaustive RFC 5322
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) && v.length <= MAX_EMAIL;
}

function isValidPhone(v: string): boolean {
  // Strip common formatting, require 10–15 digits
  const digits = v.replace(/[^\d]/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

function isValidZip(v: string): boolean {
  return /^[0-9]{5}(-[0-9]{4})?$/.test(v);
}

function isValidDate(v: string): boolean {
  // ISO-ish YYYY-MM-DD, and parse-able
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v);
  if (isNaN(d.getTime())) return false;
  // Must be at least 18 years old, no more than 110
  const now = new Date();
  const minDob = new Date(now.getFullYear() - 110, now.getMonth(), now.getDate());
  const maxDob = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
  return d >= minDob && d <= maxDob;
}

export function validateFinanceApplication(
  input: unknown
): ValidationOk | ValidationFail {
  const issues: string[] = [];

  if (!input || typeof input !== "object") {
    return { ok: false, issues: ["Body must be an object."] };
  }
  const o = input as Record<string, unknown>;

  // ─── ANTI-SPAM FIRST — fail fast before heavy validation ────────────
  if (typeof o.honeypot !== "string" || o.honeypot.length > 0) {
    // Don't tell the bot why — just fail silently-ish
    return { ok: false, issues: ["Invalid submission."] };
  }
  const renderTs = Number(o.renderTimestamp);
  if (!Number.isFinite(renderTs)) {
    issues.push("Missing render timestamp.");
  } else {
    const elapsed = Date.now() - renderTs;
    if (elapsed < 2000) {
      // Submitted too fast — almost certainly a bot
      return { ok: false, issues: ["Please take a moment to fill out the form properly."] };
    }
    if (elapsed > 24 * 3600 * 1000) {
      // Form rendered over a day ago — stale; user should refresh
      issues.push("Form is stale. Please refresh and resubmit.");
    }
  }

  // ─── LEGAL CONSENTS ────────────────────────────────────────────────
  if (o.tcpaConsent !== true) {
    issues.push("You must agree to receive text messages to submit this form.");
  }
  if (o.privacyConsent !== true) {
    issues.push("You must acknowledge the privacy notice.");
  }

  // ─── CONTACT ───────────────────────────────────────────────────────
  if (typeof o.firstName !== "string" || o.firstName.trim().length === 0) {
    issues.push("First name is required.");
  } else if (o.firstName.length > MAX_NAME) {
    issues.push("First name is too long.");
  } else {
    assertSafeText(o.firstName, "First name", issues);
  }
  if (typeof o.lastName !== "string" || o.lastName.trim().length === 0) {
    issues.push("Last name is required.");
  } else if (o.lastName.length > MAX_NAME) {
    issues.push("Last name is too long.");
  } else {
    assertSafeText(o.lastName, "Last name", issues);
  }
  if (typeof o.email !== "string" || !isValidEmail(o.email)) {
    issues.push("Valid email is required.");
  }
  if (typeof o.phone !== "string" || !isValidPhone(o.phone)) {
    issues.push("Valid phone number is required.");
  } else if (o.phone.length > MAX_PHONE) {
    issues.push("Phone is too long.");
  }

  // ─── ADDRESS ───────────────────────────────────────────────────────
  for (const [field, value, max] of [
    ["Street address", o.addressStreet, MAX_ADDRESS],
    ["City", o.addressCity, MAX_CITY],
  ] as const) {
    if (typeof value !== "string" || value.trim().length === 0) {
      issues.push(`${field} is required.`);
    } else if (value.length > max) {
      issues.push(`${field} is too long.`);
    } else {
      assertSafeText(value, field, issues);
    }
  }
  if (typeof o.addressState !== "string" || !/^[A-Za-z]{2}$/.test(o.addressState)) {
    issues.push("State must be a 2-letter code.");
  }
  if (typeof o.addressZip !== "string" || !isValidZip(o.addressZip)) {
    issues.push("Valid ZIP code is required.");
  }

  // ─── PERSONAL ──────────────────────────────────────────────────────
  if (typeof o.dateOfBirth !== "string" || !isValidDate(o.dateOfBirth)) {
    issues.push("Valid date of birth is required (must be 18 or older).");
  }
  if (
    typeof o.housingStatus !== "string" ||
    !HOUSING_STATUSES.includes(o.housingStatus as (typeof HOUSING_STATUSES)[number])
  ) {
    issues.push(`Housing status must be one of: ${HOUSING_STATUSES.join(", ")}.`);
  }
  if (o.monthlyHousingPayment !== undefined && o.monthlyHousingPayment !== null) {
    const n = Number(o.monthlyHousingPayment);
    if (!Number.isFinite(n) || n < 0 || n > 50000) {
      issues.push("Monthly housing payment must be between $0 and $50,000.");
    }
  }

  // ─── EMPLOYMENT ────────────────────────────────────────────────────
  if (
    typeof o.employmentStatus !== "string" ||
    !EMPLOYMENT_STATUSES.includes(
      o.employmentStatus as (typeof EMPLOYMENT_STATUSES)[number]
    )
  ) {
    issues.push(
      `Employment status must be one of: ${EMPLOYMENT_STATUSES.join(", ")}.`
    );
  }
  if (o.employer !== undefined && o.employer !== "") {
    if (typeof o.employer !== "string" || o.employer.length > MAX_EMPLOYER) {
      issues.push("Employer name is invalid or too long.");
    } else {
      assertSafeText(o.employer, "Employer", issues);
    }
  }
  if (o.jobTitle !== undefined && o.jobTitle !== "") {
    if (typeof o.jobTitle !== "string" || o.jobTitle.length > MAX_JOB) {
      issues.push("Job title is invalid or too long.");
    } else {
      assertSafeText(o.jobTitle, "Job title", issues);
    }
  }
  const income = Number(o.monthlyIncome);
  if (!Number.isFinite(income) || income < 0 || income > 1000000) {
    issues.push("Valid monthly income is required.");
  }
  if (o.timeAtJobMonths !== undefined && o.timeAtJobMonths !== null && o.timeAtJobMonths !== "") {
    const m = Number(o.timeAtJobMonths);
    if (!Number.isFinite(m) || m < 0 || m > 720) {
      issues.push("Time at current job must be between 0 and 720 months.");
    }
  }

  // ─── VEHICLE INTEREST ──────────────────────────────────────────────
  if (o.vehicleInterest !== undefined && o.vehicleInterest !== "") {
    if (typeof o.vehicleInterest !== "string" || o.vehicleInterest.length > MAX_VEHICLE) {
      issues.push("Vehicle of interest is too long.");
    } else {
      assertSafeText(o.vehicleInterest, "Vehicle of interest", issues);
    }
  }
  for (const [field, value] of [
    ["Desired monthly payment", o.desiredMonthlyPayment],
    ["Desired down payment", o.desiredDownPayment],
  ] as const) {
    if (value !== undefined && value !== null && value !== "") {
      const n = Number(value);
      if (!Number.isFinite(n) || n < 0 || n > 100000) {
        issues.push(`${field} must be a reasonable dollar amount.`);
      }
    }
  }

  // ─── TRADE-IN ──────────────────────────────────────────────────────
  if (typeof o.hasTradeIn !== "boolean") {
    issues.push("Trade-in question must be answered.");
  }
  if (o.hasTradeIn === true) {
    if (typeof o.tradeInDetails !== "string" || o.tradeInDetails.trim().length === 0) {
      issues.push("Trade-in details are required when a trade-in is indicated.");
    } else if (o.tradeInDetails.length > MAX_TRADE) {
      issues.push("Trade-in details are too long.");
    } else {
      assertSafeText(o.tradeInDetails, "Trade-in details", issues);
    }
  }

  if (issues.length > 0) return { ok: false, issues };

  // Cast is safe — we've validated every field above.
  return { ok: true, value: input as FinanceApplicationInput };
}
