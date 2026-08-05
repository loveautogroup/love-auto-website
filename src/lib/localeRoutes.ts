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
];

/** Canonical English path for a Spanish one, and vice versa. */
export function toSpanishPath(englishPath: string): string {
  const p = normalize(englishPath);
  if (!LOCALIZED_PATHS.includes(p)) return "/es/";
  return p === "/" ? "/es/" : `/es${p}`;
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
  return LOCALIZED_PATHS.includes(normalize(englishPath));
}

function normalize(path: string): string {
  if (!path) return "/";
  // Strip query/hash, collapse a trailing slash (except for the bare root).
  const clean = path.split("?")[0].split("#")[0];
  if (clean === "/") return "/";
  return clean.endsWith("/") ? clean.slice(0, -1) || "/" : clean;
}
