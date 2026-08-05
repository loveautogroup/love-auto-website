/**
 * Site sitemap — Next.js native, regenerated on every build.
 *
 * Includes static marketing pages, the inventory index, every individual
 * VDP, and the new SEO landing pages (make-specific + service area).
 * Cloudflare Pages serves this at /sitemap.xml.
 *
 * Trailing-slash policy: every URL emitted here ends in `/`. This matches
 * `trailingSlash: true` in next.config.ts and the `<route>/index.html`
 * artifacts the static export actually produces. Earlier builds emitted
 * no-slash URLs which Cloudflare/Chrome reported as "Redirect was
 * cancelled" because the runtime redirected them to the slash form
 * (regression fixed 2026-04-30).
 *
 * Live-DMS integration: THE LIVE FEED IS AUTHORITATIVE. Both the slug list
 * here and generateStaticParams in /inventory/[slug]/page.tsx read the same
 * fetchDmsInventory() build snapshot, so sitemap.xml and the set of pages
 * that actually exist cannot disagree. They did on 2026-08-03: sitemap.xml
 * advertised the newest car while its page was never generated, and the URL
 * 404'd.
 *
 * RETAIL_READY (alias "available") and DEAL_PENDING ("sale-pending") are the
 * only statuses indexed — sold and coming-soon vehicles are deliberately
 * excluded so Google doesn't waste crawl budget on inventory we won't be
 * advertising.
 *
 * Seed slugs (sampleInventory) are emitted ONLY when they also appear in the
 * live feed. A seed vehicle the DMS no longer lists has been sold and simply
 * disappears from the feed — its status never flips to "sold", so
 * INDEXABLE_STATUSES cannot catch it and the intersection is what removes it.
 * That is how 5 sold cars (11408 / 11360 / 11356 / 11348 / 11344) were still
 * being advertised weeks after they left the lot.
 *
 * Only when the live feed is UNAVAILABLE (empty result) do we fall back to
 * the seed union, so an upstream outage still ships a usable sitemap rather
 * than crashing the build.
 *
 * Blog removed Apr 2026 — content preserved in src/data/blog.ts, routes
 * deleted. To restore: re-add the /blog index + [slug] route, re-import
 * blogPosts here, and re-add the blogPages section below.
 */

import type { MetadataRoute } from "next";
import { resolveIndexableVehicles } from "@/lib/dmsInventory";

// Required for static export.
export const dynamic = "force-static";

const BASE = "https://www.loveautogroup.net";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ── Static marketing/info pages ──────────────────────────────────
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`,                       lastModified: now, changeFrequency: "daily",   priority: 1.0 },
    { url: `${BASE}/inventory/`,             lastModified: now, changeFrequency: "daily",   priority: 0.9 },
    { url: `${BASE}/financing/`,             lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/about/`,                 lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/faq/`,                   lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contact/`,               lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/sell-your-car/`,         lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/reviews/`,               lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/privacy-policy/`,        lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
    { url: `${BASE}/terms/`,                 lastModified: now, changeFrequency: "yearly",  priority: 0.2 },
  ];

  // ── SEO landing pages — make + body style + service area + Carfax ──
  const landingPages: MetadataRoute.Sitemap = [
    // Makes — Japanese specialist positioning
    { url: `${BASE}/inventory/used-subaru/`,   lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/inventory/used-lexus/`,    lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/inventory/used-acura/`,    lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/inventory/used-mazda/`,    lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${BASE}/inventory/used-honda/`,    lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    // Body styles
    { url: `${BASE}/inventory/used-suvs/`,     lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/inventory/used-sedans/`,   lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    // Brand landing pages — short-form variants at /brands/{slug}/, content
    // from Mark's 5-brand rewrite (task #19). Distinct from the longer-form
    // /inventory/used-{slug}/ pages above. /brands/ is the parent index hub.
    { url: `${BASE}/brands/`,                  lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/brands/honda/`,            lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/brands/subaru/`,           lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/brands/lexus/`,            lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/brands/acura/`,            lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/brands/mazda/`,            lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    { url: `${BASE}/brands/toyota/`,           lastModified: now, changeFrequency: "weekly",  priority: 0.7 },
    // Service areas — adjacent towns within 10 miles
    { url: `${BASE}/serving/lombard-il/`,         lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/serving/elmhurst-il/`,        lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/serving/oak-brook-il/`,       lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/serving/glen-ellyn-il/`,      lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/serving/addison-il/`,         lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // 2026-07-27 (Anna gap-zone) — these four town pages have existed in
    // SERVICE_AREAS and built fine, but were never listed here. GSC URL
    // Inspection reported all four as "URL is unknown to Google": never
    // discovered, never crawled, zero impressions. Sitemap omission was the
    // only cause. Wheaton alone is a 53k-population town.
    { url: `${BASE}/serving/wheaton-il/`,         lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/serving/westmont-il/`,        lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/serving/lisle-il/`,           lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/serving/downers-grove-il/`,   lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // County hub — 2026-05-02, closes the AEO Q4 gap (every engine missed
    // us on "best used car dealer in DuPage County")
    { url: `${BASE}/serving/dupage-county-il/`,   lastModified: now, changeFrequency: "weekly",  priority: 0.85 },
    // Buying guides — 2026-05-02, closes the AEO Q5 / Q6 gaps (every
    // engine surfaces only franchise dealers on Subaru-near-Chicago and
    // Lexus-in-Chicago-suburbs queries)
    { url: `${BASE}/buying-guides/used-subaru-near-chicago/`,  lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/buying-guides/used-lexus-dupage-county/`,  lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    // 2026-05-05 — closes the AEO Q8 gap (engines were returning JDM importers
    // for "Japanese car dealer near Chicago" instead of independent US-market dealers)
    { url: `${BASE}/buying-guides/independent-japanese-makes-dealer-chicago/`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    // Differentiator landing
    { url: `${BASE}/free-carfax-villa-park/`,  lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // Geo keyword landing — "used cars villa park il" cluster (pos 12.3, 360 imp)
    // Created 2026-06-03. Targets: "used cars villa park il", "used cars villa park",
    // "villa park car dealerships", "villa park dealership". Exact-match URL
    // mirrors Premium Motors' title-tag strategy that holds #1-2 for this cluster.
    { url: `${BASE}/used-cars-villa-park-il/`, lastModified: now, changeFrequency: "weekly",  priority: 0.9 },
  ];

  // ── Per-vehicle VDPs ─────────────────────────────────────────────
  // Union of seed-known slugs and the live DMS list, filtered to
  // INDEXABLE_STATUSES + KNOWN_DEAD_SLUGS + the KV hidden overlay, with
  // lastModified preferring DMS dateInStock when available. Shared with
  // sitemap-vehicles.xml so both routes agree on "what counts as
  // indexable" by construction (src/lib/dmsInventory.ts).
  const indexable = await resolveIndexableVehicles();

  const vehiclePages: MetadataRoute.Sitemap = indexable.map((v) => ({
    url: `${BASE}/inventory/${v.slug}/`,
    lastModified: v.lastModified,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  // Printed so a future divergence is one grep away: this count must match
  // the [generateStaticParams] line emitted by /inventory/[slug]/page.tsx.
  console.log(`[sitemap] ${vehiclePages.length} vehicle URLs`);

  return [...staticPages, ...landingPages, ...vehiclePages];
}
