"use client";

/**
 * WaitlistForm — "tell us what you're looking for" (Jeremiah, 2026-09-21:
 * customers add themselves to the waitlist). Bilingual via useLanguage.
 *
 * On submit it does two things, both same-origin Pages Functions:
 *   1. POST /api/leads — creates the lead in the DMS through the normal
 *      key-gated intake, with a `waitlist` object (make/model/body/year/
 *      mileage/price) the DMS stores as structured wants and matches on.
 *      Same TCPA consent flow as every other form (v3 language, hashed).
 *   2. POST /api/vehicle-alerts — the per-make new-arrival email so they also
 *      hear the moment a car of that make goes live. Best-effort.
 *
 * Anti-abuse mirrors LeadForm: honeypot + startedAt min-elapsed; the DMS rate
 * limits per IP.
 */
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { useInventoryFacets, uniqueSorted } from "@/lib/inventoryFacets";
import { CONSENT_LANGUAGE, consentHashesFor } from "@/lib/consent-language";
import { trackFormSubmit } from "@/lib/analytics";

const HOUSE_MAKES = ["Subaru", "Lexus", "Acura", "Mazda", "Honda", "Toyota"];
const BODIES = ["suv", "sedan", "truck", "coupe", "hatchback", "van", "wagon", "convertible"] as const;

const inputCls =
  "w-full border border-ink-200 px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red";
const labelCls = "block text-sm font-medium text-brand-gray-900 mb-1";

/** Any US phone string -> E.164 (+1XXXXXXXXXX), or null if it is not ten digits. */
function toE164(raw: string): string | null {
  const d = raw.replace(/\D/g, "");
  const ten = d.length === 11 && d.startsWith("1") ? d.slice(1) : d;
  return ten.length === 10 ? `+1${ten}` : null;
}

