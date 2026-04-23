/**
 * Per-vehicle photo display order.
 *
 * Jordan's conversion rule: the first 5 photos must all be exteriors,
 * starting with the strongest front-3/4 shot. Interior comes next
 * (dashboard → front seats → back seats → cargo), then details (engine,
 * wheels, badges) last. Photos outside the manifest fall back to their
 * original numerical order.
 *
 * Phase 1 (current): Jordan manually classified every photo on the lot
 * via visual review. Entries below are the sorted 1-indexed photo numbers
 * for each vehicle slug.
 *
 * Phase 2 (Bill, future): Wire Google Cloud Vision (or Anthropic Vision
 * API) into the Dealer Center sync. On every photo import, run
 * classification and regenerate these entries automatically. The shape
 * of this file is the drop-in target — Bill's pipeline just has to
 * output the same structure.
 */

export const PHOTO_ORDER: Record<string, number[]> = {
  // 2016 Honda Pilot Touring — 30 photos
  // Current hero (#1 dashboard) was killing conversion. New hero (#5)
  // is a clean front 3/4 shot.
  "2016-honda-pilot-touring-4d": [
    5, 13, 6, 11, 9, 28, 15, 10, 3, 16, 21, 14,
    26, 1, 4, 2, 7, 12, 20, 24, 25, 23, 19, 18,
    8, 17, 27, 22, 29, 30,
  ],

  // 2016 Lexus RC 350 — 24 photos
  // Current hero was an interior shot. New hero is the full black
  // coupe at a front 3/4 — the car that does the selling.
  "2016-lexus-rc-350-2d": [
    8, 13, 7, 17, 21, 9, 16, 23, 11, 24, 18, 14,
    4, 5, 1, 2, 6, 10, 12, 19, 22, 15, 20, 3,
  ],

  // 2017 Ford Mustang EcoBoost Premium — 21 photos
  // First photo was the dashboard. New hero is the blue coupe
  // at a proper 3/4 angle.
  "2017-ford-mustang-ecoboost-premium-2d": [
    2, 12, 7, 19, 4, 3, 10, 20, 8, 18, 13, 5,
    6, 1, 11, 9, 17, 14, 16, 21, 15,
  ],

  // 2010 Acura MDX Sport — 23 photos
  // New hero pulls the straight-front-3/4 that reads best at a glance.
  "2010-acura-mdx-sport-4d": [
    3, 10, 18, 19, 6, 5, 7, 2, 21, 23, 15, 4,
    1, 13, 16, 8, 11, 12, 9, 17, 14, 20, 22,
  ],

  // 2013 GMC Terrain SLT-1 — 15 photos
  // First photo was already decent but the side-far 3/4 (photo 6)
  // is a stronger opener on the platform.
  "2013-gmc-terrain-slt-4d": [
    1, 6, 5, 2, 4, 14, 15, 3, 11, 9, 7, 8,
    12, 13, 10,
  ],

  // 2017 Hyundai Accent SE — 21 photos
  // First photo was already a good front 3/4. Order after reflects
  // the full exterior-first rule.
  "2017-hyundai-accent-4d": [
    1, 14, 15, 3, 4, 8, 5, 13, 11, 18, 19, 21,
    16, 6, 2, 9, 12, 20, 7, 10, 17,
  ],

  // 2008 Saab 9-3 2.0T Convertible — 23 photos
  // First photo was a driver's-seat interior. New hero is the
  // silver convertible front 3/4.
  "2008-saab-9-3-2d": [
    5, 6, 11, 16, 10, 12, 17, 14, 19, 22, 21, 23,
    7, 8, 13, 1, 2, 9, 20, 18, 4, 15, 3,
  ],
};

/**
 * Apply the manifest order to a vehicle's image array.
 *
 * Strategy:
 *   1. If the vehicle has no manifest entry, return images unchanged.
 *   2. Map each 1-indexed manifest number to the 0-indexed image array.
 *   3. Any images NOT listed in the manifest (e.g. a new photo added
 *      after Jordan's classification) get appended at the end in their
 *      original order — no photo ever disappears just because it's
 *      missing from the manifest.
 */
export function applyPhotoOrder(slug: string, images: string[]): string[] {
  // Extract the inventory folder key from either the full slug
  // (e.g. "2016-honda-pilot-touring-11334") or the folder slug
  // (e.g. "2016-honda-pilot-touring-4d"). We match by the image
  // path structure which embeds the folder slug.
  if (images.length === 0) return images;

  // Image paths look like: /images/inventory/{folder-slug}/{filename}.jpg
  // Pull the folder slug from the first image path.
  const match = images[0].match(/\/images\/inventory\/([^/]+)\//);
  const folderSlug = match?.[1];
  if (!folderSlug) return images;

  const order = PHOTO_ORDER[folderSlug];
  if (!order || order.length === 0) return images;

  const reordered: string[] = [];
  const used = new Set<number>();

  // Pick images in manifest order (1-indexed → 0-indexed).
  for (const idx1 of order) {
    const idx0 = idx1 - 1;
    if (idx0 >= 0 && idx0 < images.length) {
      reordered.push(images[idx0]);
      used.add(idx0);
    }
  }

  // Append any leftover images in their original order.
  for (let i = 0; i < images.length; i++) {
    if (!used.has(i)) {
      reordered.push(images[i]);
    }
  }

  return reordered;
}
