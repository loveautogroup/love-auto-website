/**
 * Free-text vehicle matching for the inventory grid.
 *
 * WHY THIS EXISTS
 * ---------------
 * Searching "GS350" returned nothing. Models are stored with a space
 * ("GS 350"), and the grid required every whitespace-separated token to be a
 * literal substring of the joined fields — so the space defeated it. The
 * inverse is equally real: the Mercedes is stored "SLK350" with no space, so
 * "SLK 350" missed that one. The DATA is inconsistent, being hand-entered from
 * several sources, so normalising only the query cannot fix it.
 *
 * Every token is therefore matched twice: once as typed, and once with all
 * non-alphanumerics stripped from BOTH sides.
 *
 * ⚠️ Kept deliberately in sync with the same rule on the Railway backend
 * (routers/inventory.py) and in the DMS apps, so a query behaves the same
 * wherever it is typed. These are three separate repos with no shared package;
 * if you change the rule here, change it there too.
 */

/** Lowercase, keep only letters and digits. "GS 350" and "GS350" -> "gs350". */
export function collapse(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

/**
 * True when every whitespace-separated token of `query` appears in `fields` —
 * either literally, or after both sides are collapsed.
 *
 * An empty query matches everything, so callers need no separate guard.
 */
export function matchesVehicleSearch(
  query: string,
  fields: Array<string | number | null | undefined>,
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const parts = fields
    .filter((f) => f !== null && f !== undefined && f !== "")
    .map((f) => String(f).toLowerCase());

  const spaced = parts.join(" ");
  const collapsed = collapse(spaced);

  return q
    .split(/\s+/)
    .filter(Boolean)
    .every((token) => {
      if (spaced.includes(token)) return true;
      const ct = collapse(token);
      // A token of pure punctuation collapses to "" and `"".includes` is
      // always true, which would match every vehicle. Require a real token.
      return ct.length > 0 && collapsed.includes(ct);
    });
}
