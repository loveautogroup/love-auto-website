import type { SyncedVehicle } from "@/lib/inventoryAdapter";

/**
 * Live stock summaries for the /brands/{slug}/ landing pages.
 *
 * Why this exists: the brand pages carried hand-written stock claims
 * ("we typically stock used Subarus in the $9,000 to $15,000 range,
 * focused on 2014 to 2018 model years with 80,000 to 140,000 miles").
 * Nothing kept those numbers tied to the lot, and by 2026-08-23 the
 * Subaru page's only Subaru — a 2018 Forester at $6,999.99 with
 * 142,849 miles — sat outside every band the page advertised: under
 * the price floor and over the mileage ceiling.
 *
 * That is worse than a stale marketing line. These pages rank for
 * conversational queries that feed AI Overviews, and an assistant
 * reads the prose as fact and repeats it. The page was telling
 * shoppers something untrue about the cars actually on the lot.
 *
 * So the claim is computed from inventory at build time instead. Build
 * time specifically, not client-side: the whole value of these pages is
 * that a crawler (and whatever LLM is grounding on it) reads the number
 * in the served HTML. A number that only appears after hydration is
 * invisible to exactly the audience this fixes.
 *
 * Staleness is bounded by deploy cadence, same as every other
 * build-time fact on this site — and unlike the hardcoded copy, it
 * self-corrects on the next deploy instead of drifting forever.
 */

/** Rolled-up view of one make's live stock. Never constructed for an
 *  empty set — callers get `null` and omit the sentence entirely. */
export interface BrandStock {
  count: number;
  minPrice: number;
  maxPrice: number;
  minYear: number;
  maxYear: number;
  minMileage: number;
  maxMileage: number;
  /** Populated only when count === 1, for the singular phrasing. */
  only?: { year: number; model: string; mileage: number; price: number };
}

/**
 * Reduce live inventory to one make's numbers.
 *
 * Only `available` vehicles count. A sale-pending car is not something
 * a shopper can come buy, and coming-soon units routinely carry a
 * placeholder price — folding either into a public price range would
 * reintroduce the same class of false claim from the other direction.
 *
 * Returns null when nothing qualifies. Null means "say nothing", never
 * "we have none" — an empty read (the DMS throttle case documented in
 * dmsInventory.ts) and a genuinely empty lot are indistinguishable here,
 * and silence is correct for both.
 */
export function computeBrandStock(
  vehicles: SyncedVehicle[],
  displayName: string
): BrandStock | null {
  const target = displayName.trim().toLowerCase();

  const matches = vehicles.filter(
    (v) =>
      v &&
      v.status === "available" &&
      typeof v.make === "string" &&
      v.make.trim().toLowerCase() === target &&
      Number.isFinite(v.price) &&
      v.price > 0 &&
      Number.isFinite(v.year) &&
      v.year > 1900 &&
      Number.isFinite(v.mileage) &&
      v.mileage >= 0
  );

  if (matches.length === 0) return null;

  const prices = matches.map((v) => v.price);
  const years = matches.map((v) => v.year);
  const miles = matches.map((v) => v.mileage);

  const stock: BrandStock = {
    count: matches.length,
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    minYear: Math.min(...years),
    maxYear: Math.max(...years),
    minMileage: Math.min(...miles),
    maxMileage: Math.max(...miles),
  };

  if (matches.length === 1) {
    const v = matches[0];
    // Model only, no trim. "a 2017 Mustang" is the sentence a person would
    // say; "a 2017 Mustang Ecoboost Premium" is a spec sheet, and trim
    // strings carry casing the snapshot mangles in ways no safe rule
    // repairs ("Le" for LE, "Ecoboost" for EcoBoost). The grid directly
    // below the copy shows full trim anyway.
    stock.only = {
      year: v.year,
      model: v.model,
      mileage: v.mileage,
      price: v.price,
    };
  }

  return stock;
}