export default function WaitlistForm() {
  const { t, locale } = useLanguage();
  const w = t.waitlistPage;
  const { makes: lotMakes } = useInventoryFacets();
  const MAKES = uniqueSorted([...HOUSE_MAKES, ...lotMakes]);
  const optInLanguageVersion = locale === "es" ? "v3-2026-08-sms-es" : "v3-2026-08-sms-en";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [body, setBody] = useState("");
  const [yearMin, setYearMin] = useState("");
  const [yearMax, setYearMax] = useState("");
  const [mileageMax, setMileageMax] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [consent, setConsent] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [err, setErr] = useState<string | null>(null);
  // Set on mount, not during render (react-hooks/purity): the server-side
  // min-elapsed anti-bot check compares against this.
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "sending" || state === "done") return;
    setErr(null);

    const parts = name.trim().split(/\s+/);
    const firstName = parts[0] ?? "";
    const lastName = parts.slice(1).join(" ") || "-";
    if (!firstName) return setErr(w.needName);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setErr(w.needEmail);
    const e164 = toE164(phone);
    if (!e164) return setErr(w.needPhone);
    if (!consent) return setErr(w.needConsent);
    const num = (s: string) => (s.trim() ? Number(s) : null);
    const wants = {
      make: make || null,
      model: model.trim() || null,
      bodyStyle: body || null,
      yearMin: num(yearMin),
      yearMax: num(yearMax),
      mileageMax: num(mileageMax),
      priceMax: num(priceMax),
    };
    if (!wants.make && !wants.model && !wants.bodyStyle && wants.priceMax == null && wants.yearMin == null && wants.yearMax == null) {
      return setErr(w.needSomething);
    }

    // A readable one-liner for the lead record and the DMS timeline.
    const desc = [
      [wants.yearMin, wants.yearMax].filter(Boolean).length ? `${wants.yearMin ?? ""}${wants.yearMin && wants.yearMax ? "–" : ""}${wants.yearMax ?? ""}`.trim() : null,
      wants.make,
      wants.model,
      wants.bodyStyle ? w.bodies[wants.bodyStyle as keyof typeof w.bodies] : null,
      wants.mileageMax != null ? `under ${wants.mileageMax.toLocaleString("en-US")} mi` : null,
      wants.priceMax != null ? `up to $${wants.priceMax.toLocaleString("en-US")}` : null,
    ].filter(Boolean).join(" ");

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
          vehicleInterestText: `Waitlist: ${desc}`.slice(0, 500),
          message: undefined,
          source: "website-waitlist",
          leadSource: "Website - Waitlist",
          marketingOptIn: consent,
          optInLanguageVersion,
          consentHashes: await consentHashesFor(optInLanguageVersion),
          waitlist: wants,
          honeypot,
          startedAt: startedAt.current,
          referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
        }),
      });
      if (!res.ok && res.status !== 200) throw new Error(String(res.status));

      // Also subscribe to the per-make new-arrival email (best effort).
      try {
        await fetch("/api/vehicle-alerts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), make: (make || "any").toLowerCase(), locale, website: "", startedAt: startedAt.current }),
        });
      } catch {
        /* the lead is already in; the alert is a bonus */
      }

      try { trackFormSubmit("waitlist"); } catch { /* analytics is never load-bearing */ }
      setState("done");
    } catch {
      setErr(w.error);
      setState("error");
    }
  };

  if (state === "done") {
    return (
      <div className="bg-brand-green/10 border border-brand-green/20 border-l-[3px] border-l-brand-green p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-brand-green mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="font-heading font-extrabold text-xl text-brand-gray-900 mb-2">{w.successHeading}</h3>
        <p className="text-brand-gray-600">{w.successBody}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white border border-ink-200 p-6 space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls} htmlFor="wl-name">{w.nameLabel} <span className="text-brand-red">*</span></label>
          <input id="wl-name" className={inputCls} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
        </div>
        <div>
          <label className={labelCls} htmlFor="wl-email">{w.emailLabel} <span className="text-brand-red">*</span></label>
          <input id="wl-email" type="email" className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
        </div>
        <div>
          <label className={labelCls} htmlFor="wl-phone">{w.phoneLabel} <span className="text-brand-red">*</span></label>
          <input id="wl-phone" type="tel" className={inputCls} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={w.phonePlaceholder} autoComplete="tel" required />
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div>
          <label className={labelCls} htmlFor="wl-make">{w.makeLabel}</label>
          <select id="wl-make" className={inputCls} value={make} onChange={(e) => setMake(e.target.value)}>
            <option value="">{w.anyMake}</option>
            {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="wl-model">{w.modelLabel}</label>
          <input id="wl-model" className={inputCls} value={model} onChange={(e) => setModel(e.target.value)} placeholder={w.modelPlaceholder} maxLength={60} />
        </div>
        <div>
          <label className={labelCls} htmlFor="wl-body">{w.bodyLabel}</label>
          <select id="wl-body" className={inputCls} value={body} onChange={(e) => setBody(e.target.value)}>
            <option value="">{w.anyBody}</option>
            {BODIES.map((b) => <option key={b} value={b}>{w.bodies[b]}</option>)}
          </select>
        </div>
        <div>
          <label className={labelCls} htmlFor="wl-price">{w.maxPrice}</label>
          <input id="wl-price" type="number" inputMode="numeric" className={inputCls} value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder={w.any} min={0} />
        </div>
        <div>
          <label className={labelCls} htmlFor="wl-ymin">{w.yearFrom}</label>
          <input id="wl-ymin" type="number" inputMode="numeric" className={inputCls} value={yearMin} onChange={(e) => setYearMin(e.target.value)} placeholder={w.any} min={1990} max={2100} />
        </div>
        <div>
          <label className={labelCls} htmlFor="wl-ymax">{w.yearTo}</label>
          <input id="wl-ymax" type="number" inputMode="numeric" className={inputCls} value={yearMax} onChange={(e) => setYearMax(e.target.value)} placeholder={w.any} min={1990} max={2100} />
        </div>
        <div>
          <label className={labelCls} htmlFor="wl-miles">{w.maxMiles}</label>
          <input id="wl-miles" type="number" inputMode="numeric" className={inputCls} value={mileageMax} onChange={(e) => setMileageMax(e.target.value)} placeholder={w.any} min={0} />
        </div>
      </div>

      {/* Honeypot — visually hidden; bots fill it, the DMS drops it silently. */}
      <div className="hidden" aria-hidden="true">
        <label htmlFor="wl-hp">{t.leadForm.honeypotLabel}</label>
        <input id="wl-hp" tabIndex={-1} autoComplete="off" value={honeypot} onChange={(e) => setHoneypot(e.target.value)} />
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
        {state === "sending" ? w.sending : w.button}
      </button>
    </form>
  );
}
