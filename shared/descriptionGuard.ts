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
 *
 * 2026-09-15: a SOLD vehicle's `price` argument is now always 0/null (the
 * asking price is hidden everywhere once a car sells — see
 * routers/public.py `_to_public_dict`). The old rule read "no real price to
 * compare against" as "assume the description is fine" — exactly backwards
 * for that case: a sold car's description almost always still says
 * "priced right at $X" from when it was for sale, and there is no live
 * figure left to confirm it against. When there is no usable price AND the
 * description makes a price claim, treat it as a contradiction rather than
 * let an unverifiable, near-certainly-stale number through.
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
  if (!description) return false;
  const matches = [...description.matchAll(PRICE_PHRASE_RE)];
  if (matches.length === 0) return false;

  // No live price to check the claim against (sold, or genuinely unpriced)
  // — an unverifiable price claim is treated as a contradiction, not a
  // pass. See the 2026-09-15 note above.
  if (!price || price <= 0) return true;

  for (const m of matches) {
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
