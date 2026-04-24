# Photo Arrangement Rules (Permanent)

**Owner:** Jeremiah (final word) → Jordan (sales / conversion)
**Implementers:** Bill (Phase 2 automation), Charlotte (rendering layer)
**Status:** **CANONICAL — PERMANENT RULE, DO NOT CHANGE WITHOUT JEREMIAH'S APPROVAL**

Re-affirmed Apr 23 2026 by Jeremiah after the v1 manifest had several
misclassified heroes (Honda Pilot v1 hero was the dashboard, etc.).
The exterior-front-3/4 hero rule is treated as a hard contract: every
implementer must verify the chosen hero file is actually a front-3/4
by reading the file FULL-SIZE before commit. Montage thumbnails are
not enough — that's how v1 went wrong.

**Sequence ground truth:** Jeremiah's preferred photo sequence for any
vehicle is whatever Dealer Center shows in the active-inventory
detail-view photo carousel for that vehicle. When in doubt about
ordering, copy that sequence.

This is the permanent rule book for how vehicle photos get displayed on
the website. Every vehicle follows these rules. New vehicles added to
inventory either get hand-classified (Phase 1) or auto-classified by
Bill's Vision API pipeline (Phase 2), but in both cases the final sort
order respects the priorities below.

---

## The master rule (above all others)

**The order Jeremiah hand-arranges in DealerCenter's Media tab IS the
order the website displays. Verbatim. No re-classification.**

