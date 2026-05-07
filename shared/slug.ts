/**
 * Canonical slug computer for vehicle VDP URLs.
 *
 * Single source of truth used by:
 *   - src/lib/dmsInventory.ts        (Next.js build / sitemap.ts /
 *                                     generateStaticParams)
 *   - functions/api/inventory.ts     (Pages Function: public inventory feed)
 *   - functions/inventory/[slug].ts  (Pages Function: VDP bridge for non-
 *                                     prerendered slugs)
 *
 * Before this module existed (pre-2026-05-07) all three files had byte-
 * identical copies of titleCase / slugify / SEED_SLUGS_BY_VIN / the auto-
 * slug formula. Bill consolidated to prevent future drift after Charlotte's
 * indexing audit identified the duplication as a drift hazard.
 *
 * No runtime dependencies — pure functions on string inputs, safe to import
 * from any execution context (Node build, Workers runtime, browser).
 */

/**
 * VIN → canonical slug overrides. These are the historical SEO-stable
 * slugs assigned at intake. When DealerCenter data shifts (model name
 * gets corrected, trim re-spelled, stock number re-issued) the SEED entry
 * holds the original slug so we never break an existing indexed URL.
 *
 * Add a row when onboarding a new vehicle that needs a custom slug.
 * Otherwise the auto-generated `${year}-${make}-${model}-${trim}-${idTail}`
 * slug applies.
 */
export const SEED_SLUGS_BY_VIN: Record<string, string> = {
  "1FA6P8TH6H5202495": "2017-ford-mustang-ecoboost-premium-11331",
  "2HNYD2H63AH509874": "2010-acura-mdx-sport-11318",
  "2GKALUEK6D6300009": "2013-gmc-terrain-slt-11316",
  "KMHCT4AE6HU222547": "2017-hyundai-accent-se-11313",
  "JTHHE5BC2G5011456": "2016-lexus-rc-350-11266",
  "JF2SJAGC1HH553881": "2017-subaru-forester-premium-11340",
};

export function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((part) => {
      if (/^\s+$/.test(part) || part === "-") return part;
      if (!part) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Minimal vehicle shape needed to compute a slug. Loose typing on
 * purpose — every caller passes a slightly different DMS response shape
 * and we don't want this module to take a hard dependency on any one of
 * them.
 */
export interface VehicleForSlug {
  vin: string;
  year: number | string;
  make: string;
  model: string;
  trim?: string | null;
  stockNumber?: string | number | null;
  id?: string | number | null;
}

/**
 * Compute the canonical slug for a vehicle. Honors SEED_SLUGS_BY_VIN
 * before falling back to the auto-slug formula.
 *
 * Auto-slug shape: `${year}-${make}-${model}[-${trim}]-${stockOrIdTail}`
 *   - stockNumber is preferred for the trailing identifier
 *   - falls back to id, then to last 6 of VIN
 *   - all components run through slugify(), then the whole string runs
 *     through slugify() again to collapse multi-dash artifacts
 */
export function vehicleSlug(v: VehicleForSlug): string {
  const seeded = SEED_SLUGS_BY_VIN[v.vin];
  if (seeded) return seeded;

  const make = titleCase(v.make ?? "");
  const model = titleCase(v.model ?? "");
  const trim = v.trim ? titleCase(v.trim) : "";
  const stockNumber = v.stockNumber ? String(v.stockNumber) : "";
  const idForSlug =
    stockNumber || String(v.id ?? "").trim() || (v.vin ?? "").slice(-6);
  return slugify(
    `${v.year}-${slugify(make)}-${slugify(model)}${
      trim ? "-" + slugify(trim) : ""
    }-${slugify(idForSlug)}`
  );
}
