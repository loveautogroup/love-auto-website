"use client";

/**
 * Generic inline-translation helper for server components.
 *
 * Server components (VDP page, brand/make landing pages, etc.) can't call
 * useLanguage() directly. For a one-off string that doesn't warrant its own
 * named client component, drop this in instead:
 *
 *   <T path={["ctas", "getPreApproved"]} />
 *
 * For strings that need interpolation, pass a `replace` map (applied after
 * the lookup, in the order the keys appear). A value can be a literal string
 * or another translation path — the latter is resolved server-language-
 * agnostically at render time, same as `path` itself:
 *
 *   <T path={["brandsChrome", "callPhone"]} replace={{ "{phone}": SITE_CONFIG.phone }} />
 *   <T path={["makeLandingChrome", "ctaBody"]} replace={{ "{thing}": { path: ["makeLandingChrome", "vehicleGeneric"] } }} />
 *
 * Prefer a dedicated named client component (see VDPTextUsLink, VDPTrustStrip,
 * etc.) when the same text needs several call sites or non-trivial markup —
 * this is for single-use inline swaps only.
 *
 * Found in the website audit: this used to take a `get: (t) => string`
 * function prop. Every one of the 33 call sites lives in a Server Component
 * (the VDP page, brand pages, make-landing pages) — passing a function prop
 * from a Server Component to a Client Component is invalid under React
 * Server Components (functions aren't serializable across that boundary
 * without "use server") and threw "Functions cannot be passed directly to
 * Client Components" during static export, non-deterministically failing on
 * whichever page the build worker reached first and aborting the entire
 * build. `path` (a plain string array) and `replace` (a plain string map)
 * are both serializable, so the same lookup now crosses the boundary safely.
 */

import { useLanguage } from "@/context/LanguageContext";
import type { Translations } from "@/lib/i18n";

function lookup(t: Translations, path: readonly string[]): string {
  let value: unknown = t;
  for (const key of path) {
    value = value && typeof value === "object" ? (value as Record<string, unknown>)[key] : undefined;
  }
  return typeof value === "string" ? value : "";
}

type ReplaceValue = string | { path: readonly string[] };

export default function T({
  path,
  replace,
}: {
  path: readonly string[];
  /** Applied in order after the lookup — e.g. {"{phone}": "(630) 359-3643"} */
  replace?: Record<string, ReplaceValue>;
}) {
  const { t } = useLanguage();
  let str = lookup(t, path);
  if (replace) {
    for (const [find, repl] of Object.entries(replace)) {
      const value = typeof repl === "string" ? repl : lookup(t, repl.path);
      str = str.split(find).join(value);
    }
  }
  return <>{str}</>;
}