When a customer opens a vehicle on loveautogroup.net, photo #1 in
DealerCenter is photo #1 on the site, photo #2 in DC is photo #2 on
the site, and so on. Jeremiah established this April 23 2026 with two
reference vehicles he had personally arranged in DealerCenter — the
2017 Subaru Forester (Stock #11326, 21 photos) and the 2016 Honda
Pilot Touring (Stock #11334, 30 photos). Both follow the same
exterior-first → interior-front-to-back → details-last pattern below.

The hero rule, the priority table, and the category list that follow
are the SAME pattern Jeremiah uses when arranging photos in
DealerCenter — they're documented here so automated classifiers
(Phase 2 Vision API as a fallback / sanity check) and any new
implementer can produce the same ordering when DC's order is
unavailable. **When DC's order IS available, use it directly.**

## The hero rule

**The first photo on every vehicle MUST be an exterior-front-3/4 shot.**

No exceptions. Not a dashboard. Not an interior. Not a badge closeup.
Not a side profile if a front-3/4 exists. Not a straight-front-on if a
3/4 exists. The hero is the front 3/4 — the one angle that shows:

- The grille
- Both headlights
- The driver's-side flank
- The proportions of the car at a glance

If a vehicle somehow has zero front-3/4 photos available, fall back
in this order: (1) exterior-front-straight → (2) exterior-side-3/4 →
(3) exterior-side → (4) exterior-rear-3/4 → (5) **alert Jordan** — no
interior photo should ever be the hero. If a vehicle lacks any usable
exterior, hold the listing until better photos are taken.

## Full sort priority

After the hero, photos are ordered by category priority. Within each
category, the classifier picks the strongest shot (cleanest framing,
best light, least clutter); the rest follow.

| Priority | Category | What it is |
|---|---|---|
| 1 | `exterior-front-3/4` | Hero — front grille + flank at an angle |
| 2 | `exterior-front-3/4` (alternates) | Second 3/4 shot if available |
| 3 | `exterior-side-driver` | Clean profile, driver's side |
| 4 | `exterior-side-passenger` | Clean profile, passenger side |
| 5 | `exterior-rear-3/4` | Rear grille + flank at an angle |
| 6 | `exterior-rear-3/4` (alternates) | Second 3/4 rear if available |
| 7 | `exterior-rear-straight` | Straight-on rear |
| 8 | `exterior-front-straight` | Straight-on front |
| 9 | `exterior-far` | Full-car wider framing / context shots |
| 10 | `exterior-detail` | Grille, badges, wheels close-ups |
| 11 | `interior-dashboard-full` | Wide view of the cockpit |
| 12 | `interior-dashboard-close` | Steering wheel, gauges, infotainment |
| 13 | `interior-front-seats` | Front driver + passenger seats |
| 14 | `interior-front-seat-close` | Individual seat closeups |
| 15 | `interior-back-seats` | Rear bench or captain's chairs |
| 16 | `interior-back-seat-close` | Rear seat closeups |
| 17 | `interior-cargo` | Trunk / cargo area |
| 18 | `interior-side` | Side view of the cabin |
| 19 | `engine-bay` | Hood-open engine shot |
| 20 | `engine-detail` | Close-ups of engine components |
| 21 | `wheels-tires` | Close-ups of wheels / tires / brakes |
| 22 | `misc-detail` | Badges, emblems, stitching, trim |
| 23 | `footwell` | Pedals / floor mats |
| 99 | `condition` | Any disclosed wear or damage (always last) |

## Why these priorities

Jordan's conversion rationale (from in-person sales data):

- **First photo decides whether someone keeps scrolling.** A car at its
  best angle hooks the shopper; a dashboard sends them back to the grid.
- **Exteriors establish desire.** Interior shots earn trust, but desire
  has to come first — otherwise they never get to trust.
- **Back seat after front seat** mirrors how shoppers mentally sit in
  the car during the daydream phase.
- **Engine and wheels at the end** because they're reassurance, not
  discovery.
- **Condition disclosures last** so shoppers see the strengths before
  the disclosures — we disclose honestly but we don't lead with flaws.

## Enforcement

### Phase 1 (current)

Every vehicle has a hand-classified entry in `src/data/photoOrder.ts`.
`applyPhotoOrder(slug, images)` reorders the image array on every
render. Vehicles with no manifest entry fall through to original order
— which is almost certainly wrong (see build-time warning below).

Any available vehicle without a manifest entry triggers a
`console.warn` at build time (`scripts/validate-photo-order.ts`). Check
the Cloudflare Pages build log after every push — if the warning
appears, classify the new vehicle's photos and add it to the manifest
before the next cut.

### Phase 2 (Bill — future)

Replace Phase 1's hand-classification with automated Vision API
classification during the Dealer Center sync. The pipeline:

1. On every Dealer Center photo import, run each photo through the
   Vision API (Google Cloud Vision or Anthropic Vision).
2. For each photo, extract a single category label from the list above.
3. For each vehicle, pick the best shot in each category (highest
   confidence + largest vehicle-in-frame area).
4. Emit a manifest entry in the same shape as `photoOrder.ts`.
5. The manifest commits back to the repo (or gets stored in KV and
   read at render time — Bill's call on implementation).

Target: zero-touch for Jordan on new arrivals. Classification quality
on exterior-vs-interior is essentially perfect with modern vision
models — the edge cases are "which of three front-3/4 shots is the
strongest," which can be heuristic (largest bounding box, center-weighted
composition).

## Edge cases

- **Convertibles** — the top-down shot is often the hero. Classify as
  `exterior-front-3/4` regardless of whether the roof is up or down.
- **Coupes / sports cars** — a low-angle front-3/4 reads as the hero
  even if it's slightly closer. OK to use.
- **SUVs / trucks** — standard front-3/4 preferred. Avoid over-low
  angles that exaggerate the grille.
- **Interior-only listings (rare)** — never ship. If a car somehow has
  no usable exterior, pause the listing and request new photos from Ivan.

## Where this applies

The sort rule affects **every place a vehicle image renders**:

| Component | What uses it |
|---|---|
| `VehicleCard.tsx` | Inventory grid, featured vehicles, make-landing grids, service-area pages |
| `PhotoGallery.tsx` | VDP main photo + thumbnail strip |
| `generateMetadata()` in `/inventory/[slug]/page.tsx` | `og:image` social share preview |
| Any future component that reads `vehicle.images` | Must go through `applyPhotoOrder(slug, images)` |

Rule for engineers: **never render `vehicle.images[0]` directly.** Always
pass through `applyPhotoOrder`.

## Changelog

- **2026-04-23** — Rules doc authored. Phase 1 manifest published with
  all 7 current lot vehicles classified. Build-time validation added.
