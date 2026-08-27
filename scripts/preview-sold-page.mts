/**
 * Render the sold-vehicle page to a local HTML file, using the REAL renderer
 * the Cloudflare Function serves and REAL vehicles from the live feed.
 *
 * Nothing about the page is reproduced here — it imports the shipping code, so
 * what you look at is what visitors get.
 *
 *   npx tsx scripts/preview-sold-page.mts [outPath]
 */
import fs from "node:fs";
import path from "node:path";

// The shipping file is functions/inventory/[slug].ts and the brackets break
// ESM resolution. Copy it to a plain name IN THE SAME DIRECTORY (so its own
// relative imports still resolve), import that, then delete it. The bytes are
// the shipping bytes — this cannot drift from what Cloudflare serves.
const REAL = path.resolve("functions/inventory/[slug].ts");
const SHIM = path.resolve("functions/inventory/_preview_shim.ts");
fs.copyFileSync(REAL, SHIM);
process.on("exit", () => { try { fs.unlinkSync(SHIM); } catch { /* already gone */ } });
// Non-literal specifier on purpose: the shim exists only while this script
// runs, so a static import would fail `next build`'s type check.
const SHIM_SPEC = "../functions/inventory/_preview_shim.ts";
const mod = await import(SHIM_SPEC);
const { renderGonePage, pickSimilar } = mod as {
  renderGonePage: (o: unknown) => string;
  pickSimilar: (a: unknown[], g: unknown) => unknown[];
};

const OUT = process.argv[2] ?? "./sold-page-preview.html";
const FEED = "https://dms.loveautogroup.net/api/v1/public/inventory";

// The most recent real sale, so the copy is about a car that actually sold.
const GONE = { title: "2016 Subaru Outback", make: "Subaru", price: 13999.99 };

async function main() {
  const res = await fetch(FEED, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`feed ${res.status}`);
  const payload = (await res.json()) as { data?: unknown[]; vehicles?: unknown[] } | unknown[];
  const vehicles = (Array.isArray(payload)
    ? payload
    : payload.data ?? payload.vehicles ?? []) as never[];
  console.log(`live feed: ${vehicles.length} vehicles`);

  const similar = pickSimilar(vehicles, { make: GONE.make, retailPrice: GONE.price });
  console.log(`picked ${similar.length} similar:`);
  for (const v of similar as { year?: number; make?: string; model?: string; price?: number }[]) {
    console.log(`   ${v.year} ${v.make} ${v.model} — $${v.price}`);
  }

  const html = renderGonePage({ title: GONE.title, hidden: false, similar });
  fs.writeFileSync(OUT, html, "utf8");
  console.log(`\nwrote ${OUT} (${html.length.toLocaleString()} bytes)`);

  // Assert the page says what it should, rather than trusting a byte count.
  const checks: [string, boolean][] = [
    ["names the sold car", html.includes("2016 Subaru Outback")],
    ["says SOLD", html.includes("SOLD")],
    ["noindex", html.includes("noindex")],
    ["has a similar-cars section", html.includes("Here&#39;s what we have right now") || html.includes("what we have right now")],
    ["links a real available car", /href="\/inventory\/[a-z0-9-]+\/"/.test(html)],
  ];
  for (const [k, v] of checks) console.log(`  ${v ? "ok " : "BAD"} ${k}`);
}

main().catch((e) => { console.error(e); process.exitCode = 1; });
