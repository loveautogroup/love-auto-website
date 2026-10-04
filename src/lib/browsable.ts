/**
 * The ONE rule for "may a shopper see this car in the lists?"
 *
 * Owner ruling, 2026-10-04: sold cars stay on the site (own photos, SOLD, no
 * price) EXCEPT a sold car whose floor plan is still open stays off the lists
 * until it shows paid off. Railway sends `show_in_sold_list` (false while the
 * floor plan is open; true for non-sold cars). Undefined counts as shown so
 * nothing disappears before that field is live.
 *
 * LIST FILTER ONLY. A hidden car's own page (/inventory/<slug>/) is still
 * generated and still renders SOLD. Never use this to gate page generation,
 * the sitemap, or the feeds. VDP lookups read useInventory() directly.
 */
export function isBrowsable(v: {
  status?: string | null;
  showInSoldList?: boolean | null;
}): boolean {
  // Undefined/null counts as shown so the site never goes blank before the
  // Railway field is live.
  return v.status !== "sold" || v.showInSoldList !== false;
}
