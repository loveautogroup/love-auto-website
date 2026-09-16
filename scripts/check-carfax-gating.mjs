#!/usr/bin/env node
/**
 * Fail the BUILD if any file renders a CARFAX badge/button, constructs the
 * CARFAX vehicle-listing URL, or reads `carfaxLinkLive` OUTSIDE the one
 * gate the whole site is supposed to share.
 *
 * WHY THIS EXISTS
 * ----------------
 * 2026-09-16, Jeremiah, live: two newly listed cars had no merchandising
 * overlay entry at all, and the CARFAX badge/button/FAQ answer rendered
 * anyway, sending shoppers to CARFAX's $49.99 paid page as if it were the
 * free report we advertise site-wide. shared/carfaxVisibility.ts's own
 * header names the root cause: "Two hand-maintained copies of this rule is
 * exactly how it broke: one checked `carfaxLinkLive`, the other never did."
 *
 * A source rule ("always call carfaxVisible()") is not a mechanism — it is
 * exactly the kind of thing that gets missed the next time a page needs a
 * CARFAX badge. This reads the actual source tree. If a NEW file renders
 * <CarfaxBadge>/<ShowCarfaxButton>, hardcodes the carfax.com listing URL,
 * or reads `.carfaxLinkLive` without going through carfaxVisible() in the
 * same file, the BUILD fails — not a shopper's browser.
 *
 * Runs as part of `npm run prebuild`, so it runs on every Cloudflare Pages
 * build too.
 */
import { readdirSync, readFileSync, statSync, existsSync } from "node:fs";
import { join, relative } from "node:path";

const ROOTS = ["src", "functions", "shared", "e2e"];

// Files allowed to import/render the raw badge components. Anything else
// that does is a NEW, un-reviewed render path — CARFAX badges only belong
// behind the gated wrapper components that already check carfaxVisible().
const RENDER_ALLOWLIST = new Set([
  "src/components/badges/CarfaxBadge.tsx", // the component's own definition
  "src/components/ShowCarfaxButton.tsx", // the component's own definition
  "src/components/PhotoGallery.tsx", // gates on overlay.carfax before rendering CarfaxBadge
  "src/components/VDPMerchandisingWrappers.tsx", // gates on overlay.carfax before rendering ShowCarfaxButton
  "src/components/VehicleCard.tsx", // inventory-grid card, gates on overlay.carfax before rendering CarfaxBadge
]);

// Files allowed to contain the literal CARFAX vehicle-listing URL pattern
// (as live code OR in a comment documenting it). Everyone else constructing
// this string independently is the exact "two hand-maintained copies"
// defect this guard exists to prevent.
const URL_ALLOWLIST = new Set([
  "src/components/badges/CarfaxBadge.tsx",
  "src/components/ShowCarfaxButton.tsx",
  "src/components/PhotoGallery.tsx", // comment documenting what the badge links to
  "src/data/merchandising.ts", // type doc + validation pattern
  "shared/carfaxVisibility.ts", // rule doc
  "functions/_lib/validation.ts", // validates carfaxReportUrl shape
  "e2e/carfax-visibility.spec.ts",
  "e2e/carfax-free.spec.ts",
]);

// Files allowed to read `.carfaxLinkLive` WITHOUT also importing
// carfaxVisible() in the same file — because they are the rule's own
// implementation, a type/seed-data declaration, or a validator that checks
// the field's SHAPE rather than deciding whether to render anything.
const RAW_FLAG_ALLOWLIST = new Set([
  "shared/carfaxVisibility.ts",
  "src/data/merchandising.ts",
  "functions/_lib/validation.ts",
  "e2e/carfax-visibility.spec.ts", // tests the rule itself, incl. reproducing the old buggy shape on purpose
]);

const URL_PATTERNS = [/carfax\.com\/vehicle\//, /carfax\.com\/VehicleHistory/];
const RENDER_PATTERNS = [/<CarfaxBadge\b/, /<ShowCarfaxButton\b/];
const IMPORT_PATTERNS = [
  /import\s+CarfaxBadge\s+from/,
  /import\s+ShowCarfaxButton\s+from/,
];
const CARFAX_VISIBLE_IMPORT = /\bcarfaxVisible\b/;
const RAW_FLAG_PATTERN = /\.carfaxLinkLive\b/;

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next" || name === "out") continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...walk(p));
    else if (/\.(ts|tsx)$/.test(p)) out.push(p);
  }
  return out;
}

