/**
 * Detect a vehicle description that quotes a dollar figure contradicting
 * the vehicle's actual current price — e.g. "at $7,999, this one won't sit
 * long" still displayed after a real price drop to $5,999.99.
 *
 * Found in the website audit: a live VDP was showing two different prices
 * for the same car at once — the real price everywhere structured (page
 * price, JSON-LD Offer.price, the feeds) and a stale one baked into the
 * free-text description, because nothing regenerates a description when
 * the price changes later. That's a DMS data-entry problem this repo
 * can't fix at the source, but it can stop rendering the contradiction:
 * every consumer of a vehicle's description (JSON-LD, the Overview tab)
 * should route through this guard first.
 *
 * Deliberately narrow: only flags a dollar figure introduced by a phrase
 * that reads as THE asking price ("at $X", "for $X", "just $X", "only $X",
 * "priced at $X") — not any dollar figure anywhere in the text. A
 * description mentioning an unrelated figure ("compare to $30,000 new")
 * uses different phrasing and won't match; catching every possible way a
 * price could be referenced isn't achievable with a regex, so this
 * accepts a false negative there in exchange for never flagging a
 * legitimate comparison price as wrong.
 */

const PRICE_PHRASE_RE =
  /\b(?:at|for|just|only|priced at)\s*\$\s?([\d,]+(?:\.\d{2})?)/gi;

/** Dollar figures within this much of the real price are treated as a
 *  match (rounding / whole-vs-cents display differences), not a conflict. */
const TOLERANCE = 50;

export function descriptionContradictsPrice(
  description: string | null | undefined,
  price: number | null | undefined
): boolean {
  if (!description || !price || price <= 0) return false;
  for (const m of description.matchAll(PRICE_PHRASE_RE)) {
    const n = Number(m[1].replace(/,/g, ""));
    if (Number.isFinite(n) && Math.abs(n - price) > TOLERANCE) return true;
  }
  return false;
}

/** Convenience wrapper: returns the description unchanged, or null when it
 *  contradicts the given price. */
export function safeDescription<T extends string | null | undefined>(
  description: T,
  price: number | null | undefined
): T | null {
  if (descriptionContradictsPrice(description, price)) return null;
  return description;
}
