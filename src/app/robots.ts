/**
 * robots.txt — Next.js native generator. Allows everything except admin
 * routes; references the sitemap so crawlers can find all pages quickly.
 */

import type { MetadataRoute } from "next";

// Required for static export.
export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          // /admin is the merchandising console, gated by Cloudflare Access
          // anyway, but no reason to invite crawlers in.
          "/admin",
          "/admin/",
          // 2026-05-05 — block /api/ explicitly. Pages Functions live under
          // this prefix and never want to be indexed (Charlotte SEO audit).
          "/api/",
          "/api/*",
          // Block query-string filter variants of /inventory. The static
          // export serves the same HTML regardless of filter params, so
          // letting Google crawl them just wastes crawl budget on duplicate
          // content. The canonical /inventory/ URL is what we want indexed.
          // Search Console flagged 294 of these on 2026-04-30 (legacy from
          // the CarsForSale era).
          "/inventory?*",
          "/inventory/?*",
          // Print views are CarsForSale-era artifacts that 404 on the
          // current site.
          "/print/",
          "/print/*",
        ],
      },
    ],
    sitemap: "https://www.loveautogroup.net/sitemap.xml",
    host: "https://www.loveautogroup.net",
  };
}
