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

/**
 * How many URL-pinned providers are currently mounted. Module scope on
 * purpose — the root provider and a nested /es provider are different
 * component instances and cannot see each other any other way.
 */
let pinnedProviderCount = 0;

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

  // A URL-pinned provider claims ownership of <html lang> while it is
  // mounted. Effects run children-first, so on /es/ the pinned provider set
  // lang="es" and then the root provider immediately overwrote it with "en" —
  // the Spanish page was serving lang="en" to screen readers. This ref count
  // lets the outer provider stand down when an inner one owns the attribute.
  useEffect(() => {
    if (!urlPinned) return;
    pinnedProviderCount += 1;
    return () => {
      pinnedProviderCount -= 1;
    };
  }, [urlPinned]);

  // Keep <html lang="..."> in sync.
  //
  // Note this only corrects the attribute after hydration; the static HTML
  // still ships lang="en" because <html> is rendered by the root layout and a
  // nested layout cannot change it. That is acceptable: Google does not use
  // the lang attribute for language targeting (it uses hreflang, which is
  // correct and static here) — this matters for screen readers, which run
  // against the live DOM.
  useEffect(() => {
    if (!urlPinned && pinnedProviderCount > 0) return;
    document.documentElement.lang = locale;
  }, [locale, urlPinned]);

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
