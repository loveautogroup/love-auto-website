"use client";

import { SITE_CONFIG } from "@/lib/constants";
import { useLanguage } from "@/context/LanguageContext";

/**
 * The red strip above the header: a one-line promise and a tap-to-call number.
 *
 * Owner, 2026-09-12, showing a competitor's phone screenshot (Midwest Autohaus,
 * Skokie): "Can we add something like this to our site?"
 *
 * 🔑 THE NUMBER IS THE POINT, NOT THE TAGLINE. On a phone this sits above the
 * fold before the logo, so a shopper who wants to ring the lot never has to
 * look for how. The header already carries a tap-to-call and the header is
 * `sticky top-0`, so this is a second, more explicit route rather than a first
 * one — the difference is that this one SAYS the number out loud instead of
 * hiding it behind a handset icon.
 *
 * ⚠️ NOT sticky, deliberately. The header below it already pins itself, and two
 * stacked sticky bars eat a third of a phone screen before any car appears.
 * This scrolls away and the header keeps the call button.
 */
export default function TopBanner() {
  const { t } = useLanguage();

  return (
    <div className="bg-brand-red text-white text-center px-4 py-2">
      <p className="text-sm font-semibold leading-snug">{t.banner.promise}</p>
      <a
        href={`tel:${SITE_CONFIG.phoneRaw}`}
        className="mt-0.5 inline-flex items-center gap-2 text-lg font-bold tracking-tight hover:underline focus-visible:underline"
        aria-label={`${t.banner.callAria} ${SITE_CONFIG.phone}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
          />
        </svg>
        {SITE_CONFIG.phone}
      </a>
    </div>
  );
}
