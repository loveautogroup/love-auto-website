/**
 * Derive structured engine facts — cylinder count and displacement — from
 * the DMS's single free-text `engine` string.
 *
 * WHY THIS IS DEFAULT-DENY. Feeds that want `cylinders` and `engine_size`
 * as separate fields (Vast / CARFAX Car Listings is the first) have to get
 * them from a field that reads, across the live lot today, as:
 *
 *     "3.7L V6"   "2.5L 4-Cylinder"   "3.5L 6-Cyl"   "2.0L 4-Cyl"
 *     "2.3L 4V Premium Fuel"          <- 2017 Mustang EcoBoost, #11331
 *
 * That last one is the entire reason this module exists. **"4V" is FOUR
 * VALVES PER CYLINDER, not four cylinders.** It happens to sit on a car
 * that really is a four-cylinder, so a naive /(\d)\s*V/ would look correct
 * on today's whole lot — and would publish "4 cylinders" the first time we
 * floor a 4.6L 4V Mustang, which is a V8. Ford put that badge on V8s for
 * fifteen years.
 *
 * Every value in a feed is an advertising claim and ICFA needs no intent.
 * This is the same shape as the feature-pills defect (2026-08-30): a
 * pattern filling a required field from the only text at hand, right on
 * the sample it was written against and wrong later.
 *
 * So a cylinder count is emitted ONLY from a token that can mean nothing
 * else: a layout+count badge (V6, V8, I4, H4, W12...) or an explicit
 * "<n>-cylinder" / "<n> cyl". A bare digit beside anything else yields
 * null, and null renders as an empty field. Blank beats wrong.
 *
 * Pure — no Cloudflare or Node globals — so it is shared by the edge
 * functions and directly testable.
 */

/** Engine layout badges whose trailing number IS the cylinder count.
 *  V=vee, I/L=inline (L excluded on purpose, see below), W=W-block,
 *  H/F=flat/boxer (Subaru, Porsche).
 *
 *  ⚠️ "L" is deliberately NOT in this class. "3.5L 6-Cyl" would otherwise
 *  read the displacement's own unit as an inline-5 badge. Inline engines
 *  in this lot's data are spelled "4-Cylinder" anyway, which the explicit
 *  pattern below catches. */
const LAYOUT_BADGE_RE = /\b([VWIHF])[- ]?(\d{1,2})\b/gi;

/** An unambiguous spelled-out count: "4-Cylinder", "6 Cyl", "8-cyl". */
const SPELLED_COUNT_RE = /\b(\d{1,2})\s*-?\s*cyl(?:inder)?s?\b/gi;

/** Displacement in litres: "3.7L", "2.5 L", "3.5 Liter", "1.8 litres". */
const DISPLACEMENT_RE =
  /\b(\d{1,2}(?:\.\d{1,2})?)\s*(?:L|Liters?|Litres?)\b/i;

/** Nothing sold at retail in the United States falls outside this. A value
 *  beyond it means the pattern matched something that is not a cylinder
 *  count, so we emit nothing rather than a number we cannot defend. */
const MIN_CYLINDERS = 2;
const MAX_CYLINDERS = 16;

/** Same idea for displacement: below a Smart fortwo, above a Viper, the
 *  match is noise. */
const MIN_LITRES = 0.6;
const MAX_LITRES = 8.5;

function collect(re: RegExp, text: string, group: number): number[] {
  // Fresh lastIndex each call — these are module-level /g regexes.
  re.lastIndex = 0;
  const out: number[] = [];
  for (const m of text.matchAll(re)) {
    const n = Number(m[group]);
    if (Number.isInteger(n)) out.push(n);
  }
  return out;
}

/**
 * Cylinder count, or null when the string does not unambiguously carry one.
 *
 * Returns null — never a guess — when:
 *   - no layout badge and no spelled-out count is present ("2.3L 4V ...")
 *   - the value is outside {@link MIN_CYLINDERS}..{@link MAX_CYLINDERS}
 *   - two readings disagree ("V6 4-Cylinder"), which means the source
 *     string is wrong and picking a winner would launder that into a
 *     confident claim
 */
