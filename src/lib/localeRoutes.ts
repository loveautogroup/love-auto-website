/**
 * Which pages actually exist in Spanish.
 *
 * ONE source of truth, shared by the language switcher and the sitemap. Those
 * two must never disagree: a switcher offering a page the sitemap doesn't list
 * is a link into nothing, and a sitemap listing a page the switcher can't reach
 * is a page no human ever finds. Keeping the list in one file makes the two
 * wrong-in-different-directions failures impossible rather than merely unlikely.
 *
 * English lives at the root and Spanish under /es/ — English URLs were
 * deliberately NOT moved to /en/, because that would re-issue every URL the
 * site currently ranks for.
 *
 * TO ADD A PAGE: create src/app/es/<path>/page.tsx (rendering the English
 * component, with its own Spanish metadata + reciprocal hreflang), then add
 * the path here. Both steps, or it's half-wired.
 */

/** English paths that have a Spanish counterpart at /es/<path>. */
export const LOCALIZED_PATHS: readonly string[] = [
  "/", // homepage — the pilot
  "/inventory", // the page a Spanish-speaking shopper actually wants
];

/**
 * Localized routes that can't be enumerated, because the paths come from
 * inventory and change every time a car lands or sells.
 *
 * Vehicle detail pages are generated for both locales from the same slug list
 * (src/lib/vdpRoute.ts), so any live English VDP has a Spanish twin by
 * construction. The switcher needs to know that without holding a list that
 * would be stale the moment stock changes.
 *
 * Deliberately ONE segment: live VDPs are always /inventory/<slug>/, and a
 * looser pattern would claim a Spanish twin for the deeper legacy
 * /inventory/<make>/<model>/<stock> URLs, which have no page in either
 * language.
 */
const DYNAMIC_LOCALIZED_PATTERNS: readonly RegExp[] = [
  /^\/inventory\/[^/]+$/,
];

/**
 * One-segment /inventory/<x> routes that are NOT vehicle pages: the make and
 * category landing pages, which are real English folders under
 * src/app/inventory/ but have no Spanish twin. The pattern above cannot tell
 * them from a VDP slug, so without this list the switcher linked
 * /inventory/used-lexus/ to /es/inventory/used-lexus/, a hard 404 that Search
 * Console reported on 2026-11-09.
 *
 * scripts/check-locale-routes.mjs (run in prebuild) fails the build if a
 * static folder appears under src/app/inventory/ that is missing here, so a
 * new landing page cannot silently reintroduce the bug.
 */
export const NON_VDP_INVENTORY_SEGMENTS: readonly string[] = [
  "used-acura",
  "used-honda",
  "used-lexus",
  "used-mazda",
  "used-sedans",
  "used-subaru",
  "used-suvs",
];

/**
 * Trailing slashes are load-bearing on this site: production 308s `/inventory`
 * to `/inventory/`, so a URL emitted without one is a redirect, not a page.
 * Google reports a redirecting sitemap entry as "Page with redirect" and
 * indexes neither, and an hreflang pair pointing at a redirect fails the
 * reciprocity check. Everything this module hands out is slash-terminated.
 *
 * This only became visible when /inventory was added: "/" was special-cased
 * to "/es/" from the start, so the single pilot path hid the bug.
 */
export function withTrailingSlash(path: string): string {
  if (!path) return "/";
  const clean = path.split("?")[0].split("#")[0];
  return clean.endsWith("/") ? clean : `${clean}/`;
}

/** Canonical English path for a Spanish one, and vice versa. */
export function toSpanishPath(englishPath: string): string {
  const p = normalize(englishPath);
  if (!hasSpanishVersion(p)) return "/es/";
  return p === "/" ? "/es/" : withTrailingSlash(`/es${p}`);
}

export function toEnglishPath(spanishPath: string): string {
  const p = normalize(spanishPath);
  if (p === "/es" || p === "/es/") return "/";
  return p.startsWith("/es/") ? p.slice(3) : p;
}

/** True when the given path is inside the Spanish tree. */
export function isSpanishPath(path: string): boolean {
  const p = normalize(path);
  return p === "/es" || p === "/es/" || p.startsWith("/es/");
}

/**
 * True when this English path has a Spanish version. The switcher uses this to
 * decide between "same page in Spanish" and a fallback to the Spanish home —
 * it must never link to a /es/ URL that was never generated, since this is a
 * static export and that is a hard 404, not a soft redirect.
 */
export function hasSpanishVersion(englishPath: string): boolean {
  const p = normalize(englishPath);
  if (LOCALIZED_PATHS.includes(p)) return true;
  const m = /^\/inventory\/([^/]+)$/.exec(p);
  if (m && NON_VDP_INVENTORY_SEGMENTS.includes(m[1])) return false;
  return DYNAMIC_LOCALIZED_PATTERNS.some((rx) => rx.test(p));
}

function normalize(path: string): string {
  if (!path) return "/";
  // Strip query/hash, collapse a trailing slash (except for the bare root).
  const clean = path.split("?")[0].split("#")[0];
  if (clean === "/") return "/";
  return clean.endsWith("/") ? clean.slice(0, -1) || "/" : clean;
}
