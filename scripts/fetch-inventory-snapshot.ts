/**
 * Build-time script: fetch the live inventory snapshot from the public
 * /api/inventory feed and write it to src/data/inventory-snapshot.json.
 *
 * Run as part of prebuild so the statically rendered homepage, inventory
 * list, and sitemap ship with the CURRENT inventory instead of a stale
 * hand-written snapshot. That removes the "flash of old cars" on first
 * load (the static HTML used to show a months-old list until the live
 * client fetch swapped it in).
 *
 * Fails safe: on any error it leaves the committed JSON untouched and
 * returns 0, so an upstream outage never blocks a Cloudflare Pages deploy.
 *
 * Optional env: INVENTORY_SNAPSHOT_URL (defaults to the prod feed).
 */

import * as fs from "fs";
import * as path from "path";

const FEED_URL =
  process.env.INVENTORY_SNAPSHOT_URL ??
  "https://www.loveautogroup.net/api/inventory";

const OUTPUT_PATH = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../src/data/inventory-snapshot.json"
);

async function fetchOnce(): Promise<{ vehicles: unknown[]; syncedAt?: string }> {
  const res = await fetch(FEED_URL, { signal: AbortSignal.timeout(30_000) });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${FEED_URL}`);
  const data = (await res.json()) as { vehicles?: unknown[]; syncedAt?: string };
  if (!data || !Array.isArray(data.vehicles) || data.vehicles.length === 0) {
    throw new Error("empty or malformed snapshot");
  }
  return data as { vehicles: unknown[]; syncedAt?: string };
}

async function main() {
  // S99 Phase A3 (2026-07-16): retry before surrendering to the committed
  // snapshot. The committed JSON can be MONTHS old — one transient blip at
  // build time used to bake "no stock" brand pages and stale prices into the
  // static HTML that crawlers (and every first paint) see. The upstream
  // mirror now returns a real 5xx on outage instead of 200-empty, so
  // failures are detectable and worth retrying.
  const ATTEMPTS = 4;
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      const data = await fetchOnce();
      fs.writeFileSync(OUTPUT_PATH, JSON.stringify(data, null, 2) + "\n");
      console.log(
        `\x1b[32m[fetch-inventory-snapshot] wrote ${data.vehicles.length} vehicles (synced ${data.syncedAt}).\x1b[0m`
      );
      return;
    } catch (err) {
      console.warn(
        `\x1b[33m[fetch-inventory-snapshot] attempt ${attempt}/${ATTEMPTS} failed: ${String(err)}\x1b[0m`
      );
      if (attempt < ATTEMPTS) {
        await new Promise((r) => setTimeout(r, attempt * 5_000));
      }
    }
  }
  console.warn(
    `\x1b[33m[fetch-inventory-snapshot] ALL ATTEMPTS FAILED — keeping the committed ` +
      `snapshot. WARNING: it may be months stale; static HTML (crawlers, first ` +
      `paint) will show old inventory until the next successful build.\x1b[0m`
  );
}

void main();
