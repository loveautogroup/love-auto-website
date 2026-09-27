/**
 * DEV-ONLY read-proxy target.
 *
 * `next dev` runs no Cloudflare Pages Functions runtime, so the site's own
 * `/api/inventory` and `/api/merchandising` (both GET, read-only, no auth,
 * CORS-open per functions/api/*.ts) 404 locally — every page falls back to
 * the last-committed build snapshot, losing live inventory + merchandising
 * overlays while previewing.
 *
 * In development ONLY, these two reads are prefixed with the production
 * origin so a local preview shows real, current data. `process.env
 * .NODE_ENV` is inlined by Next at build time, so a production `next build`
 * for the static export always resolves this to `""` — dead code eliminated
 * from the shipped bundle, never a runtime branch that could point a real
 * visitor's browser at the live site.
 *
 * NEVER apply this to a write endpoint (leads, credit-app, sell-your-car,
 * vehicle-alerts, chat POST, admin/*) — a stray click while previewing
 * locally must never file a real lead, message, or admin action against
 * production. Read-only GETs only.
 */
export const DEV_READ_API_BASE: string =
  process.env.NODE_ENV === "development" ? "https://www.loveautogroup.net" : "";
