#!/usr/bin/env tsx
/**
 * Weekly hero contact-sheet generator (Tier 2 enforcement).
 *
 * Fetches live inventory, generates a single self-contained HTML page
 * showing every active vehicle's hero photo at 200px thumbnail size,
 * sorted oldest-on-lot first (where stale photos are most likely to
 * cause conversion loss).
 *
 * Jeremiah opens the file once a week and eyeballs in 2-3 minutes.
 * Anything that looks wrong gets flagged → fix in DealerCenter Media
 * tab → re-sync.
 *
 * This is the human safety net for cases the Anthropic Vision audit
 * misses (ambiguous front-3/4-vs-side-profile, photos that classify
 * correctly but look bad in context, etc.).
 *
 * Usage:
 *   tsx scripts/generate-hero-audit-html.ts
 *
 * Output: artifacts/hero-contact-sheet-YYYY-MM-DD.html
 *
 * Wire-up via scheduled-tasks MCP:
 *   - Trigger: every Monday 8:00 local time
 *   - Action: run this script, then email Jeremiah the path
 *
 * No API keys, no costs. Pure static-data render.
 */

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const DMS_URL = process.env.DMS_URL ?? "https://web-production-d5f3a.up.railway.app";
const INVENTORY_PATH = "/api/v1/public/inventory";
const SITE_URL = process.env.SITE_URL ?? "https://www.loveautogroup.net";

type LiveVehicle = {
  vin: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  status: string;
  daysOnLot?: number;
  price?: number;
  images: string[];
};

async function fetchInventory(): Promise<LiveVehicle[]> {
  const url = `${DMS_URL}${INVENTORY_PATH}`;
  const res = await fetch(url, { headers: { "User-Agent": "hero-audit-html/1.0" } });
  if (!res.ok) throw new Error(`Inventory fetch ${res.status}`);
  const body = (await res.json()) as { vehicles?: LiveVehicle[] } | LiveVehicle[];
  return Array.isArray(body) ? body : body.vehicles ?? [];
}

function escapeHtml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderPage(vehicles: LiveVehicle[]): string {
  // Sort: most days on lot first (most likely to have stale photo issues).
  const sorted = [...vehicles].sort(
    (a, b) => (b.daysOnLot ?? 0) - (a.daysOnLot ?? 0)
  );
  const today = new Date().toISOString().slice(0, 10);
  const totalWithPhotos = sorted.filter((v) => v.images?.length > 0).length;
  const totalNoPhotos = sorted.filter((v) => !v.images?.length).length;

  const cards = sorted
    .map((v) => {
      const hero = v.images?.[0];
      const label = `${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ""}`;
      const days = v.daysOnLot ?? 0;
      const dayBadgeColor =
        days >= 90 ? "#c00" : days >= 45 ? "#d80" : days >= 21 ? "#888" : "#080";
      const vdpUrl = `${SITE_URL}/inventory/${v.slug}`;
      return `
        <div class="card">
          <a href="${escapeHtml(vdpUrl)}" target="_blank" rel="noopener">
            ${
              hero
                ? `<img src="${escapeHtml(hero)}" alt="${escapeHtml(label)}" loading="lazy" />`
                : `<div class="no-photo">no photo</div>`
            }
          </a>
          <div class="meta">
            <div class="label">${escapeHtml(label)}</div>
            <div class="vin">${escapeHtml(v.vin)}</div>
            <div class="row">
              <span class="days" style="background:${dayBadgeColor}">${days}d</span>
              <span class="status">${escapeHtml(v.status)}</span>
            </div>
          </div>
        </div>`;
    })
    .join("\n");

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Hero contact sheet — ${today}</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; margin: 0; padding: 24px; background: #f5f5f5; color: #222; }
  h1 { margin: 0 0 8px; font-size: 22px; }
  .summary { color: #666; margin-bottom: 24px; font-size: 14px; }
  .summary strong { color: #222; }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px; }
  .card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.08); }
  .card a { display: block; line-height: 0; }
  .card img { width: 100%; height: 150px; object-fit: cover; display: block; }
  .card .no-photo { width: 100%; height: 150px; display: flex; align-items: center; justify-content: center; background: #eee; color: #aaa; font-size: 14px; }
  .meta { padding: 8px 10px 10px; }
  .label { font-size: 13px; font-weight: 600; line-height: 1.2; }
  .vin { font-size: 11px; color: #888; font-family: monospace; margin: 2px 0 6px; }
  .row { display: flex; gap: 6px; align-items: center; }
  .days { font-size: 11px; color: white; padding: 2px 6px; border-radius: 3px; font-weight: 600; }
  .status { font-size: 11px; color: #666; }
  .legend { margin-bottom: 16px; font-size: 12px; color: #666; }
  .legend .swatch { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin: 0 4px 0 12px; vertical-align: middle; }
</style>
</head>
<body>
<h1>Love Auto Group — Hero Contact Sheet</h1>
<div class="summary">
  Generated <strong>${today}</strong> — <strong>${sorted.length}</strong> vehicles
  (<strong>${totalWithPhotos}</strong> with photos, <strong>${totalNoPhotos}</strong> without).
  Sorted oldest-on-lot first.
</div>
<div class="legend">
  Days on lot:
  <span class="swatch" style="background:#080"></span>fresh (&lt;21)
  <span class="swatch" style="background:#888"></span>monitor (21-44)
  <span class="swatch" style="background:#d80"></span>aging (45-89)
  <span class="swatch" style="background:#c00"></span>stale (90+)
</div>
<div class="grid">
${cards}
</div>
<div style="margin-top: 32px; font-size: 12px; color: #999;">
  Click any thumbnail to open the live VDP. Anything that looks wrong
  (interior, dashboard, side profile, rear shot) needs to be fixed in
  DealerCenter Media tab → drag the correct front-3/4 to slot 1 → save.
  Next inventory sync will pull the corrected order.
</div>
</body>
</html>`;
}

async function main() {
  console.log(`[hero-html] fetching from ${DMS_URL}`);
  const vehicles = await fetchInventory();
  console.log(`[hero-html] ${vehicles.length} vehicles`);
  const html = renderPage(vehicles);
  const ts = new Date().toISOString().slice(0, 10);
  const outDir = path.resolve("artifacts");
  await mkdir(outDir, { recursive: true });
  const outPath = path.join(outDir, `hero-contact-sheet-${ts}.html`);
  await writeFile(outPath, html);
  console.log(`[hero-html] wrote ${outPath}`);
  console.log("");
  console.log(`Open: file://${outPath}`);
}

main().catch((e) => {
  console.error(`[hero-html] FATAL: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
