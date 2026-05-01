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
          // Block query-string filter variants of /inventory. The static
          // export serves th