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
          // 2026-05-07 — REMOVED the /inventory?* and /print/* blocks.
          // Both were causing recurring "Blocked by robots.txt" failures in
          // Search Console because Google had pre-existing index entries
          // for these legacy URLs from the CarsForSale era. Validate-fix
          // could not pass while we both indexed the URLs (in Google's
          // history) AND blocked them — the validator requires the URL
          // to be reachable.
          //
          // New strategy: let Google crawl them. The /inventory/ page
          // has <link rel="canonical" href=".../inventory/"> so all
          // query-string variants consolidate to the canonical URL.
          // Legacy /print/* URLs are 301'd to /inventory/ via
          // public/_redirects so they deindex with equity transfer.
        ],
      },
    ],
    sitemap: "https://www.loveautogroup.net/sitemap.xml",
    host: "https://www.loveautogroup.net",
  };
}
