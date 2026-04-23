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
        // /admin is the merchandising console — gated by Cloudflare Access
        // anyway, but no reason to invite crawlers in.
        disallow: ["/admin", "/admin/"],
      },
    ],
    sitemap: "https://www.loveautogroup.net/sitemap.xml",
    host: "https://www.loveautogroup.net",
  };
}
