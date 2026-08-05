import { resolveIndexableVehicles } from "@/lib/dmsInventory";

/**
 * E7 — /sitemap-vehicles.xml
 *
 * This URL has been advertised by robots.txt + the sitemap index since
 * the W-era SEO work but NEVER EXISTED (it 404'd in production — found
 * 2026-07-17 during the Phase D verification). This route generates it
 * for real at build time so every live VDP is enumerated for crawlers.
 *
 * Found in the website audit: this used to read sampleInventory directly
 * with none of sitemap.ts's protections — no live/seed intersection to
 * drop sold cars, no dead-slug denylist, no hidden-VIN exclusion, and on
 * a missing/malformed build snapshot sampleInventory itself silently
 * falls back to hardcoded seed vehicles from the original site launch.
 * That's the exact "sold car stays indexed" incident class sitemap.ts was
 * specifically hardened against, reintroduced in a second, weaker,
 * independently-maintained implementation. Now shares the one protected
 * vehicle list sitemap.ts uses (src/lib/dmsInventory.ts) instead of
 * duplicating the logic.
 *
 * Static export: force-static emits this once per build. The prebuild
 * snapshot fetch (Phase A) refreshes the data on every deploy, and the
 * DMS triggers a deploy on every public-visible inventory change — so
 * the sitemap tracks the lot within minutes of a change.
 */

export const dynamic = "force-static";

const SITE = "https://www.loveautogroup.net";

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const indexable = await resolveIndexableVehicles();

  const urls = indexable
    .map((v) => {
      const loc = xmlEscape(`${SITE}/inventory/${v.slug}/`);
      const img = v.heroImageUrl;
      const imageTag =
        img && img.startsWith("http")
          ? `\n    <image:image><image:loc>${xmlEscape(img)}</image:loc></image:image>`
          : "";
      return `  <url>\n    <loc>${loc}</loc>\n    <changefreq>daily</changefreq>\n    <priority>0.8</priority>${imageTag}\n  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
