/**
 * Site sitemap — Next.js native, regenerated on every build.
 *
 * Includes static marketing pages, the inventory index, every individual
 * VDP, and the new SEO landing pages (make-specific + service area).
 * Cloudflare Pages serves this at /sitemap.xml.
 *
 * Blog removed Apr 2026 — content preserved in src/data/blog.ts, routes
 * deleted. To restore: re-add the /blog index + [slug] route, re-import
 * blogPosts here, and re-add the blogPages section below.
 *
 * Charlotte's note: when the legacy site cuts over, also submit this URL
 * to Google Search Console + Bing Webmaster Tools manually so the new
 * structure gets indexed quickly.
 */

import type { MetadataRoute } from "next";
import { sampleInventory } from "@/data/inventory";
import { fetchDmsInventory } from "@/lib/dmsInventory";

// Required for static export.
export const dynamic = "force-static";

const BASE = "https://www.loveautogroup.net";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Static marketing/info pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${BASE}/`, lastModified: now, changeFrequency: "daily", priority: 1.0 },
    { url: `${BASE}/inventory`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${BASE}/financing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/faq`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/sell-your-car`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/privacy-policy`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${BASE}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  // SEO landing pages — make-specific + service area + Carfax + body style.
  // Listed in sitemap so Google can discover and rank them quickly.
  const landingPages: MetadataRoute.Sitemap = [
    // Makes — Japanese specialist positioning
    { url: `${BASE}/inventory/used-subaru`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/inventory/used-lexus`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/inventory/used-acura`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/inventory/used-mazda`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE}/inventory/used-honda`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    // Body styles
    { url: `${BASE}/inventory/used-suvs`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE}/inventory/used-sedans`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    // Service areas — adjacent towns within 10 miles
    { url: `${BASE}/serving/lombard-il`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/serving/elmhurst-il`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/serving/oak-brook-il`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/serving/glen-ellyn-il`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${BASE}/serving/addison-il`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    // Differentiator landing
    { url: `${BASE}/free-carfax-villa-park`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
  ];

  // Per-vehicle VDPs — union of seed-known slugs and the live DMS list
  // so live-only vehicles are sitemap'd as soon as they hit DealerCenter.
  // DMS fetch is best-effort: on failure we still ship the seed list.
  const live = await fetchDmsInventory().catch(() => []);
  const slugs = new Map<string, string>(); // slug → status
  for (const v of sampleInventory) {
    if (v.status !== "sold") slugs.set(v.slug, v.status);
  }
  for (const v of live) {
    if (v.status !== "sold") slugs.set(v.slug, v.status);
  }
  const vehiclePages: MetadataRoute.Sitemap = Array.from(slugs.keys()).map(
    (slug) => ({
      url: `${BASE}/inventory/${slug}/`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })
  );

  return [...staticPages, ...landingPages, ...vehiclePages];
}
