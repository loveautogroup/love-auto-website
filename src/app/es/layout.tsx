/**
 * Spanish subtree layout — /es/*
 *
 * The ONLY thing this does is re-provide the language context with the locale
 * pinned to "es". React context nests, so this inner provider overrides the
 * root layout's for everything under /es without the root knowing about it —
 * which is why every page component under here can be the same component the
 * English route already renders, with no locale plumbing of its own.
 *
 * Why Spanish lives at /es/ instead of the whole app moving to /[locale]/:
 * moving English to /en/ would change every URL the site currently ranks for.
 * Search Console has already been through one "Not found (404)" cleanup this
 * year; re-issuing every canonical to chase a structural preference would be
 * a self-inflicted repeat. English stays at the root. Spanish is additive.
 */

import { LanguageProvider } from "@/context/LanguageContext";

export default function SpanishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <LanguageProvider initialLocale="es">{children}</LanguageProvider>;
}
