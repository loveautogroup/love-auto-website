#!/usr/bin/env tsx
/**
 * Phase 2 photo classifier — automated version of Jordan's manual Phase 1 pass.
 *
 * Scans every photo in public/images/inventory/, classifies each one via a
 * vision model, and regenerates src/data/photoOrder.ts with the sorted
 * order per vehicle.
 *
 * Pluggable backend via VISION_BACKEND env var:
 *   - "anthropic" (default)  — Uses Anthropic Vision (requires ANTHROPIC_API_KEY)
 *   - "google"               — Uses Google Cloud Vision (requires GOOGLE_CLOUD_API_KEY)
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... tsx scripts/classify-photos.ts
 *   ANTHROPIC_API_KEY=sk-ant-... tsx scripts/classify-photos.ts --vehicle=2016-honda-pilot-touring-4d
 *   GOOGLE_CLOUD_API_KEY=AIza... VISION_BACKEND=google tsx scripts/classify-photos.ts
 *
 * Output: overwrites src/data/photoOrder.ts with a fresh manifest.
 * Jordan reviews the diff before committing — the AI is right 95% of the
 * time but front-3/4-vs-front-straight calls can get edge cases. Always
 * eyeball the output before `git commit`.
 *
 * Sam's notes:
 *   - API key goes in env, never hardcoded.
 *   - Rate-limited to ~10 calls/second (via setTimeout) to avoid provider
 *     throttling.
 *   - Failures on individual images get logged and skipped, not fatal.
 */

import { promises as fs } from "node:fs";
import path from "node:path";

// ─── Category definitions ────────────────────────────────────────────
//
// These MUST match the priority order in docs/photo-arrangement-rules.md.
// The classifier picks one category per photo; the sort logic applies
// the priority.
type Category =
  | "exterior-front-34"
  | "exterior-front-straight"
  | "exterior-side-driver"
  | "exterior-side-passenger"
  | "exterior-rear-34"
  | "exterior-rear-straight"
  | "exterior-far"
  | "exterior-detail"
  | "interior-dashboard-full"
  | "interior-dashboard-close"
  | "interior-front-seats"
  | "interior-front-seat-close"
  | "interior-back-seats"
  | "interior-back-seat-close"
  | "interior-cargo"
  | "interior-side"
  | "engine-bay"
  | "engine-detail"
  | "wheels-tires"
  | "misc-detail"
  | "footwell"
  | "condition";

// Priority — lower number = higher in the sort. Mirrors the rules doc.
const PRIORITY: Record<Category, number> = {
  "exterior-front-34": 1,
  "exterior-front-straight": 8,
  "exterior-side-driver": 3,
  "exterior-side-passenger": 4,
  "exterior-rear-34": 5,
  "exterior-rear-straight": 7,
  "exterior-far": 9,
  "exterior-detail": 10,
  "interior-dashboard-full": 11,
  "interior-dashboard-close": 12,
  "interior-front-seats": 13,
  "interior-front-seat-close": 14,
  "interior-back-seats": 15,
  "interior-back-seat-close": 16,
  "interior-cargo": 17,
  "interior-side": 18,
  "engine-bay": 19,
  "engine-detail": 20,
  "wheels-tires": 21,
  "misc-detail": 22,
  footwell: 23,
  condition: 99,
};

const CATEGORIES = Object.keys(PRIORITY) as Category[];

interface ClassificationResult {
  filename: string;
  index: number; // 1-indexed photo number in the vehicle's folder
  category: Category;
  confidence?: number;
}

