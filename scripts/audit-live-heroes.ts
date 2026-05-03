h#!/usr/bin/env tsx
/**
 * Pre-deploy hero audit (Tier 1 enforcement).
 *
 * Fetches the live DMS inventory feed, classifies the first image of
 * every available vehicle via Anthropic Vision, and reports which
 * heroes are NOT acceptable exterior-front-3/4 or exterior-front-straight
 * shots.
 *
 * This is the production safety net that catches the case where:
 *   - A new vehicle was added to DealerCenter without arranging photos
 *   - DealerCenter exported photos in unexpected order
 *   - Bill's photo sync (Phase 2) misclassified a vehicle's hero
 *
 * Modes:
 *   --strict (default): exit 1 if any hero is unacceptable. Use in CI
 *                        / pre-deploy gate to block the deploy.
 *   --warn:             exit 0 always, but log all problems prominently.
 *                        Use during the rollout phase before flipping
 *                        to strict.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... tsx scripts/audit-live-heroes.ts
 *   ANTHROPIC_API_KEY=sk-ant-... tsx scripts/audit-live-heroes.ts --warn
 *   ANTHROPIC_API_KEY=sk-ant-... DMS_URL=https://staging.example.com tsx scripts/audit-live-heroes.ts
 *
 * Wire-up:
 *   - Cloudflare Pages prebuild hook (package.json):
 *       "prebuild": "tsx scripts/audit-live-heroes.ts --warn"
 *     Switch to default (strict) after 2 weeks of clean warnings.
 *   - GitHub Actions: same script as a PR check.
 *
 * Cost: ~50 vehicles × $0.003 = $0.15 per run. With 2-3 deploys/week
 *       that's ~$1/month. Skip the run if no inventory changed since
 *       last successful audit (cache key in build artifacts).
 */

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

// ─── Config ────────────────────────────────────────────────────────────

const DMS_URL = process.env.DMS_URL ?? "https://web-production-d5f3a.up.railway.app";
const INVENTORY_PATH = "/api/v1/public/inventory";
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_MODEL = "claude-sonnet-4-6";

if (!ANTHROPIC_API_KEY) {
  console.error("ANTHROPIC_API_KEY env var is required.");
  process.exit(2);
}

const MODE: "strict" | "warn" = process.argv.includes("--warn") ? "warn" : "strict";

// Acceptable hero categories — only these two are valid as photo #1.
const ACCEPTABLE_HERO = new Set([
  "exterior-front-34",
  "exterior-front-straight",
]);

// ─── Anthropic Vision call ────────────────────────────────────────────

const CLASSIFICATION_PROMPT = `You are classifying a single vehicle photo for a used-car dealership website.

Pick exactly one category that best describes the photo. Reply with ONLY the category string, nothing else.

Categories:
  exterior-front-34          Three-quarter view of the front, showing grille + headlights + driver's-side flank.
  exterior-front-straight    Head-on shot of the front of the vehicle.
  exterior-side-driver       Pure side profile, driver's side.
  exterior-side-passenger    Pure side profile, passenger side.
  exterior-rear-34           Three-quarter view of the rear.
  exterior-rear-straight     Head-on shot of the rear.
  exterior-far               A far-away exterior shot where vehicle is small in frame.
  exterior-detail            Close-up of an exterior part (badge, mirror, light, wheel).
  interior-dashboard-full    Full dashboard / steering wheel / center stack visible.
  interior-dashboard-close   Close-up of dash gauges, screen, or controls.
  interior-front-seats       Front seats visible, possibly with steering wheel.
  interior-back-seats        Back seat row visible.
  interior-cargo             Trunk or cargo area.
  engine-bay                 Hood open, engine visible.
  wheels-tires               Wheel / tire close-up.
  misc-detail                Anything else (manuals, keys, paperwork, etc.)

Respond with one of the category strings exactly as written.`;

type ClassifyResult = {
  category: string;
  confidence: "high" | "medium" | "low";
  raw: string;
};

