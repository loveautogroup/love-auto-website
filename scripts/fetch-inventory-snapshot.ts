/**
 * Build-time gate: fetch the live inventory ONCE and write it to
 * src/data/inventory-snapshot.json.
 *
 * This is THE single inventory fetch for a build. Everything downstream
 * reads the file it writes:
 *   - src/data/inventory.ts   -> sampleInventory (static HTML, seed union)
 *   - src/lib/dmsInventory.ts -> fetchDmsInventory() (sitemap +
 *                                generateStaticParams + VDP bodies)
 * so sitemap.xml and the set of generated VDPs can no longer disagree.
 *
 * SOURCE CHANGED 2026-08-03. This used to read the Cloudflare Pages mirror
 * at www.loveautogroup.net/api/inventory. That mirror is a proxy with its
 * own 5s timeout and its own KV fallback, and Railway cold-starts run
 * 15-25s -- so a cold DMS made the mirror quietly serve a KV snapshot that
 * was SEVENTEEN DAYS stale. The 2026-08-03 build therefore baked 5
 * already-sold cars into sitemap.xml and the static inventory HTML while
 * omitting the newest car entirely. We now read the authoritative DMS feed
 * directly, with a timeout that actually accommodates a cold start.
 *
 * FAILS LOUDLY. A build that cannot read the lot exits non-zero instead of
 * silently reusing a months-old committed snapshot. On Cloudflare Pages a
 * failed build leaves the previous deployment serving, so this is strictly
 * safer than publishing a site that is missing real cars. Escape hatch for
 * a genuine emergency: ALLOW_STALE_INVENTORY_SNAPSHOT=1.
 *
 * Optional env:
 *   INVENTORY_SNAPSHOT_URL          override the feed URL (accepts either
 *                                   the DMS {data:[...]} shape or the
 *                                   mirror's {vehicles:[...]} shape)
 *   ALLOW_STALE_INVENTORY_SNAPSHOT  "1" to warn instead of failing
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import {
  adaptDmsVehicle,
  DMS_PUBLIC_INVENTORY_URL,
} from "../src/lib/dmsInventory";
import type { SyncedVehicle } from "../src/lib/inventoryAdapter";

const FEED_URL = process.env.INVENTORY_SNAPSHOT_URL ?? DMS_PUBLIC_INVENTORY_URL;

// fileURLToPath, NOT `new URL(...).pathname`. On Windows the latter yields
// "/C:/Claude%20AI/..." — a leading slash and percent-encoded spaces — so
// path.resolve produced "C:\\C:\\Claude%20AI\\..." and every write ENOENT'd.
// Harmless on the Linux CF Pages builder, which is why it survived; it meant
// the script could never be verified locally.
const OUTPUT_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../src/data/inventory-snapshot.json"
);

// Railway free-tier hibernation cold-start runs 15-25s. The old 30s here was
// fine; the 5s inside the Pages-Function mirror was the actual problem.
const TIMEOUT_MS = 30_000;
const ATTEMPTS = 4;

async function fetchOnce(attempt: number): Promise<SyncedVehicle[]> {
  // Retries bust any intermediate cache -- a 200-but-empty throttle response
  // is cacheable, and replaying it would defeat the whole retry loop.
  const url = attempt === 1 ? FEED_URL : `${FEED_URL}?_retry=${attempt}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
  if (!res.ok) throw new Error(`HTTP ${res.status} from ${url}`);
  const body = (await res.json()) as {
    data?: unknown[];
    vehicles?: SyncedVehicle[];
  };

  let vehicles: SyncedVehicle[];
  if (Array.isArray(body?.data)) {
    // Authoritative DMS shape -- map through the SAME adapter the rest of
    // the site uses, so the snapshot is byte-comparable with a live fetch.
    vehicles = (body.data as Parameters<typeof adaptDmsVehicle>[0][])
      .filter((v) => v && v.vin && v.year && v.make && v.model)
      .map(adaptDmsVehicle);
  } else if (Array.isArray(body?.vehicles)) {
    vehicles = body.vehicles;
  } else {
    throw new Error("malformed payload: neither `data` nor `vehicles` array");
  }

  // ZERO IS NOT AN ANSWER. Railway's shared read rate-limit returns empty
  // rather than erroring under throttle (CLAUDE.md, S65), so an empty lot
  // and a throttled request are identical on the wire. Love Auto always has
  // stock; treat empty as transient and retry.
  if (vehicles.length === 0) throw new Error("upstream returned ZERO vehicles");

  return vehicles;
}

async function main() {
  let vehicles: SyncedVehicle[] | null = null;

  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    try {
      vehicles = await fetchOnce(attempt);
      console.log(
        `[fetch-inventory-snapshot] read ${vehicles.length} vehicles from ` +
          `${FEED_URL} (attempt ${attempt}).`
      );
      break;
    } catch (err) {
      console.warn(
        `\x1b[33m[fetch-inventory-snapshot] attempt ${attempt}/${ATTEMPTS} failed: ${String(err)}\x1b[0m`
      );
      if (attempt < ATTEMPTS) {
        await new Promise((r) => setTimeout(r, attempt * 5_000));
      }
    }
  }

  if (vehicles) {
    // Write is deliberately OUTSIDE the retry loop: a filesystem error is not
    // an upstream outage and must not be retried or reported as one.
    const snapshot = {
      syncedAt: new Date().toISOString(),
      syncedBy: "cron" as const,
      vehicles,
    };
    fs.writeFileSync(OUTPUT_PATH, JSON.stringify(snapshot, null, 2) + "\n");
    console.log(
      `\x1b[32m[fetch-inventory-snapshot] wrote ${vehicles.length} vehicles ` +
        `to ${OUTPUT_PATH}\x1b[0m`
    );
    console.log(
      `[fetch-inventory-snapshot] stock: ${vehicles
        .map((v) => v.stockNumber || v.vin)
        .join(", ")}`
    );
    return;
  }

  const banner = [
    "",
    "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
    "!! [fetch-inventory-snapshot] CANNOT READ LIVE INVENTORY",
    `!! ${ATTEMPTS} attempts against ${FEED_URL} all failed.`,
    "!! The committed snapshot may be MONTHS stale. Building on it would",
    "!! publish sold cars and omit new arrivals -- the exact failure that",
    "!! 404'd the newest vehicle on 2026-08-03.",
    "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
    "",
  ].join("\n");

  if (process.env.ALLOW_STALE_INVENTORY_SNAPSHOT === "1") {
    console.warn(`\x1b[33m${banner}\x1b[0m`);
    console.warn(
      "[fetch-inventory-snapshot] ALLOW_STALE_INVENTORY_SNAPSHOT=1 -- " +
        "continuing with the committed snapshot anyway."
    );
    return;
  }

  console.error(`\x1b[31m${banner}\x1b[0m`);
  console.error(
    "[fetch-inventory-snapshot] FAILING THE BUILD. Cloudflare Pages keeps " +
      "the previous deployment live, so the site stays up. Check Railway " +
      "(https://web-production-d5f3a.up.railway.app/healthz), then redeploy. " +
      "To ship anyway, set ALLOW_STALE_INVENTORY_SNAPSHOT=1."
  );
  process.exit(1);
}

void main();
