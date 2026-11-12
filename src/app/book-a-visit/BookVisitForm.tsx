"use client";

/**
 * BookVisitForm -- "Book a visit" request for the /book-a-visit/ page.
 *
 * LEAD-ONLY (owner rule, same as the VDP test-drive request): this books
 * nothing. It captures who, which car, and a preferred day + time, and lands
 * in the DMS leads pipeline. The owner confirms by call or text. No calendar
 * lookup, no availability display, no auto-confirm. Do not add any.
 *
 * RAILS (reused, not forked): POST /api/leads (functions/api/leads.ts) ->
 * DMS POST /api/v1/public/leads. The intake key is attached server-side by the
 * Pages Function. Anti-spam is inherited: honeypot, startedAt timing guard,
 * per-IP rate limit in the proxy (LEADS KV), the DMS's own 5-per-10-min limit.
 *
 * SOURCE TAG: "website-book-visit". The DMS lead schema takes any string up to
 * 60 characters, so it is stored as Customer.optInSource and
 * LeadActivity.source untouched. The `testDrive` block is deliberately NOT
 * sent: that block opens a PENDING calendar appointment and relabels the
 * notification "Test drive request". A visit request is neither; the requested
 * time rides in `message`, which lands in Customer.notes.
 *
 * TIMES: suggested visit times are 9 AM to 7 PM every day (owner, 2026-11-12).
 * These are appointment times, not store hours, so they do not come from
 * /api/store-hours. Any other time is an "other time" request and is labelled
 * so in the lead body. Every visit is confirmed by call or text.
 *
 * PRIVACY: nothing here logs or stores the customer's details. No console
 * output, no localStorage.
 */

import { useMemo, useRef, useState } from "react";
import { useInventory } from "@/lib/useInventory";
import { useVisibleVehicles } from "@/data/useMerchandising";
import { LeadFormConsent } from "@/components/LeadFormConsent";
import { CONSENT_LANGUAGE, consentHashesFor } from "@/lib/consent-language";
import { trackFormSubmit } from "@/lib/analytics";
import { optionLabel } from "@/app/financing/vehiclePickerOptions";

/** leadSource tag that makes these distinguishable in the DMS. */
export const BOOK_VISIT_SOURCE = "website-book-visit";

/** Page is English only; use the English consent registry row. */
const OPT_IN_LANGUAGE_VERSION = "v3-2026-08-sms-en";

const BROWSING = "__browsing__";
const OTHER_TIME = "__other__";
const GENERIC_ERROR =
  "Something went wrong. Please call 630-359-3643 or text 312-925-7520.";

interface DayHours {
  open: string; // "HH:MM" 24h
  close: string;
}
interface StoreHoursConfig {
  timezone: string;
  slotMinutes: number;
  durationMinutes: number;
  maxDaysAhead: number;
  /** Key = JS Date.getDay(), 0 = Sunday. null = closed. */
  days: Record<string, DayHours | null>;
}

/** Suggested visit times: 9 AM to 7 PM every day, last slot 7:00 PM. */
const VISIT_HOURS: StoreHoursConfig = {
  timezone: "America/Chicago",
  slotMinutes: 30,
  durationMinutes: 0,
  maxDaysAhead: 60,
  days: {
    "0": { open: "09:00", close: "19:00" },
    "1": { open: "09:00", close: "19:00" },
    "2": { open: "09:00", close: "19:00" },
    "3": { open: "09:00", close: "19:00" },
    "4": { open: "09:00", close: "19:00" },
    "5": { open: "09:00", close: "19:00" },
    "6": { open: "09:00", close: "19:00" },
  },
};

/** Don't offer a start time less than this many minutes from now. */
const MIN_LEAD_MINUTES = 60;

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return raw.trim();
}

function splitName(full: string): { firstName: string; lastName: string } {
  const parts = full.trim().split(/\s+/);
  // The DMS requires a last name; a single word goes in both rather than
  // blocking the request.
  const firstName = parts[0] ?? "";
  const lastName = parts.slice(1).join(" ") || firstName;
  return { firstName, lastName };
}