/**
 * Repair acronym model names for prose.
 *
 * The build snapshot title-cases model names, so "RAV4" arrives as
 * "Rav4", "SLK350" as "Slk350" and "MKX" as "Mkx". The DMS itself is
 * correct — `/api/v1/public/inventory` returns proper casing — so this
 * is cosmetic damage from the snapshot step, not bad source data, and
 * fixing it there is a separate job touching every listing surface.
 *
 * This only cleans the string this module puts into a sentence. The rule
 * is deliberately narrow, because the failure mode of a clever heuristic
 * is shouting "FORESTER" at a customer:
 *   - a token containing a digit is an alphanumeric badge (Rav4, Slk350, Cx-5)
 *   - a short all-consonant token is an initialism (Mkx, Mkz, Rdx)
 * Real words keep their vowels and are left exactly as they are.
 */
function normalizeModelCase(model: string): string {
  return model
    .split(/\s+/)
    .map((word) => {
      if (/\d/.test(word)) return word.toUpperCase();
      if (word.length <= 3 && !/[aeiou]/i.test(word)) return word.toUpperCase();
      return word;
    })
    .join(" ");
}

/** Whole dollars, floored. Flooring both ends is deliberate: rounding a
 *  $6,999.99 car up to "$7,000" advertises a higher floor than the lot
 *  actually has, and no price claim should ever round against the buyer. */
function money(n: number): string {
  return "$" + Math.floor(n).toLocaleString("en-US");
}

/** Mileage reads as an approximation in prose, so widen to the nearest
 *  thousand rather than quoting six exact digits as if it were a spec. */
function milesFloor(n: number): string {
  return (Math.floor(n / 1000) * 1000).toLocaleString("en-US");
}

function milesCeil(n: number): string {
  return (Math.ceil(n / 1000) * 1000).toLocaleString("en-US");
}

/**
 * The sentence that replaces the old hardcoded claim.
 *
 * Returns null when there is nothing honest to say, and the caller drops
 * the sentence rather than substituting a hedge. The surrounding
 * paragraphs carry the brand expertise that earns these pages their
 * rankings; none of it depends on this sentence existing.
 */
export function stockSentence(
  stock: BrandStock | null,
  displayName: string,
  plural?: string
): string | null {
  if (!stock) return null;

  if (stock.count === 1 && stock.only) {
    const { year, model, mileage, price } = stock.only;
    return (
      `Right now we have one used ${displayName} on the lot: a ${year} ` +
      `${normalizeModelCase(model)} with ${mileage.toLocaleString("en-US")} ` +
      `miles at ${money(price)}.`
    );
  }

  const noun = plural || `${displayName}s`;
  const priceRange =
    stock.minPrice === stock.maxPrice
      ? `at ${money(stock.minPrice)}`
      : `from ${money(stock.minPrice)} to ${money(stock.maxPrice)}`;
  const yearRange =
    stock.minYear === stock.maxYear
      ? `model year ${stock.minYear}`
      : `model years ${stock.minYear} to ${stock.maxYear}`;
  const mileRange =
    milesFloor(stock.minMileage) === milesCeil(stock.maxMileage)
      ? `around ${milesCeil(stock.maxMileage)} miles`
      : `${milesFloor(stock.minMileage)} to ${milesCeil(stock.maxMileage)} miles`;

  return (
    `We currently have ${stock.count} used ${noun} on the lot, ` +
    `${priceRange}, ${yearRange}, with ${mileRange}.`
  );
}

/** Token the brand copy uses to mark where the live sentence belongs.
 *  Copy without the token is passed through untouched, so a brand opts
 *  in by adding it and nothing else changes. */
export const STOCK_TOKEN = "{{STOCK}}";

/**
 * Substitute the live sentence into one paragraph.
 *
 * When there is no sentence the token is removed along with the single
 * following space, so the paragraph resumes cleanly at its next
 * sentence instead of opening on stray whitespace.
 */
export function applyStockToken(
  paragraph: string,
  sentence: string | null
): string {
  if (!paragraph.includes(STOCK_TOKEN)) return paragraph;
  if (sentence) return paragraph.split(STOCK_TOKEN).join(sentence);
  return paragraph.split(STOCK_TOKEN + " ").join("").split(STOCK_TOKEN).join("").trim();
}
