#!/usr/bin/env node
/**
 * Fail the BUILD when public/_redirects grows past what Cloudflare Pages
 * actually honours.
 *
 * WHY THIS EXISTS
 * ----------------
 * Cloudflare's docs promise 2,000 static + 100 dynamic redirects. Measured on
 * this site (2026-07-28, commit 3164b89): rules 1-114 fired and every rule past
 * ~114 was SILENTLY DROPPED — green build, successful deploy, no log line, and
 * only 9 of 31 target URLs redirecting. Dynamic rules (a `:placeholder` or `*`)
 * ran out at 13 in practice. See the "CLOUDFLARE PAGES SILENTLY IGNORES
 * `_redirects` RULES PAST ~114" rule in C:\Claude AI\CLAUDE.md.
 *
 * Sold and archived cars no longer need a rule each — the `/inventory/*` Pages
 * Function answers them (410 / redirect) — so the file should stay small. This
 * check is what keeps it small: a green build is otherwise no evidence at all.
 *
 * Limits: 100 rules total, 12 dynamic. Comments and blank lines are free.
 * Runs in `npm run prebuild`, so every Cloudflare Pages build runs it.
 *
 *   node scripts/check-redirects-count.mjs [path/to/_redirects]
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const MAX_TOTAL = 100;
export const MAX_DYNAMIC = 12;

/** A rule is any non-blank, non-comment line. Dynamic = placeholder or splat in the SOURCE. */
export function countRedirects(text) {
  let total = 0;
  let dynamic = 0;
  const dynamicRules = [];
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    total++;
    const source = line.split(/\s+/)[0];
    if (source.includes("*") || /(^|\/):[A-Za-z_]/.test(source)) {
      dynamic++;
      dynamicRules.push(source);
    }
  }
  return { total, dynamic, dynamicRules };
}

export function checkRedirects(text) {
  const c = countRedirects(text);
  const problems = [];
  if (c.total > MAX_TOTAL) {
    problems.push(`${c.total} redirect rules (limit ${MAX_TOTAL}). Cloudflare Pages silently drops rules past ~114.`);
  }
  if (c.dynamic > MAX_DYNAMIC) {
    problems.push(`${c.dynamic} dynamic rules (limit ${MAX_DYNAMIC}): ${c.dynamicRules.join(", ")}.`);
  }
  return { ...c, problems };
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const file = process.argv[2] ?? "public/_redirects";
  const result = checkRedirects(readFileSync(file, "utf8"));
  if (result.problems.length) {
    console.error(`\n✖ ${file}:`);
    for (const p of result.problems) console.error(`  - ${p}`);
    console.error(
      "\n  Prefer exact static rules over wildcards, and let the /inventory/* Pages Function\n" +
        "  handle sold / archived cars instead of adding a rule per car. See the Cloudflare\n" +
        "  `_redirects` rule in C:\\Claude AI\\CLAUDE.md before raising these limits.\n",
    );
    process.exit(1);
  }
  console.log(`✓ ${file}: ${result.total} rules (limit ${MAX_TOTAL}), ${result.dynamic} dynamic (limit ${MAX_DYNAMIC}).`);
}
