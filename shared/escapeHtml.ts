/**
 * escapeHtml — HTML-escaping for values interpolated into markup strings.
 *
 * Almost everything on this site is rendered by React, which escapes for
 * you. The exception is `functions/inventory/[slug].ts`, the Pages Function
 * that hand-builds HTML for VDP requests at the edge. That file dropped
 * DMS-authored fields (make, model, trim, colour, photo URLs) straight into
 * both text nodes and quoted attributes with no escaping, and the repo had
 * no escaping helper anywhere to reach for.
 *
 * Two distinct problems that guards against:
 *
 *   1. Broken markup from ordinary data. A trim or colour containing a
 *      double quote — `5" Lift`, `Pearl "Sport" White` — terminates the
 *      attribute it lands in and corrupts the rest of the tag. This is the
 *      likely-in-practice failure, not a hypothetical one.
 *   2. Stored XSS. The DMS is authenticated, so this isn't directly
 *      internet-controlled, but vehicle records also absorb VIN-decoder and
 *      feed data, and "the CMS is trusted" is exactly the assumption stored
 *      XSS lives on. Escaping at the sink is the cheap, durable answer.
 *
 * `escapeHtml` covers text content and quoted attribute values alike (it
 * escapes both quote characters, so it's safe in either position).
 */

const HTML_ENTITIES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

/**
 * Escape a value for interpolation into HTML text or a quoted attribute.
 * Non-string input is coerced; null/undefined become "".
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[&<>"']/g, (ch) => HTML_ENTITIES[ch]);
}

/**
 * Escape a URL destined for an href/src/content attribute.
 *
 * Beyond entity-escaping, this refuses non-http(s) schemes — `javascript:`
 * and `data:` URLs are script-execution vectors in an href, and no photo or
 * canonical URL here has any business using one. A rejected URL returns ""
 * so the caller's existing falsy checks drop the attribute entirely.
 */
export function escapeUrl(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw = String(value).trim();
  if (!raw) return "";
  // Reject anything that isn't plainly http(s) or root-relative.
  const isSafe =
    /^https?:\/\//i.test(raw) || (raw.startsWith("/") && !raw.startsWith("//"));
  if (!isSafe) return "";
  return escapeHtml(raw);
}
