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

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Hydrate from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    const saved = localStorage.getItem("lang") as Locale | null;
    if (saved === "es") setLocaleState("es");
  }, []);

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
