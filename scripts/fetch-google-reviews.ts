/**
 * Build-time script: fetch live Google review data from the Railway
 * reputation API and write it to src/data/google-reviews.json.
 *
 * Run as part of prebuild so constants.ts always ships with current values.
 * Falls back gracefully to the bundled fallback values so a Railway outage
 * never blocks a Cloudflare Pages deploy.
 *
 * Required env: RAILWAY_API_URL (optional, defaults to prod), RAILWAY_API_KEY
 */

import * as fs from "fs";
import * as path from "path";

const RAILWAY_BASE =
  process.env.RAILWAY_API_URL ?? "https://web-production-d5f3a.up.railway.app";
const RAILWAY_KEY = process.env.RAILWAY_API_KEY ?? "";

const OUTPUT_PATH = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "../src/data/google-reviews.json"
);

// Fallback values (bumped by hand when the script can't reach Railway).
const FALLBACK = { rating: 4.7, count: 127 };

async function main() {
  const ANSI_GREEN = "\x1b[32m";
  const ANSI_YELLOW = "\x1b[33m";
  const ANSI_RED = "\x1b[31m";
  const ANSI_RESET = "\x1b[0m";

  if (!RAILWAY_KEY) {
    console.warn(
      `${ANSI_YELLOW}[fetch-google-reviews] RAILWAY_API_KEY not set — writing fallback values.${ANSI_RESET}`
    );
    writeOutput(FALLBACK, "fallback (no API key)");
    return;
  }

  try {
    const res = await fetch(`${RAILWAY_BASE}/api/v1/reputation/summary`, {
      headers: { "X-API-Key": RAILWAY_KEY },
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} from reputation API`);
    }

    const data = (await res.json()) as {
      overall_star_avg?: number;
      total_reviews?: number;
    };

    const rating = data.overall_star_avg ?? FALLBACK.rating;
    const count = data.total_reviews ?? FALLBACK.count;

    writeOutput({ rating, count }, "live GBP data");
    console.log(
      `${ANSI_GREEN}[fetch-google-reviews] ✓ ${rating}★ across ${count} reviews${ANSI_RESET}`
    );
  } catch (err) {
    console.warn(
      `${ANSI_YELLOW}[fetch-google-reviews] Railway unreachable (${(err as Error).message}) — writing fallback values.${ANSI_RESET}`
    );
    writeOutput(FALLBACK, "fallback (fetch failed)");
  }
}

function writeOutput(data: { rating: number; count: number }, source: string) {
  const payload = {
    rating: data.rating,
    count: data.count,
    source,
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(payload, null, 2) + "\n");
}

main();
