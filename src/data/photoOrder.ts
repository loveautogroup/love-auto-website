/**
 * Per-vehicle photo display order.
 *
 * Conversion rule (the rule book is docs/photo-arrangement-rules.md):
 *   1. HERO MUST BE EXTERIOR FRONT-3/4 DRIVER-SIDE.
 *      That single rule moves close rates more than every other photo
 *      decision combined. If the hero is anything else (dashboard,
 *      interior, wheel, engine), the listing reads "uncared for" before
 *      the customer even reads the price.
 *   2. Photos 2–8 are all exteriors: alternate front-3/4 angles, side
 *      profiles, rear-3/4, rear, front-head-on. Customer should be able
 *      to see every side of the car before any interior shot.
 *   3. Interior block: dashboard → driver controls → seats (front then
 *      rear) → cargo → sunroof.
 *   4. Detail block (engine, wheels, badges) goes last.
 *
 * Photos outside the manifest fall back to their original numerical order
 * appended after the listed ones — no photo is ever dropped.
 *
 * History:
 *   v1 (Apr 2026): Jordan visually classified every photo on the lot.
 *                  Several heroes turned out to be misclassified (e.g.
 *                  Honda Pilot v1 hero #5 was the dashboard — the bug
 *                  Jeremiah caught).
 *   v2 (Apr 23 2026): Re-classified by visual review of contact sheets
 *                     of every photo. Every hero is now a verified
 *                     exterior-front-3/4-driver-side shot. This is the
 *                     manifest currently in production.
 *
 * Phase 2 (Bill, future): wire Anthropic Vision (or Google Cloud Vision)
 * into the Dealer Center sync. On every photo import, run classification
 * and regenerate these entries automatically. The shape of this file is
 * the drop-in target — Bill's pipeline just has to output the same
 * structure.
 */

export const PHOTO_ORDER: Record<string, number[]> = {
  // 2016 Honda Pilot Touring — 30 photos
  // v1 hero #5 was the dashboard. v2 hero #17 = clean front-3/4 driver-side.
  "2016-honda-pilot-touring-4d": [
    17, 13, 28, 22, 18, 7, 19, 14, 23, 20, 21, 11,
    5, 12, 1, 3, 2, 4, 25, 15, 27, 26, 16, 6,
    24, 8, 29, 9, 30, 10,
  ],

  // 2016 Lexus RC 350 — 24 photos
  // v1 hero #8 was a rear-3/4 in the garage. v2 hero #9 = clean
  // front-3/4 driver outdoor of the black coupe.
  "2016-lexus-rc-350-2d": [
    9, 24, 15, 20, 6, 16, 17, 8, 19, 23, 3, 5,
    14, 21, 12, 1, 7, 13, 4, 22, 2, 18, 10, 11,
  ],

  // 2017 Ford Mustang EcoBoost Premium — 21 photos
  // v1 hero #2 was a rear-3/4 of the blue coupe. v2 hero #10 = clean
  // front-3/4 driver-side outdoor.
  "2017-ford-mustang-ecoboost-premium-2d": [
    10, 13, 6, 8, 12, 2, 11, 7, 20, 16, 18, 15,
    14, 1, 5, 4, 21, 19, 17, 9, 3,
  ],

  // 2010 Acura MDX Sport — 23 photos
  // v1 hero #3 was an open-door interior. v2 hero #11 = front-3/4
  // driver-side outdoor of the black SUV.
  "2010-acura-mdx-sport-4d": [
    11, 4, 22, 9, 7, 10, 14, 5, 13, 15, 18, 23,
    12, 1, 16, 20, 2, 19, 17, 3, 6, 8, 21,
  ],

  // 2013 GMC Terrain SLT-1 — 15 photos
  // v3 (Apr 24 2026): Jeremiah called out that the order didn't match
  // his DealerCenter Media-tab arrangement. Re-mapped DC slot order
  // to repo file numbers by visual comparison against the DC media
  // grid. Verified DC slot 1 (the hero) = repo #1 (matched directly).
  "2013-gmc-terrain-slt-4d": [
    1, 14, 8, 9, 12, 10, 13, 3, 5, 11, 2, 6,
    15, 7, 4,
  ],

  // 2017 Hyundai Accent SE — 21 photos
  // v3 (Apr 24 2026): Re-mapped from DC Media tab. v2 hero was repo
  // #16 (chosen by visual inspection as the cleanest front-3/4);
  // DC's actual slot 1 maps better to repo #21 (lower angle, trees
  // background, matches DC's overcast lighting). Full DC-sequence
  // re-arrangement — interior/engine photos moved to end per DC's
  // grouping.
  "2017-hyundai-accent-4d": [
    21, 11, 16, 13, 6, 7, 9, 1, 19, 20, 12, 3,
    14, 4, 2, 8, 10, 17, 5, 15, 18,
  ],

  // 2008 Saab 9-3 2.0T Convertible — 23 photos
  // v1 hero #5 was a side profile. v2 hero #14 = clean front-3/4
  // driver-side studio shot (top up). The professional-photographer
  // background sells the convertible without distracting the eye.
  // (#2 and #13 looked like front-3/4 in the contact sheet but turned
  // out to be near-pure side profiles when viewed full-size — this is
  // exactly why we verify by reading each candidate full-size.)
  "2008-saab-9-3-2d": [
    14, 21, 23, 3, 9, 7, 2, 13, 18, 19, 5, 8,
    1, 6, 15, 16, 20, 12, 10, 17, 22, 4, 11,
  ],
};

/**
 * Apply the manifest order to a vehicle's image array.
 *
 * Strategy:
 *   1. If the vehicle has no manifest entry, return images unchanged.
 *   2. Map each 1-indexed manifest number to the 0-indexed image array.
 *   3. Any images NOT listed in the manifest (e.g. a new photo added
 *      after the classification) get appended at the end in their
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
