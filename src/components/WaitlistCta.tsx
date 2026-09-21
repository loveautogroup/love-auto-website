"use client";

/** One line under the new-arrival alert box pointing at the fuller waitlist
 *  form (2026-09-21). Bilingual via t.alerts. */
import { useLanguage } from "@/context/LanguageContext";

export default function WaitlistCta() {
  const { t } = useLanguage();
  return (
    <p className="mt-4 pt-4 border-t border-brand-gray-100 text-xs text-brand-gray-500">
      {t.alerts.waitlistCta}{" "}
      <a href="/waitlist/" className="font-semibold text-brand-red hover:underline">
        {t.alerts.waitlistCtaLink} →
      </a>
    </p>
  );
}