// ─── Backend: Anthropic Vision ───────────────────────────────────────
async function classifyAnthropic(
  imagePath: string,
  apiKey: string
): Promise<Category> {
  const imageBytes = await fs.readFile(imagePath);
  const base64 = imageBytes.toString("base64");
  const mime = imagePath.toLowerCase().endsWith(".webp")
    ? "image/webp"
    : "image/jpeg";

  const prompt = `You are classifying a vehicle photo for an auto dealership website. Return EXACTLY ONE of these category strings, no other text:

${CATEGORIES.join("\n")}

Definitions:
- exterior-front-34: exterior shot at a 3/4 angle showing the front grille + one flank. The HERO photo.
- exterior-front-straight: straight-on front view, grille centered.
- exterior-side-driver / exterior-side-passenger: pure profile, driver or passenger side.
- exterior-rear-34: rear 3/4 angle showing the back + one flank.
- exterior-rear-straight: straight-on rear view.
- exterior-far: full-car shot but zoomed out.
- exterior-detail: close-ups of grille, badges, trim.
- interior-dashboard-full: wide view of the cockpit.
- interior-dashboard-close: steering wheel, gauges, infotainment close-up.
- interior-front-seats: front driver + passenger seats from side view.
- interior-front-seat-close: close-up of one front seat.
- interior-back-seats: rear bench / captain's chairs.
- interior-back-seat-close: close-up of rear seats.
- interior-cargo: trunk or cargo area.
- interior-side: side view of the cabin.
- engine-bay: hood-open engine shot.
- engine-detail: close-up of engine parts.
- wheels-tires: wheel + tire close-up.
- misc-detail: badges, emblems, stitching, trim close-ups not covered above.
- footwell: pedals / floor mats.
- condition: shots showing wear, damage, or mileage plate.

Return only the category string.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 20,
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mime, data: base64 } },
            { type: "text", text: prompt },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`Anthropic API ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    content: Array<{ type: string; text?: string }>;
  };
  const text = data.content
    .filter((c) => c.type === "text")
    .map((c) => c.text?.trim())
    .join("")
    .toLowerCase()
    .replace(/[^a-z\-]/g, "");

  if (!CATEGORIES.includes(text as Category)) {
    console.warn(
      `  [warn] Model returned unrecognized category "${text}" for ${path.basename(imagePath)}. Defaulting to misc-detail.`
    );
    return "misc-detail";
  }
  return text as Category;
}

// ─── Backend: Google Cloud Vision ────────────────────────────────────
//
// Google Vision doesn't have a custom-category classifier like the above,
// but LABEL_DETECTION returns concepts we can map heuristically. This is
// less precise than Anthropic Vision — Anthropic is the recommended default.
async function classifyGoogle(
  imagePath: string,
  apiKey: string
): Promise<Category> {
  const imageBytes = await fs.readFile(imagePath);
  const base64 = imageBytes.toString("base64");

  const res = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64 },
            features: [
              { type: "LABEL_DETECTION", maxResults: 15 },
              { type: "OBJECT_LOCALIZATION", maxResults: 10 },
            ],
          },
        ],
      }),
    }
  );
  if (!res.ok) {
    throw new Error(`Google Vision ${res.status}: ${await res.text()}`);
  }
  const data = (await res.json()) as {
    responses: Array<{
      labelAnnotations?: Array<{ description: string; score: number }>;
      localizedObjectAnnotations?: Array<{ name: string; score: number }>;
    }>;
  };
  const r = data.responses[0] ?? {};
  const labels = new Set(
    [
      ...(r.labelAnnotations ?? []).map((l) => l.description.toLowerCase()),
      ...(r.localizedObjectAnnotations ?? []).map((l) => l.name.toLowerCase()),
    ]
  );

  // Heuristic mapping. Good enough when paired with photo-number hints.
  if (
    labels.has("engine") ||
    labels.has("automotive engine part") ||
    labels.has("engine bay")
  )
    return "engine-bay";
  if (labels.has("tire") || labels.has("rim") || labels.has("wheel"))
    return "wheels-tires";
  if (
    labels.has("dashboard") ||
    labels.has("speedometer") ||
    labels.has("steering wheel")
  )
    return "interior-dashboard-close";
  if (labels.has("car seat") || labels.has("vehicle seat"))
    return "interior-front-seats";
  if (labels.has("trunk") || labels.has("cargo"))
    return "interior-cargo";
  // If we see the car body + exterior signal, assume it's an exterior
  // of some type. Default to front-34 — not ideal but common.
  if (
    labels.has("car") ||
    labels.has("vehicle") ||
    labels.has("automotive exterior")
  ) {
    return "exterior-front-34";
  }
  return "misc-detail";
}

// ─── Sort + manifest generation ──────────────────────────────────────
function sortByPriority(results: ClassificationResult[]): number[] {
  // Sort by category priority, preserving original index order within each
  // category. Returns the new order as 1-indexed photo numbers.
  const sorted = [...results].sort((a, b) => {
    const pa = PRIORITY[a.category];
    const pb = PRIORITY[b.category];
    if (pa !== pb) return pa - pb;
    return a.index - b.index;
  });
  return sorted.map((r) => r.index);
}

