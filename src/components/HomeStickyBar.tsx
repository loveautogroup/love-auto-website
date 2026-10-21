"use client";

/**
 * Homepage sticky bar for phones (owner, 2026-10-21: "add the footer to the
 * homepage along with the deal calculator" -> "Both"). The same Call / Text Us
 * / Calculate bar the car pages carry. With no car picked, Calculate opens a
 * sheet with the out-the-door calculator (the buyer types a price) and a
 * button down to the homepage's monthly-budget calculator.
 */
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { SITE_CONFIG } from "@/lib/constants";
import { TrackedPhoneLink, TrackedTextLink } from "@/components/TrackedLink";
import { useGlobalTextPhone } from "@/data/useMerchandising";
import VDPOutTheDoor from "@/components/VDPOutTheDoor";

const COPY = {
  en: { heading: "Deal calculator", budget: "Find a car for my monthly budget", call: "Call", text: "Text us" },
  es: { heading: "Calculadora de compra", budget: "Buscar un auto para mi pago mensual", call: "Llamar", text: "Mensaje" },
} as const;

export default function HomeStickyBar() {
  const { t, locale } = useLanguage();
  const c = COPY[locale === "es" ? "es" : "en"];
  const [open, setOpen] = useState(false);
  // Same text number as the header and the car pages (the landline takes no texts).
  const globalText = useGlobalTextPhone();
  const textPhone = globalText && /^[0-9]{10,15}$/.test(globalText) ? globalText : SITE_CONFIG.phoneRaw;

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener("keydown", onKey); };
  }, [open]);

  const toBudget = () => {
    setOpen(false);
    // After the sheet unmounts and the page can scroll again.
    setTimeout(() => document.getElementById("calc-heading")?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  };

  return (
    <>
      {/* Keeps the last section clear of the fixed bar on phones. */}
      <div className="h-20 lg:hidden" aria-hidden="true" />
      <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-brand-gray-200 p-3 flex gap-2 z-40">
        <TrackedPhoneLink
          location="home_sticky_bottom"
          href={`tel:${SITE_CONFIG.phoneRaw}`}
          className="flex-1 flex items-center justify-center gap-1.5 bg-brand-green text-white py-3.5 text-[12px] font-bold uppercase tracking-[0.05em]"
          aria-label="Call us"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          {c.call}
        </TrackedPhoneLink>
        <TrackedTextLink
          location="home_sticky_bottom"
          href={`sms:${textPhone}?body=${encodeURIComponent("Hi, I'm interested in a vehicle on your lot.")}`}
          className="flex-1 flex items-center justify-center gap-1.5 bg-brand-red text-white py-3.5 text-[12px] font-bold uppercase tracking-[0.05em]"
          aria-label="Text us"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
            <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
          </svg>
          {c.text}
        </TrackedTextLink>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex-1 flex items-center justify-center gap-1.5 bg-brand-navy text-white py-3.5 text-[12px] font-bold uppercase tracking-[0.05em]"
          aria-haspopup="dialog"
          aria-expanded={open}
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
            <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zM7 7h10v2H7V7zm10 12H7v-2h10v2zm0-4H7v-4h10v4z" />
          </svg>
          {t.vdp.calculate}
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-modal="true" aria-labelledby="home-calc-heading">
          <button type="button" aria-label={t.vdp.closeCalculator} onClick={() => setOpen(false)} className="absolute inset-0 bg-black/55" />
          <div className="relative w-full max-w-md bg-white rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 z-10 bg-white border-b border-brand-gray-100 px-4 py-3 flex items-center justify-between">
              <h2 id="home-calc-heading" className="text-base font-bold text-brand-gray-900">{c.heading}</h2>
              <button type="button" onClick={() => setOpen(false)} className="text-brand-gray-500 hover:text-brand-gray-900 p-1 -m-1" aria-label={t.vdp.closeCalculator}>
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <div className="p-4 space-y-3">
              <VDPOutTheDoor editablePrice />
              <button type="button" onClick={toBudget} className="w-full border-2 border-brand-navy text-brand-navy py-3 text-[12px] font-bold uppercase tracking-[0.05em]">
                {c.budget}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
