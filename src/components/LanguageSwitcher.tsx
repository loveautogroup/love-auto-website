"use client";

/**
 * Language switcher — replaces the two-segment EN/ES pill.
 *
 * Two things changed and both matter:
 *
 * 1. It NAVIGATES instead of flipping client state. Language now lives in the
 *    URL (/ vs /es/), which is the whole reason Google can see the Spanish
 *    site at all. A control that only set React state would leave the URL
 *    saying English while the page rendered Spanish — contradicting its own
 *    canonical and hreflang.
 *
 * 2. It is a dropdown, not a toggle. A two-segment pill cannot hold a third
 *    language, and it was the widest thing in an 11px mobile strip. Collapsed,
 *    this is narrower than the old pill; adding a language costs a list item
 *    rather than a redesign.
 *
 * Mobile is the constraint that shaped it: the menu items are 44px tall (the
 * usual minimum comfortable touch target), it opens on click rather than
 * hover (there is no hover on a phone), and the panel is right-anchored so it
 * cannot push the layout sideways in the narrow strip it lives in.
 *
 * Falls back to the Spanish HOME page when the current page has no Spanish
 * version yet. This is a static export, so linking to an ungenerated /es/ URL
 * would be a hard 404 — see hasSpanishVersion in lib/localeRoutes.
 */

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  hasSpanishVersion,
  isSpanishPath,
  toEnglishPath,
  toSpanishPath,
} from "@/lib/localeRoutes";

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
] as const;

export default function LanguageSwitcher() {
  const pathname = usePathname() || "/";
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const onSpanish = isSpanishPath(pathname);
  const current = onSpanish ? LANGUAGES[1] : LANGUAGES[0];
  const englishPath = onSpanish ? toEnglishPath(pathname) : pathname;

  const hrefFor = (code: string) => {
    if (code === "en") return englishPath;
    return hasSpanishVersion(englishPath) ? toSpanishPath(englishPath) : "/es/";
  };

  // Close on outside click and on Escape. Both are needed: a phone user
  // taps away to dismiss, a keyboard user expects Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("touchstart", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("touchstart", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={
          onSpanish ? "Cambiar idioma" : "Change language"
        }
        className="flex items-center gap-1.5 rounded-full border border-white/30 px-3 py-1 text-sm font-semibold text-white transition-colors hover:border-white/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-red"
      >
        <svg
          className="h-3.5 w-3.5 shrink-0 opacity-70"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.8}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 21a9 9 0 100-18 9 9 0 000 18zm0 0c2.5-2.5 3.75-5.5 3.75-9S14.5 5.5 12 3m0 18c-2.5-2.5-3.75-5.5-3.75-9S9.5 5.5 12 3M3.6 9h16.8M3.6 15h16.8"
          />
        </svg>
        <span>{current.label}</span>
        <svg
          className={`h-3 w-3 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2.4}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Always in the DOM, hidden when closed, rather than conditionally
          rendered. Two reasons: the /es/ link stays crawlable (hreflang and
          the sitemap are the primary discovery signals, but a real anchor
          costs nothing and is the strongest one), and the switcher still
          works with JavaScript disabled — the menu is simply always open.
          The `hidden` attribute also removes it from the tab order and the
          accessibility tree while closed, which a CSS-only hide would not. */}
      <div
        role="menu"
        hidden={!open}
        aria-label={onSpanish ? "Idiomas" : "Languages"}
        className="absolute right-0 z-50 mt-1.5 w-44 overflow-hidden rounded-xl border border-white/15 bg-[#0a0a0a] shadow-xl"
      >
          {LANGUAGES.map((lang) => {
            const active = lang.code === current.code;
            return (
              <Link
                key={lang.code}
                href={hrefFor(lang.code)}
                hrefLang={lang.code}
                role="menuitem"
                onClick={() => setOpen(false)}
                className={`flex h-11 items-center justify-between px-3.5 text-sm transition-colors ${
                  active
                    ? "bg-brand-red font-semibold text-white"
                    : "text-brand-gray-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <span>{lang.label}</span>
                {active && (
                  <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </Link>
            );
        })}
      </div>
    </div>
  );
}
