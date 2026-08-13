/**
 * Shared VDP route plumbing for /inventory/[slug]/ and /es/inventory/[slug]/.
 *
 * Both routes must publish exactly the same set of vehicles and resolve each
 * slug the same way. Duplicating this in the Spanish page would have meant two
 * copies of the sold-car rule and the seed-description fallback, free to drift
 * apart the first time either is touched — and a Spanish VDP that publishes a
 * car the English one doesn't is worse than no Spanish VDP.
 */

import { sampleInventory, getVehicleBySlug } from "@/data/inventory";
import { fetchDmsInventory, syncedToVehicle } from "@/lib/dmsInventory";

/**
 * Slugs to statically generate.
 *
 * Reads the SAME build snapshot as sitemap.ts (see fetchDmsInventory). These
 * two used to fetch independently, which is how the 2026-08-03 build shipped a
 * sitemap entry for Lincoln MKX #11423 with no page behind it — the sitemap's
 * fetch succeeded and this one silently returned [].
 *
 * The live feed is authoritative: we generate a page for exactly the vehicles
 * currently on the lot. Seed slugs absent from the feed are sold vehicles, and
 * a sold VDP is meant to 404 rather than render stale seed data claiming the
 * car is still available (CLAUDE.md, 2026-07-28).
 *
 * Empty means "could not read the lot", never "the lot is empty" — only then
 * do we fall back to seed so an upstream outage still ships pages.
 */
export async function vehicleStaticParams(
  label = "generateStaticParams"
): Promise<{ slug: string }[]> {
  const live = await fetchDmsInventory();
  const slugs = new Set<string>();
  if (live.length > 0) {
    for (const v of live) slugs.add(v.slug);
  } else {
    console.warn(
      `[${label}] live DMS inventory unavailable — falling back to seed ` +
        "slugs. Sold cars may be published and new arrivals missing."
    );
    for (const v of sampleInventory) slugs.add(v.slug);
  }
  // Must match the [sitemap] count logged by src/app/sitemap.ts.
  console.log(
    `[${label}] ${slugs.size} vehicle pages ` +
      `(live=${live.length}, seed=${sampleInventory.length})`
  );
  return Array.from(slugs).map((slug) => ({ slug }));
}

/**
 * Prefer live DMS — it has current photos, price, and status. Fall back to
 * seed only for vehicles absent from the DMS feed.
 */
export async function resolveVehicle(slug: string) {
  const live = await fetchDmsInventory();
  const dmsMatch = live.find((v) => v.slug === slug);
  if (dmsMatch) {
    const vehicle = syncedToVehicle(dmsMatch);
    // Documented intent: DMS marketing copy wins; if the feed has none yet,
    // keep the hand-written seed description for this slug.
    if (!vehicle.description) {
      const seed = getVehicleBySlug(slug);
      if (seed?.description) vehicle.description = seed.description;
    }
    return vehicle;
  }

  return getVehicleBySlug(slug);
}
