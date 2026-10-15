"use client";

/**
 * "Notify me when it's ready" on a Coming Soon car's page (owner, 2026-10-15: "when a
 * coming soon vehicle goes to the website we want to capture those future leads with
 * our waiting list. So put something like be notified when car is available on the
 * vehicle website page.").
 *
 * Shows only while the car has no photos of its own (the Coming Soon picture), live:
 * the moment real photos reach the inventory feed it disappears.
 *
 * On submit, the same two posts as the waitlist page (WaitlistForm):
 *   1. POST /api/leads — the lead lands in the DMS, tagged "website-coming-soon", with
 *      this car's year/make/model as structured wants (the DMS waitlist matches on them)
 *      and the stock number in the interest text.
 *   2. POST /api/vehicle-alerts — the per-make new-arrival email, best effort.
 * Same TCPA consent language and anti-abuse fields as every other form.
 */
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useInventory } from "@/lib/useInventory";
import { CONSENT_LANGUAGE, consentHashesFor } from "@/lib/consent-language";
import { trackFormSubmit } from "@/lib/analytics";

const inputCls =
  "w-full border border-ink-200 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red";
const labelCls = "block text-sm font-medium text-brand-gray-900 mb-1";

function toE164(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  const ten = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  return ten.length === 10 ? `+1${ten}` : null;
}

interface Props {
  vin: string;
  seedImages: string[];
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  stockNumber?: string | null;
  isSold?: boolean;
}

export default function VDPNotifyWhenReady({ vin, seedImages, year, make, model, trim, stockNumber, isSold }: Props) {
  const { t, locale } = useLanguage();
  const n = t.notifyReady;
  const w = t.waitlistPage;
  const { vehicles, source } = useInventory();
  const optInLanguageVersion = locale === "es" ? "v3-2026-08-sms-es" : "v3-2026-08-sms-en";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  // Coming Soon = no real photo, from the live feed once it is in (seed before that).
  const seedReal = seedImages.length > 0 && !seedImages[0]?.includes("placeholder");
  const live = source !== "fallback" ? vehicles.find((v) => v.vin === vin) : undefined;
  const liveReal = !!live && Array.isArray(live.images) && live.images.length > 0;
  const comingSoon = !isSold && (live ? !liveReal : !seedReal);
  if (!comingSoon && state !== "done") return null;

  const label = [year, make, model, trim].filter(Boolean).join(" ");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending" || state === "done") return;
    setErr(null);
    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] ?? "";
    const lastName = parts.slice(1).join(" ") || "-";
    if (!firstName) return setErr(n.needName);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setErr(n.needEmail);
    const e164 = toE164(phone);
    if (!e164) return setErr(n.needPhone);
    if (!consent) return setErr(n.needConsent);

    setState("sending");
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName,
          lastName,
          phone: e164,
          email: email.trim(),
          vehicleInterestText: [`Notify when ready: ${label}`, stockNumber ? `Stock #${stockNumber}` : null, `VIN ${vin}`]
            .filter(Boolean).join(" | ").slice(0, 500),
          source: "website-coming-soon",
          leadSource: "Website - Coming Soon",
          marketingOptIn: consent,
          optInLanguageVersion,
          consentHashes: await consentHashesFor(optInLanguageVersion),
          waitlist: { make, model, bodyStyle: null, yearMin: year, yearMax: year, mileageMax: null, priceMax: null },
          honeypot,
          startedAt: startedAt.current,
          referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      try {
        await fetch("/api/vehicle-alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), make: make.toLowerCase(), locale, website: "", startedAt: startedAt.current }),
        });
      } catch {
        /* the lead is already in; the alert is a bonus */
      }
      try { trackFormSubmit("coming_soon_notify"); } catch { /* analytics is never load-bearing */ }
      setState("done");
    } catch {
      setErr(n.error);
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="bg-brand-green/10 border border-brand-green/20 border-l-[3px] border-l-brand-green p-6 text-center" data-testid="notify-ready-done">
        <h3 className="font-heading font-extrabold text-lg text-brand-gray-900 mb-1">{n.successHeading}</h3>
        <p className="text-sm text-brand-gray-600">{n.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white border border-ink-200 border-l-[3px] border-l-brand-red p-6 space-y-4" data-testid="notify-ready">
      <div>
        <h2 className="font-heading font-extrabold text-xl text-brand-gray-900">{n.heading}</h2>
        <p className="text-sm text-brand-gray-600 mt-1">{n.sub}</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className={labelCls} htmlFor="nr-name">{n.nameLabel} <span className="text-brand-red">*</span></label>
          <input id="nr-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </div>
        <div>
          <label className={labelCls} htmlFor="nr-email">{n.emailLabel} <span className="text-brand-red">*</span></label>
          <input id="nr-email" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <div>
          <label className={labelCls} htmlFor="nr-phone">{n.phoneLabel} <span className="text-brand-red">*</span></label>
          <input id="nr-phone" type="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={w.phonePlaceholder} autoComplete="tel" required />
        </div>
      </div>
      <div className="hidden" aria-hidden="true">
        <label htmlFor="nr-hp">{t.leadForm.honeypotLabel}</label>
        <input id="nr-hp" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
      </div>
      <label className="flex items-start gap-3 text-xs text-brand-gray-600">
        <input type="checkbox" className="mt-0.5 h-4 w-4 shrink-0" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>{CONSENT_LANGUAGE[optInLanguageVersion].tcpa_sms}</span>
      </label>
      {err && <p className="text-sm text-brand-red">{err}</p>}
      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full bg-brand-red hover:bg-brand-red-dark disabled:opacity-60 text-white py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em] transition-colors"
      >
        {state === "sending" ? n.sending : n.button}
      </button>
    </form>
  );
}