const files = [];
for (const root of ROOTS) {
  if (existsSync(root)) files.push(...walk(root));
}

if (files.length === 0) {
  console.error("✗ [carfax-gating] found zero .ts/.tsx files under src/functions/shared/e2e — the walk itself is broken.");
  process.exit(1);
}

const violations = [];
let sawAnyRender = false;
let sawAnyUrl = false;
let sawAnyRawFlag = false;

for (const abs of files) {
  const rel = relative(process.cwd(), abs).split("\\").join("/");
  const text = readFileSync(abs, "utf-8");

  const rendersOrImports =
    RENDER_PATTERNS.some((p) => p.test(text)) || IMPORT_PATTERNS.some((p) => p.test(text));
  if (rendersOrImports) {
    sawAnyRender = true;
    if (!RENDER_ALLOWLIST.has(rel)) {
      violations.push(
        `${rel}: renders/imports CarfaxBadge or ShowCarfaxButton but is not on RENDER_ALLOWLIST in scripts/check-carfax-gating.mjs. ` +
          `CARFAX badges may only render behind a wrapper that already checked carfaxVisible(overlay) (see PhotoGallery.tsx / VDPMerchandisingWrappers.tsx).`
      );
    }
  }

  if (URL_PATTERNS.some((p) => p.test(text))) {
    sawAnyUrl = true;
    if (!URL_ALLOWLIST.has(rel)) {
      violations.push(
        `${rel}: contains the CARFAX vehicle-listing URL pattern but is not on URL_ALLOWLIST in scripts/check-carfax-gating.mjs. ` +
          `Never hardcode this URL a second time — import it from where CarfaxBadge/ShowCarfaxButton already build it, or the two copies WILL drift (that's the 2026-09-16 defect).`
      );
    }
  }

  if (RAW_FLAG_PATTERN.test(text)) {
    sawAnyRawFlag = true;
    if (!RAW_FLAG_ALLOWLIST.has(rel) && !CARFAX_VISIBLE_IMPORT.test(text)) {
      violations.push(
        `${rel}: reads .carfaxLinkLive but never references carfaxVisible() in the same file. ` +
          `Never re-derive CARFAX visibility by hand — import carfaxVisible from shared/carfaxVisibility.ts. ` +
          `A file computing its own "carfax !== false && carfaxLinkLive !== false" is exactly the bug this rule exists to prevent.`
      );
    }
  }
}

// A guard that stops finding anything to check has stopped guarding — the
// DC-reconciliation failure mode (CLAUDE.md): a check whose target moved
// reports success forever. If the badge component, the URL, or the flag
// itself vanished from the tree, that is worth a loud failure, not silence.
if (!sawAnyRender) {
  violations.push(
    "found ZERO files rendering/importing CarfaxBadge or ShowCarfaxButton anywhere under src/functions/shared/e2e. " +
      "Either the components were renamed/removed (update this guard) or something is badly wrong — this check must never pass by finding nothing."
  );
}
if (!sawAnyUrl) {
  violations.push(
    "found ZERO references to the CARFAX vehicle-listing URL pattern anywhere in the tree. Update URL_PATTERNS in this guard if the URL changed."
  );
}
if (!sawAnyRawFlag) {
  violations.push(
    "found ZERO references to .carfaxLinkLive anywhere in the tree. Update RAW_FLAG_PATTERN in this guard if the field was renamed."
  );
}

if (violations.length > 0) {
  console.error("✗ [carfax-gating] " + violations.length + " violation(s):\n");
  for (const v of violations) console.error("  - " + v);
  console.error("\nSee shared/carfaxVisibility.ts for the one rule every CARFAX render must go through.");
  process.exit(1);
}

console.log(
  `✓ [carfax-gating] ${files.length} files scanned — every CARFAX render/URL/flag read stays behind carfaxVisible().`
);
