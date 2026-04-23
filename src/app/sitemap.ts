/**
 * Site sitemap — Next.js native, regenerated on every build.
 *
 * Includes static marketing pages, the inventory index, every individual
 * VDP, every blog post, and the new SEO landing pages (make-specific +
 * service area). Cloudflare Pages serves this at /sitemap.xml.
 *
 * Charlotte's note: when the legacy site cuts over, also submit this URL
 * to Google Search Console + Bing Webmaster Tools manually so the new
 * structure gets indexed quickly.
 */

import type { MetadataRoute } from "next";
import { sampleInventory } from "@/data/inventory";
import { blogPosts } from "@/data/blog";

// Required for static export.
export const dynamic = "force-static";

const BASE = "https://www.loveautogroup.net";

export default function sitemap(): MetadataRoute.Sitemap {
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
    { url: `${BASE}/blog`, lastModified: now, changeFrequency: "weekly", priority: 0.6 },
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

  // Per-vehicle VDPs — only available stock (no point indexing sold)
  const vehiclePages: MetadataRoute.Sitemap = sampleInventory
    .filter((v) => v.status !== "sold")
    .map((v) => ({
      url: `${BASE}/inventory/${v.slug}/`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  // Blog posts
  const blogPages: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE}/blog/${post.slug}/`,
    lastModified: post.date ? new Date(post.date) : now,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticPages, ...landingPages, ...vehiclePages, ...blogPages];
}