async function classify(imageUrl: string): Promise<ClassifyResult> {
  // Anthropic supports image URLs directly (claude.ai/docs).
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 50,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "url", url: imageUrl },
            },
            { type: "text", text: CLASSIFICATION_PROMPT },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Anthropic API ${res.status}: ${errText.slice(0, 200)}`);
  }

  const body = (await res.json()) as { content: { text: string }[] };
  const raw = (body.content?.[0]?.text ?? "").trim().toLowerCase();
  const category = raw.split(/\s+/)[0]?.replace(/[^a-z0-9-]/g, "") ?? "unknown";

  // Confidence heuristic: if the response is one clean token matching a
  // category, high. If it has extra words, medium. If it's empty or
  // doesn't match anything we know, low.
  let confidence: ClassifyResult["confidence"] = "high";
  if (raw.split(/\s+/).length > 1) confidence = "medium";
  if (!category || category === "unknown") confidence = "low";

  return { category, confidence, raw };
}

// ─── Inventory fetch ──────────────────────────────────────────────────

type LiveVehicle = {
  vin: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  status: string;
  images: string[];
};

async function fetchInventory(): Promise<LiveVehicle[]> {
  const url = `${DMS_URL}${INVENTORY_PATH}`;
  const res = await fetch(url, { headers: { "User-Agent": "hero-audit/1.0" } });
  if (!res.ok) throw new Error(`Inventory fetch ${res.status}: ${url}`);
  const body = (await res.json()) as { vehicles?: LiveVehicle[] } | LiveVehicle[];
  const list = Array.isArray(body) ? body : body.vehicles ?? [];
  return list;
}

// ─── Main ──────────────────────────────────────────────────────────────

type AuditEntry = {
  vin: string;
  slug: string;
  label: string;
  imageUrl: string;
  category: string;
  confidence: ClassifyResult["confidence"];
  acceptable: boolean;
  error?: string;
};

async function main() {
  console.log(`[hero-audit] mode=${MODE} dms=${DMS_URL}`);
  const vehicles = await fetchInventory();
  console.log(`[hero-audit] fetched ${vehicles.length} vehicles`);

  // Filter to vehicles with photos. Vehicles with no photos render the
  // empty-state SVG on the site — not a hero failure, just a gap.
  const withPhotos = vehicles.filter((v) => v.images && v.images.length > 0);
  const noPhotos = vehicles.filter((v) => !v.images || v.images.length === 0);
  console.log(`[hero-audit] ${withPhotos.length} have photos, ${noPhotos.length} have none`);

  const results: AuditEntry[] = [];

  // Sequential to stay under Anthropic's per-second rate limit. Could
  // be parallelized with a small concurrency pool if this gets slow.
  for (const v of withPhotos) {
    const label = `${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ""}`;
    const imageUrl = v.images[0];
    process.stdout.write(`[hero-audit] ${v.vin} ${label} ... `);
    try {
      const r = await classify(imageUrl);
      const acceptable = ACCEPTABLE_HERO.has(r.category);
      results.push({
        vin: v.vin,
        slug: v.slug,
        label,
        imageUrl,
        category: r.category,
        confidence: r.confidence,
        acceptable,
      });
      console.log(
        `${r.category} (${r.confidence})${acceptable ? " ✓" : " ✗"}`
      );
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      results.push({
        vin: v.vin,
        slug: v.slug,
        label,
        imageUrl,
        category: "error",
        confidence: "low",
        acceptable: false,
        error: msg,
      });
      console.log(`ERROR ${msg}`);
    }
    // Rate limiting — ~3 calls per second.
    await new Promise((r) => setTimeout(r, 350));
  }

  const bad = results.filter((r) => !r.acceptable);
  const errored = results.filter((r) => r.error);

  // Save full report for human review.
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const outDir = path.resolve("artifacts");
  await mkdir(outDir, { recursive: true });
  const reportPath = path.join(outDir, `hero-audit-${ts}.json`);
  await writeFile(
    reportPath,
    JSON.stringify(
      { mode: MODE, dms: DMS_URL, totals: { fetched: vehicles.length, audited: withPhotos.length, bad: bad.length, errored: errored.length }, results, noPhotos },
      null,
      2
    )
  );
  console.log(`[hero-audit] full report → ${reportPath}`);

  // Summary
  console.log("");
  console.log("=== Hero audit summary ===");
  console.log(`  audited:    ${withPhotos.length}`);
  console.log(`  acceptable: ${results.filter((r) => r.acceptable).length}`);
  console.log(`  unacceptable: ${bad.length - errored.length}`);
  console.log(`  errored:    ${errored.length}`);
  console.log(`  no photos:  ${noPhotos.length}`);

  if (bad.length > 0) {
    console.log("");
    console.log("UNACCEPTABLE HEROES:");
    for (const r of bad) {
      const tag = r.error ? `[ERROR: ${r.error}]` : `[${r.category}]`;
      console.log(`  ✗ ${r.vin} ${r.label}`);
      console.log(`      ${tag} confidence=${r.confidence}`);
      console.log(`      ${r.imageUrl}`);
    }
    console.log("");
    console.log("Fix in DealerCenter Media tab: arrange the front-3/4");
    console.log("driver-side exterior shot as photo #1. Re-run audit");
    console.log("after the next inventory sync to verify.");
    console.log("");

    if (MODE === "strict") {
      process.exit(1);
    }
  } else {
    console.log("");
    console.log("All heroes ✓");
  }
}

main().catch((e) => {
  console.error(`[hero-audit] FATAL: ${e instanceof Error ? e.message : String(e)}`);
  if (MODE === "warn") {
        console.warn("[hero-audit] warn mode — exiting 0 despite fatal error (non-blocking rollout)");
        process.exit(0);
  }

    process.exit(2);
  });
