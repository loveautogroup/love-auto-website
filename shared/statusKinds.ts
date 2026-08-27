/**
 * statusKinds — the single canonical list of merchandising status-badge
 * values.
 *
 * This list previously existed TWICE, in two runtimes that can't see each
 * other: `functions/_lib/validation.ts` (edge, validates admin writes) and
 * `src/data/merchandising.ts` (the app's StatusBadgeKind union). They
 * drifted — the validator was missing "coming-soon" while both the type
 * and StatusPill's VARIANTS map supported it, so saving that perfectly
 * valid status was rejected as invalid.
 *
 * Both sides now derive from this one array, which makes that class of
 * drift a type error instead of a runtime surprise. Adding a status means
 * editing this file and StatusPill's VARIANTS map — and StatusPill's map is
 * typed as Record<StatusBadgeKind, …>, so forgetting it won't compile.
 */

export const STATUS_KINDS = [
  "just-arrived",
  "price-reduced",
  "price-drop",
  "staff-pick",
  "low-mileage",
  "sale-pending",
  // Set automatically from the DMS when a car sells — a recently-sold car
  // keeps its VDP for 30 days and must not wear "Just Arrived".
  // resolveOverlay() gives it priority over every other kind.
  "sold",
  "coming-soon",
  "hot-deal",
  "great-deal",
  "below-market",
  "managers-special",
  "reconditioned",
  "off-lease",
  "trade-in",
  "new-arrival",
  "must-see",
  "rare-find",
  "loaded",
  "make-offer",
] as const;

export type StatusKind = (typeof STATUS_KINDS)[number];

/** Runtime guard for values arriving from KV or an admin request body. */
export function isStatusKind(value: unknown): value is StatusKind {
  return (
    typeof value === "string" &&
    (STATUS_KINDS as readonly string[]).includes(value)
  );
}
