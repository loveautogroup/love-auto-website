"use client";

/**
 * LanguageContext — EN / ES toggle backed by localStorage.
 *
 * Wrap the <body> content in <LanguageProvider> (done in layout.tsx).
 * Any client component that needs translations calls useLanguage():
 *
 *   const { t, locale, toggle } = useLanguage();
 *   <h1>{t.hero.headline}</h1>
 *   <button onClick={toggle}>EN / ES</button>
 *
 * Server components cannot use this hook. Extract translatable sections
 * into dedicated client components (e.g. HomeHero, Header, Footer).
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import { type Locale, type Translations, translations } from "@/lib/i18n";

interface LanguageContextValue {
  locale: Locale;
  t: Translations;
  setLocale: (l: Locale) => void;
  toggle: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "en",
  t: translations.en,
  setLocale: () => {},
  toggle: () => {},
});

export function LanguageProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  /**
   * Locale fixed by the URL — "es" from the /es layout, omitted at the root.
   *
   * When present this is AUTHORITATIVE and localStorage is ignored, because
   * the URL is the source of truth. If a saved preference could win, someone
   * who once clicked Español would land on /about (an English URL) and
   * silently get Spanish text — the page would then contradict its own
   * canonical and hreflang, and serve Google something different from what
   * the crawler was promised. The preference is still WRITTEN on switch so it
   * can drive a first-visit redirect later; it just can't override the URL.
   *
   * React context nests, so /es/layout.tsx mounting a second provider inside
   * the root one overrides the locale for that subtree only. That is what
   * lets every existing page component stay completely untouched.
   */
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale ?? "en");
  const urlPinned = initialLocale !== undefined;

  // Hydrate from localStorage after mount (avoids SSR mismatch) — but only
  // when the URL hasn't already pinned the locale.
  useEffect(() => {
    if (urlPinned) return;
    const saved = localStorage.getItem("lang") as Locale | null;
    if (saved === "es") setLocaleState("es");
  }, [urlPinned]);

  // Keep <html lang="..."> attribute in sync
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {
      // localStorage unavailable (private browsing edge case)
    }
  };

  const toggle = () => setLocale(locale === "en" ? "es" : "en");

  return (
    <LanguageContext.Provider
      value={{ locale, t: translations[locale] as Translations, setLocale, toggle }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
