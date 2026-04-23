/**
 * Build-time validator: every available vehicle must have an entry in
 * PHOTO_ORDER. Run this as part of the prebuild step.
 *
 * Why: photoOrder.ts is the only thing keeping dashboards from becoming
 * VDP heroes again. If a new vehicle arrives and no one adds it to the
 * manifest, it'll ship with whatever Dealer Center exported as image #1
 * — which is almost always wrong (dashboard, interior, etc.).
 *
 * This script crashes the build if any available vehicle lacks a
 * manifest entry. Harsh but correct: no car should go live without
 * verified photo ordering.
 *
 * To bypass in an emergency, set PHOTO_ORDER_BYPASS=1 — you'll get
 * warnings instead of a hard fail. Don't rely on that for long.
 */

import { sampleInventory } from "../src/data/inventory";
import { PHOTO_ORDER } from "../src/data/photoOrder";

const ANSI_RED = "\x1b[31m";
const ANSI_YELLOW = "\x1b[33m";
const ANSI_GREEN = "\x1b[32m";
const ANSI_RESET = "\x1b[0m";

function main() {
  const available = sampleInventory.filter((v) => v.status === "available");
  const missing: string[] = [];
  const ok: string[] = [];

  for (const v of available) {
    // Pull the folder slug from the first image path (same logic as
    // applyPhotoOrder). Vehicles with no images get skipped with a note.
    if (!v.images || v.images.length === 0) {
      console.warn(
        `${ANSI_YELLOW}⚠️  ${v.slug} has no images — skipping validation${ANSI_RESET}`
      );
      continue;
    }
    const match = v.images[0].match(/\/images\/inventory\/([^/]+)\//);
    const folderSlug = match?.[1];
    if (!folderSlug) {
      console.warn(
        `${ANSI_YELLOW}⚠️  ${v.slug} image paths don't match expected pattern — skipping${ANSI_RESET}`
      );
      continue;
    }
    if (PHOTO_ORDER[folderSlug]) {
      ok.push(v.slug);
    } else {
      missing.push(`${v.slug} (folder: ${folderSlug})`);
    }
  }

  console.log("");
  console.log(
    `${ANSI_GREEN}✓ ${ok.length} vehicle${ok.length === 1 ? "" : "s"} with verified photo order${ANSI_RESET}`
  );

  if (missing.length > 0) {
    const bypass = process.env.PHOTO_ORDER_BYPASS === "1";
    const color = bypass ? ANSI_YELLOW : ANSI_RED;
    console.log("");
    console.log(
      `${color}${bypass ? "⚠️" : "✗"} ${missing.length} vehicle${missing.length === 1 ? "" : "s"} missing from PHOTO_ORDER manifest:${ANSI_RESET}`
    );
    for (const m of missing) {
      console.log(`${color}    - ${m}${ANSI_RESET}`);
    }
    console.log("");
    console.log(
      `${color}Read docs/photo-arrangement-rules.md and add entries to${ANSI_RESET}`
    );
    console.log(
      `${color}src/data/photoOrder.ts before shipping. These vehicles${ANSI_RESET}`
    );
    console.log(
      `${color}will currently render with Dealer Center's native photo order${ANSI_RESET}`
    );
    console.log(
      `${color}— probably a dashboard or interior as the hero. That's${ANSI_RESET}`
    );
    console.log(
      `${color}a conversion leak.${ANSI_RESET}`
    );
    console.log("");

    if (!bypass) {
      console.log(
        `${color}Emergency bypass (not recommended): PHOTO_ORDER_BYPASS=1 npm run build${ANSI_RESET}`
      );
      console.log("");
      process.exit(1);
    }
  }
}

main();
