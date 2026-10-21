"use client";

/**
 * Homepage sticky bar for phones (owner, 2026-10-21): Call, Text Us and
 * Financing (the Financing button the car-page bar had before Calculate took
 * its place, put back here at the owner's ask). The deal calculator lives on the car pages
 * only (owner: "it's fine just being on the vdp"); a homepage calculator would
 * need a vehicle selector, which is overkill for the footer.
 */
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { SITE_CONFIG } from "@/lib/constants";
import { TrackedPhoneLink, TrackedTextLink } from "@/components/TrackedLink";
import { useGlobalTextPhone } from "@/data/useMerchandising";

const COPY = {
  en: { call: "Call", text: "Text us", financing: "Financing" },
  es: { call: "Llamar", text: "Mensaje", financing: "Financiamiento" },
} as const;

export default function HomeStickyBar() {
  const { locale } = useLanguage();
  const c = COPY[locale === "es" ? "es" : "en"];
  // Same text number as the header and the car pages (the landline takes no texts).
  const globalText = useGlobalTextPhone();
  const textPhone = globalText && /^[0-9]{10,15}$/.test(globalText) ? globalText : SITE_CONFIG.phoneRaw;

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
        <Link
          href="/financing/"
          className="flex-1 flex items-center justify-center gap-1.5 bg-brand-navy text-white py-3.5 text-[12px] font-bold uppercase tracking-[0.05em]"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          {c.financing}
        </Link>
      </div>
    </>
  );
}