export function engineCylinders(
  engine: string | null | undefined
): number | null {
  if (!engine) return null;

  const found = [
    ...collect(LAYOUT_BADGE_RE, engine, 2),
    ...collect(SPELLED_COUNT_RE, engine, 1),
  ].filter((n) => n >= MIN_CYLINDERS && n <= MAX_CYLINDERS);

  if (found.length === 0) return null;
  // Contradiction -> nothing. See the doc comment above.
  if (found.some((n) => n !== found[0])) return null;
  return found[0];
}

/**
 * Displacement rendered the way Vast's sample feed writes it — "3.0 L" —
 * or null when the string carries no defensible litre figure.
 */
export function engineDisplacement(
  engine: string | null | undefined
): string | null {
  if (!engine) return null;
  const m = DISPLACEMENT_RE.exec(engine);
  if (!m) return null;
  const litres = Number(m[1]);
  if (!Number.isFinite(litres)) return null;
  if (litres < MIN_LITRES || litres > MAX_LITRES) return null;
  // Normalize "2.5" and "2.50" to one decimal place, matching how the
  // sample and every window sticker write it.
  return `${litres.toFixed(1)} L`;
}

/**
 * Cylinder count for a feed: the DMS's stored vPIC value when it has one,
 * otherwise the guarded reading of the free-text engine string.
 *
 * Order matters. The stored column is the decode's own answer and is right
 * where the prose is ambiguous — stock 11331 reads "2.3L 4V Premium Fuel"
 * and stores 4. The derivation is not redundant underneath it: stock 10976
 * is the inverse, with an EMPTY column and "2.5L 4-Cylinder" in the text.
 * Neither source covers the lot on its own.
 *
 * 0 counts as absent. The Railway schema allows ge=0, and a zero-cylinder
 * car is a null we would otherwise publish as a number.
 */
export function resolveCylinders(
  stored: number | null | undefined,
  engine: string | null | undefined
): number | null {
  if (
    typeof stored === "number" &&
    Number.isInteger(stored) &&
    stored >= MIN_CYLINDERS &&
    stored <= MAX_CYLINDERS
  ) {
    return stored;
  }
  return engineCylinders(engine);
}

/**
 * Displacement for a feed, normalized to the "3.7 L" form Vast's sample
 * uses. Runs the stored value through the same parser rather than trusting
 * its formatting: Railway writes "3.7L" (no space), and passing it through
 * both normalizes the spacing and range-checks it in one step.
 */
export function resolveDisplacement(
  stored: string | null | undefined,
  engine: string | null | undefined
): string | null {
  return engineDisplacement(stored) ?? engineDisplacement(engine);
}

/** Interior materials worth reporting as a separate field. Matched as whole
 *  words against the interior COLOUR string, because that is where the DMS
 *  actually records them today ("Black Leather", "Black Cloth"). */
const INTERIOR_MATERIALS = [
  "Leatherette",
  "Leather",
  "Alcantara",
  "Suede",
  "Fabric",
  "Cloth",
  "Vinyl",
] as const;

/**
 * Interior material pulled out of the interior-colour string, or null.
 *
 * "Black Leather" -> "Leather". "Tan" -> null. Deliberately does NOT alter
 * the colour field it read from: the colour is published verbatim as the
 * DMS holds it, so the two fields can be reconciled against each other and
 * nothing is silently rewritten on the way out.
 *
 * "Leatherette" is checked before "Leather" — first match wins and
 * leatherette is not leather, which is a claim a buyer can act on.
 */
export function interiorMaterial(
  interiorColor: string | null | undefined
): string | null {
  if (!interiorColor) return null;
  for (const material of INTERIOR_MATERIALS) {
    const re = new RegExp(`(?<![A-Za-z])${material}(?![A-Za-z])`, "i");
    if (re.test(interiorColor)) return material;
  }
  return null;
}