const pad = (x: number) => String(x).padStart(2, "0");

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}
function fromMinutes(mins: number): string {
  return `${pad(Math.floor(mins / 60))}:${pad(mins % 60)}`;
}
function humanTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(2000, 0, 1, h, m));
}
function weekdayOf(iso: string): number {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}
function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d + n);
  return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
}
function humanDay(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(y, m - 1, d));
}
/** Today's date + minutes since midnight AT THE DEALERSHIP. */
function nowAtStore(tz: string): { date: string; minutes: number } {
  const now = new Date();
  const date = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
  const hm = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);
  const [h, m] = hm.split(":").map(Number);
  return { date, minutes: (h || 0) * 60 + (m || 0) };
}

export default function BookVisitForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [carKey, setCarKey] = useState(BROWSING);
  const [day, setDay] = useState("");
  const [time, setTime] = useState(""); // "HH:MM" slot, or OTHER_TIME
  const [otherTime, setOtherTime] = useState(""); // "HH:MM" free time
  const [note, setNote] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [startedAt] = useState(() => Date.now());
  const hasAttempted = useRef(false);

  // Cars for sale: live feed (KV) over build-time seed, merchandising-hidden
  // cars removed, only "available" (not pending, not sold, not coming soon).
  const { vehicles } = useInventory();
  const visible = useVisibleVehicles(vehicles);
  const cars = useMemo(
    () => visible.filter((v) => v.status === "available"),
    [visible]
  );

  const cfg = VISIT_HOURS;

  // Computed at render; the date inputs carry suppressHydrationWarning because
  // the build-time HTML holds the build day.
  const minDay = nowAtStore(cfg.timezone).date;
  const maxDay = addDays(minDay, cfg.maxDaysAhead);

  const dayHours = day ? cfg.days[String(weekdayOf(day))] ?? null : null;
  const isClosedDay = !!day && !dayHours;

  const slots = useMemo<string[]>(() => {
    if (!day || !dayHours) return [];
    const open = toMinutes(dayHours.open);
    const last = toMinutes(dayHours.close) - cfg.durationMinutes;
    if (last < open) return [];
    const store = nowAtStore(cfg.timezone);
    const earliest =
      day === store.date ? store.minutes + MIN_LEAD_MINUTES : -Infinity;
    const out: string[] = [];
    for (let m = open; m <= last; m += cfg.slotMinutes) {
      if (m >= earliest) out.push(fromMinutes(m));
    }
    return out;
  }, [day, dayHours, cfg]);

  const wantsOther = time === OTHER_TIME;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    // Read before mutating: a legitimate second attempt must not trip the
    // proxy's "too fast" guard, so a retry omits startedAt.
    const isRetry = hasAttempted.current;
    hasAttempted.current = true;

    if (!name.trim()) return setError("Please enter your name.");
    if (phone.replace(/\D/g, "").length < 10)
      return setError("Please enter a phone number we can call or text.");
    if (!day) return setError("Please pick a day.");
    if (!time) return setError("Please pick a time.");
    if (wantsOther && !otherTime)
      return setError("Please enter the time you would like.");
    if (!optIn) return setError("Please check the box so we can contact you.");

    setSending(true);
    setError(null);

    try {
      const { firstName, lastName } = splitName(name);
      const car =
        carKey === BROWSING ? null : cars.find((v) => v.vin === carKey) ?? null;

      const carName = car
        ? [car.year, car.make, car.model, car.trim].filter(Boolean).join(" ")
        : "Just browsing / not sure";
      const vehicleLine = car
        ? [
            carName,
            car.stockNumber ? `Stock #${car.stockNumber}` : null,
            car.vin ? `VIN ${car.vin}` : null,
          ]
            .filter(Boolean)
            .join(" | ")
        : carName;

      const whenText = `${humanDay(day)} at ${humanTime(wantsOther ? otherTime : time)}`;
      const timeType = wantsOther
        ? isClosedDay
          ? "OTHER TIME REQUEST (closed that day, by appointment only)"
          : "OTHER TIME REQUEST (outside the suggested 9 AM to 7 PM)"
        : "Within suggested times (9 AM to 7 PM)";

      const message = [
        "VISIT REQUEST (Book a Visit page)",
        `Vehicle: ${vehicleLine}`,
        `Requested: ${whenText}`,
        `Time type: ${timeType}`,
        note.trim() ? `Notes: ${note.trim()}` : null,
        "Customer picked this on the website. Nothing was booked or checked " +
          "against the calendar. Call or text to confirm.",
      ]
        .filter(Boolean)
        .join("\n")
        .slice(0, 2000);

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: normalizePhone(phone),
          email: email.trim() || undefined,
          vehicleInterestText: (car
            ? [carName, car.stockNumber ? `Stock #${car.stockNumber}` : null]
                .filter(Boolean)
                .join(" | ")
            : "Visit request - just browsing / not sure"
          ).slice(0, 500),
          message,
          source: BOOK_VISIT_SOURCE,
          marketingOptIn: optIn,
          optInLanguageVersion: OPT_IN_LANGUAGE_VERSION,
          consentHashes: await consentHashesFor(OPT_IN_LANGUAGE_VERSION),
          honeypot,
          startedAt: isRetry ? undefined : startedAt,
          referrer: document.referrer || undefined,
          sourceMetadata: (() => {
            const p = new URLSearchParams(window.location.search);
            const meta: Record<string, string> = {};
            for (const k of [
              "utm_source",
              "utm_medium",
              "utm_campaign",
              "utm_term",
              "utm_content",
              "gclid",
              "fbclid",
            ] as const) {
              const v = p.get(k);
              if (v) meta[k] = v;
            }
            meta.landingPage = window.location.href;
            return meta;
          })(),
        }),
      });

      if (!res.ok) {
        const b = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(b.error || GENERIC_ERROR);
      }

      setSuccess(
        `Thanks, ${firstName}. We got your request. We will call or text you to confirm a time. Nothing is booked until we do.`
      );
      trackFormSubmit("book_visit");
    } catch (err) {
      setError(err instanceof Error ? err.message : GENERIC_ERROR);
    } finally {
      setSending(false);
    }
  }

  if (success) {
    return (
      <div
        role="status"
        className="rounded-xl border border-brand-green/30 bg-brand-green/10 p-6 self-start"
      >
        <h2 className="font-bold text-brand-gray-900 text-lg">
          Request received
        </h2>
        <p className="mt-2 text-sm text-brand-gray-700">{success}</p>
        <p className="mt-3 text-sm text-brand-gray-700">
          Need us sooner? Call 630-359-3643 or text 312-925-7520.
        </p>
      </div>
    );
  }

  const inputCss =
    "w-full rounded-lg border border-brand-gray-200 bg-white px-3 py-2.5 text-sm text-brand-gray-900 placeholder:text-brand-gray-400 focus:border-brand-red focus:outline-none focus:ring-1 focus:ring-brand-red";
  const labelCss = "block text-sm font-medium text-brand-gray-700 mb-1";

  return (
    <form
      onSubmit={handleSubmit}
      className="relative space-y-4 bg-white border border-ink-200 p-5 sm:p-6"
      aria-labelledby="bv-form-heading"
    >
      <h2
        id="bv-form-heading"
        className="font-heading font-extrabold text-xl text-brand-gray-900"
      >
        Request a visit
      </h2>

      {/* Honeypot: offscreen, humans never see it. */}
      <div aria-hidden="true" className="absolute -left-[9999px] -top-[9999px]">
        <label>
          Leave blank
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </label>
      </div>

      <div>
        <label htmlFor="bv-name" className={labelCss}>
          Your name <span className="text-brand-red" aria-hidden="true">*</span>
        </label>
        <input
          id="bv-name"
          type="text"
          required
          autoComplete="name"
          className={inputCss}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="bv-phone" className={labelCss}>
            Phone <span className="text-brand-red" aria-hidden="true">*</span>
          </label>
          <input
            id="bv-phone"
            type="tel"
            required
            autoComplete="tel"
            inputMode="tel"
            className={inputCss}
            placeholder="(630) 555-0123"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="bv-email" className={labelCss}>
            Email{" "}
            <span className="text-brand-gray-500 font-normal">(optional)</span>
          </label>
          <input
            id="bv-email"
            type="email"
            autoComplete="email"
            className={inputCss}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label htmlFor="bv-car" className={labelCss}>
          Which car?
        </label>
        <select
          id="bv-car"
          className={inputCss}
          value={carKey}
          onChange={(e) => setCarKey(e.target.value)}
        >
          <option value={BROWSING}>Just browsing / not sure</option>
          {cars.map((v) => (
            <option key={v.vin} value={v.vin}>
              {optionLabel(v, "")}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="bv-day" className={labelCss}>
            Preferred day{" "}
            <span className="text-brand-red" aria-hidden="true">*</span>
          </label>
          <input
            id="bv-day"
            type="date"
            required
            min={minDay}
            max={maxDay}
            suppressHydrationWarning
            className={inputCss}
            value={day}
            onChange={(e) => {
              setDay(e.target.value);
              setTime("");
            }}
          />
        </div>
        <div>
          <label htmlFor="bv-time" className={labelCss}>
            Preferred time{" "}
            <span className="text-brand-red" aria-hidden="true">*</span>
          </label>
          <select
            id="bv-time"
            required
            disabled={!day}
            aria-describedby="bv-time-help"
            className={inputCss + " disabled:opacity-60"}
            value={time}
            onChange={(e) => setTime(e.target.value)}
          >
            <option value="">{!day ? "Pick a day first" : "Choose a time"}</option>
            {slots.map((s) => (
              <option key={s} value={s}>
                {humanTime(s)}
              </option>
            ))}
            {day && (
              <option value={OTHER_TIME}>
                Other time (by appointment, we&apos;ll confirm)
              </option>
            )}
          </select>
        </div>
      </div>

      <p id="bv-time-help" className="text-xs text-brand-gray-500 -mt-2">
        {isClosedDay
          ? "We are closed that day. You can still ask for it as an other time, and we will let you know."
          : "Suggested times are 9 AM to 7 PM, any day. For any other time, choose “Other time” and we will confirm."}
      </p>

      {wantsOther && (
        <div>
          <label htmlFor="bv-other" className={labelCss}>
            Time you would like{" "}
            <span className="text-brand-red" aria-hidden="true">*</span>
          </label>
          <input
            id="bv-other"
            type="time"
            required
            className={inputCss}
            value={otherTime}
            onChange={(e) => setOtherTime(e.target.value)}
          />
          <p className="mt-1 text-xs text-brand-gray-500">
            Other times are by appointment. We will confirm by call or text.
          </p>
        </div>
      )}

      <div>
        <label htmlFor="bv-note" className={labelCss}>
          Anything we should know?{" "}
          <span className="text-brand-gray-500 font-normal">(optional)</span>
        </label>
        <textarea
          id="bv-note"
          rows={3}
          maxLength={600}
          className={inputCss + " resize-none"}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <p className="text-sm text-brand-gray-700">
        We will call or text to confirm. This is a request, not a booking.
      </p>

      <label className="flex items-start gap-2 text-xs text-brand-gray-700 cursor-pointer">
        <input
          type="checkbox"
          required
          className="mt-0.5 h-4 w-4 shrink-0 rounded border-brand-gray-300 text-brand-red focus:ring-brand-red"
          checked={optIn}
          onChange={(e) => setOptIn(e.target.checked)}
        />
        <span>
          {CONSENT_LANGUAGE[OPT_IN_LANGUAGE_VERSION].tcpa_sms} Please see our{" "}
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-brand-red"
          >
            Privacy Policy
          </a>{" "}
          and{" "}
          <a
            href="/terms"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-brand-red"
          >
            Terms and Conditions
          </a>
          .
        </span>
      </label>

      <LeadFormConsent />

      <div aria-live="polite">
        {error && (
          <div
            role="alert"
            className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={sending}
        className="w-full rounded-lg bg-brand-red text-white font-semibold px-4 py-3 hover:bg-brand-red-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {sending ? "Sending..." : "Request this visit"}
      </button>
    </form>
  );
}