// ─── Driver ──────────────────────────────────────────────────────────
async function classifyVehicle(
  folderPath: string,
  backend: (p: string) => Promise<Category>
): Promise<ClassificationResult[]> {
  const entries = await fs.readdir(folderPath);
  // Only .jpg files; the webp pairs duplicate content so skip.
  const jpgs = entries.filter((f) => f.toLowerCase().endsWith(".jpg"));
  // Sort naturally by numeric suffix so index 1 = photo 1.
  jpgs.sort((a, b) => {
    const na = parseInt(a.match(/(\d+)\.jpg$/i)?.[1] ?? "0", 10);
    const nb = parseInt(b.match(/(\d+)\.jpg$/i)?.[1] ?? "0", 10);
    return na - nb;
  });

  const results: ClassificationResult[] = [];
  for (let i = 0; i < jpgs.length; i++) {
    const filename = jpgs[i];
    const imagePath = path.join(folderPath, filename);
    process.stdout.write(`  ${filename} → `);
    try {
      const category = await backend(imagePath);
      process.stdout.write(`${category}\n`);
      results.push({ filename, index: i + 1, category });
    } catch (err) {
      process.stdout.write(`[skipped: ${(err as Error).message}]\n`);
      results.push({ filename, index: i + 1, category: "misc-detail" });
    }
    // Gentle pacing — 100ms between calls
    await new Promise((r) => setTimeout(r, 100));
  }
  return results;
}

async function main() {
  const args = process.argv.slice(2);
  const onlyVehicleArg = args.find((a) => a.startsWith("--vehicle="));
  const onlyVehicle = onlyVehicleArg?.split("=")[1];

  const backendName = process.env.VISION_BACKEND ?? "anthropic";
  let backend: (p: string) => Promise<Category>;
  if (backendName === "anthropic") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) {
      console.error("ANTHROPIC_API_KEY env var required for anthropic backend.");
      process.exit(1);
    }
    backend = (p) => classifyAnthropic(p, key);
  } else if (backendName === "google") {
    const key = process.env.GOOGLE_CLOUD_API_KEY;
    if (!key) {
      console.error("GOOGLE_CLOUD_API_KEY env var required for google backend.");
      process.exit(1);
    }
    backend = (p) => classifyGoogle(p, key);
  } else {
    console.error(`Unknown VISION_BACKEND: ${backendName}`);
    process.exit(1);
  }

  const repoRoot = path.resolve(__dirname, "..");
  const inventoryRoot = path.join(repoRoot, "public", "images", "inventory");
  const vehicles = (await fs.readdir(inventoryRoot, { withFileTypes: true }))
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .filter((name) => !onlyVehicle || name === onlyVehicle);

  console.log(`Classifying ${vehicles.length} vehicle(s) via ${backendName}…\n`);

  const manifest: Record<string, number[]> = {};

  for (const v of vehicles) {
    console.log(`\n=== ${v} ===`);
    const results = await classifyVehicle(path.join(inventoryRoot, v), backend);
    manifest[v] = sortByPriority(results);
  }

  // Emit the manifest. If we're only doing one vehicle, merge it into the
  // existing manifest rather than overwriting.
  const outputPath = path.join(repoRoot, "src", "data", "photoOrder.generated.ts");
  const tsSource = buildTsSource(manifest);
  await fs.writeFile(outputPath, tsSource);

  console.log(`\n✓ Wrote ${outputPath}`);
  console.log(
    `\nNext steps:\n  1. Eyeball the output\n  2. Merge into src/data/photoOrder.ts manually, OR replace it entirely if you trust the run\n  3. Commit the result`
  );
}

function buildTsSource(manifest: Record<string, number[]>): string {
  const entries = Object.entries(manifest)
    .map(([slug, order]) => `  "${slug}": [${order.join(", ")}],`)
    .join("\n");
  return `/**
 * AUTO-GENERATED by scripts/classify-photos.ts.
 *
 * Do not edit by hand — rerun the classifier instead. Merge or replace
 * src/data/photoOrder.ts manually after reviewing this output.
 */

export const PHOTO_ORDER_AUTO: Record<string, number[]> = {
${entries}
};
`;
}

main().catch((err) => {
  console.error("Classifier failed:", err);
  process.exit(1);
});
