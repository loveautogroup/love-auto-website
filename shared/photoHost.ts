/**
 * R2 photo host rewrite (Jun 6 2026). The bucket's pub-*.r2.dev development
 * URL is RATE-LIMITED by Cloudflare and 403s some non-browser fetchers —
 * root cause of GMC's "Unsupported image type [additional_image_link]"
 * warnings (Googlebot bursts got throttled and received HTML error pages).
 * photos.loveautogroup.net is the bucket's custom domain: no rate limit,
 * real CDN caching. Stored URLs keep the old host; callers rewrite at
 * render/feed time.
 *
 * Found in the website audit (2026-08): this lived only in
 * functions/_lib/feed.ts, applied to the outbound marketing feeds — the
 * website's OWN VDP rendering (JSON-LD, og:image, every on-page <img>) never
 * got the same rewrite and kept serving the rate-limited host. Moved here,
 * to the shared/ module both functions/ and src/ already pull slug and
 * display-case logic from, so both call sites use the same fix.
 */

const R2_DEV_HOST = "pub-bca02cfacd234bc68e6ad93b2ef61898.r2.dev";
const R2_CUSTOM_HOST = "photos.loveautogroup.net";

export function rewritePhotoHost(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  return url.replace(`://${R2_DEV_HOST}/`, `://${R2_CUSTOM_HOST}/`);
}
