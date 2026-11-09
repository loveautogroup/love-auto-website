#!/usr/bin/env node
/**
 * Fail the build when a static folder under src/app/inventory/ is missing from
 * NON_VDP_INVENTORY_SEGMENTS in src/lib/localeRoutes.ts. Such a folder is a
 * landing page, not a car, and the language switcher would otherwise link it
 * to a /es/ twin that does not exist (404).
 */
import { readFileSync, readdirSync } from "node:fs";

const src = readFileSync("src/lib/localeRoutes.ts", "utf8");
const block = /NON_VDP_INVENTORY_SEGMENTS[^=]*=\s*\[([\s\S]*?)\]/.exec(src);
if (!block) {
  console.error("check-locale-routes: NON_VDP_INVENTORY_SEGMENTS not found");
  process.exit(1);
}
const listed = new Set([...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]));
const folders = readdirSync("src/app/inventory", { withFileTypes: true })
  .filter((d) => d.isDirectory() && !d.name.startsWith("[") && !d.name.startsWith("("))
  .map((d) => d.name);
const missing = folders.filter((f) => !listed.has(f));
if (missing.length) {
  console.error(`check-locale-routes: add to NON_VDP_INVENTORY_SEGMENTS: ${missing.join(", ")}`);
  process.exit(1);
}
console.log(`check-locale-routes: ${folders.length} inventory landing folders covered`);
