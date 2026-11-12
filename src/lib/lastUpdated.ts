import { execFileSync } from "node:child_process";

/**
 * Real "last updated" date for a content page, read from git at build time
 * (date of the last commit that touched the file). Replaces the hard-coded
 * "Updated May 2026" that never moved.
 *
 * Build-time only (static export). If git history is unavailable, for example
 * a shallow clone with no history for the file, it falls back to the date
 * passed in, which should be the last date a human confirmed.
 */
export interface LastUpdated {
  /** YYYY-MM-DD */
  iso: string;
  /** "November 2026" */
  label: string;
  date: Date;
}

export function lastUpdated(repoRelativePath: string, fallbackIso: string): LastUpdated {
  let iso = fallbackIso;
  try {
    const out = execFileSync(
      "git",
      ["log", "-1", "--format=%cs", "--", repoRelativePath],
      { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"], timeout: 5000 }
    ).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(out)) iso = out;
  } catch {
    /* keep fallback */
  }
  const date = new Date(`${iso}T00:00:00Z`);
  const label = date.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  return { iso, label, date };
}

export const GUIDE_PATHS = {
  subaru: "src/app/buying-guides/used-subaru-near-chicago/page.tsx",
  lexus: "src/app/buying-guides/used-lexus-dupage-county/page.tsx",
} as const;

/** Last date the guide copy was confirmed, used only when git is unavailable. */
export const GUIDE_FALLBACK_ISO = "2026-10-13";
