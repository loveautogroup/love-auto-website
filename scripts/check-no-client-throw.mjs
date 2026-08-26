#!/usr/bin/env node
/**
 * Fail the BUILD if a build-time-only assertion made it into a CLIENT bundle.
 *
 * WHY THIS EXISTS
 * ---------------
 * On 2026-08-26 the entire site served "This page couldn't load" on every page
 * while the origin was perfectly healthy — 168KB of correct HTML, all 13
 * JS/CSS assets returning 200. Every ordinary uptime check passed, because
 * nothing was down.
 *
 * The cause was assertSnapshotFresh() in src/data/inventory.ts. It gated its
 * throw on `process.env.NODE_ENV === "production"` alone. That module is also
 * bundled into the client, where that is equally true — so a build-time
 * assertion ran in customers' browsers, threw during module evaluation, and
 * took every page down with it (`sampleInventory` is built at module scope, so
 * the throw is unrecoverable).
 *
 * Two properties made it expensive to diagnose:
 *   - DELAYED ACTION. The check is time-relative and its timestamp is baked
 *     into the bundle, so a deploy renders fine and starts failing for everyone
 *     hours later with no deploy in between. It looks like a CDN or DNS fault.
 *   - Origin health checks all pass, because the origin genuinely is fine.
 *
 * A source-level rule ("remember to gate on typeof window") is not a mechanism.
 * This is: it reads the actual built artifact. If the gate is ever removed the
 * BUILD fails, which is the correct place to fail — not a customer's browser.
 *
 * Runs automatically as the `postbuild` npm lifecycle hook, so it runs on
 * Cloudflare Pages too.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const CHUNK_DIR = "out/_next/static/chunks";

/**
 * Strings that must never reach a browser. Each is the distinctive text of an
 * assertion that is only meaningful at build time.
 */
const FORBIDDEN = [
  { text: "REFUSING TO PRERENDER", source: "assertSnapshotFresh (src/data/inventory.ts)" },
];

if (!existsSync(CHUNK_DIR)) {
  console.log(`ℹ [client-throw] ${CHUNK_DIR} not found — skipping (not a static export build).`);
  process.exit(0);
}

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".js")) out.push(p);
  }
  return out;
}

const files = walk(CHUNK_DIR);
const hits = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const rule of FORBIDDEN) {
    if (src.includes(rule.text)) hits.push({ file: f, ...rule });
  }
}

if (hits.length) {
  console.error("\n✗ [client-throw] BUILD-TIME ASSERTION FOUND IN A CLIENT BUNDLE\n");
  for (const h of hits) {
    console.error(`  "${h.text}"`);
    console.error(`    from : ${h.source}`);
    console.error(`    in   : ${h.file}\n`);
  }
  console.error("  This is what took the whole site down on 2026-08-26. A throw at");
  console.error("  module evaluation in a client chunk blanks every page while the");
  console.error("  origin stays healthy, so no uptime check catches it.\n");
  console.error("  Gate the throw on `typeof window === \"undefined\"` so it fires at");
  console.error("  build time and degrades to a console.warn in the browser.\n");
  process.exit(1);
}

console.log(`✓ [client-throw] ${files.length} client chunks scanned; no build-time assertions shipped.`);
