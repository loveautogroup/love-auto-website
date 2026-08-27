/**
 * Adapter — convert the InventorySnapshot returned by /api/inventory into
 * the UI-facing Vehicle shape (src/lib/types.ts).
 *
 * Why an adapter:
 *   - Decouples the wire format from the React tree. /api/inventory can
 *     evolve its output independently as long as the adapter keeps
 *     producing Vehicle objects.
 *   - Lets us populate the `description` field — Dealer Center doesn't ship
 *     long-form descriptions; we generate a fallback from the structured
 *     fields and let Mark hand-edit specific vehicles via merchandising
 *     overrides later.
 *   - Lets us swap in PHOTO_ORDER reordering at boundary, so the rest of
 *     the app can ignore the raw photo order from DC.
 *
 * Shape contract (must stay in sync):
 *   SyncedVehicle (declared just below) → what /api/inventory emits
 *   src/lib/types.ts → Vehicle          → what the React tree consumes
 *
 * SyncedVehicle originally mirrored workers/inventory-sync/src/types.ts.
 * That worker was retired 2026-08-03 (it parsed the DealerCenter feed,
 * retired as a source 2026-06-04), so THIS file is now the definition to
 * track, alongside the matching interface in functions/api/inventory.ts.
 */

import type { Vehicle } from "@/lib/types";
import { displayCase, dedupeTrim } from "../../shared/displayCase";

export interface SyncedVehicle {
  vin: string;
  /** Branded baked hero for social/og use; display hero stays raw. */
  bakedHeroUrl?: string | null;
  stockNumber?: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  bodyStyle: string;
  drivetrain: string;
  transmission: string;
  fuelType: string;
  engine: string;
  exteriorColor: string;
  interiorColor: string;
  mileage: number;
  price: number;
  status: "available" | "sale-pending" | "sold" | "coming-soon";
  /** ISO date the car sold — present only on recently-sold rows.
   *  PARITY CHAIN: routers/public.py -> DMS proxy -> here -> Vehicle. */
  soldDate?: string | null;
  features: string[];
  /** Long-form marketing copy from the DMS public feed
   *  (Railway vehicle.description). Empty/absent -> the VDP falls back to
   *  the hand-written seed description for this slug. */
  description?: string | null;
  daysOnLot: number;
  dateInStock: string;
  images: string[];
  dealerCenterFirstSeen: string;
  dealerCenterLastSeen: string;
  /** Public feed flag — true if asking_price decreased in the last 14 days.
   *  Source of truth: dms-inventory-api pricing_history.is_recently_reduced(),
   *  surfaced as `recently_reduced` on the public DMS feed. Optional for
   *  back-compat with snapshots that predate the flag. */
  recentlyReduced?: boolean;
  /** Phase 2 photo pipeline — VDPWalkaround source URLs.
   *  Source of truth: dms-inventory-api media.walkaround_url and
   *  walkaround_poster_url. Both null in Phase 1; VDPWalkaround
   *  renders nothing when null. Added 2026-05-01 to align with
   *  the ab5ebff Phase 2 walkaround commit. */
  walkaroundUrl?: string | null;
  walkaroundPosterUrl?: string | null;
  /** AS-IS flag from Railway public feed. Optional — KV snapshots from
   *  the DC sync worker don't carry this field; treat absent as true. */
  asIs?: boolean;
  /** Known defects disclosed by the seller. Null when none documented. */
  knownIssues?: string | null;
}

export interface InventorySnapshot {
  syncedAt: string;
  syncedBy: "cron" | "manual";
  vehicles: SyncedVehicle[];
}

/**
 * How fresh the committed snapshot must be to be trusted as build input.
 *
 * `prebuild` rewrites inventory-snapshot.json seconds before `next build`
 * starts, so any real deploy satisfies this comfortably. Anything older
 * means prebuild did not run, and the file on disk is whatever was last
 * committed.
 *
 * Shared deliberately. This constant used to live privately inside
 * dmsInventory.ts, which meant the server path age-checked the snapshot
 * and the static path (data/inventory.ts -> sampleInventory) did not.
 * On 2026-08-23 that split shipped a sold Forester into the prerendered
 * listing grids while the server-rendered copy on the very same page was
 * correct: one page, two data ages. One constant, both readers.
 */
export const SNAPSHOT_MAX_AGE_MS = 6 * 60 * 60 * 1000;

/** Age of a snapshot in ms, or null when it carries no parseable
 *  `syncedAt` — which callers must treat as untrustworthy, not as fresh. */
export function snapshotAgeMs(snapshot: InventorySnapshot): number | null {
  const stamp = snapshot?.syncedAt ? Date.parse(snapshot.syncedAt) : NaN;
  if (!Number.isFinite(stamp)) return null;
  return Date.now() - stamp;
}

export function adaptSnapshot(snapshot: InventorySnapshot): Vehicle[] {
  return snapshot.vehicles.map(adaptVehicle);
}

export function adaptVehicle(v: SyncedVehicle): Vehicle {
  return {
    id: v.stockNumber ?? v.vin,
    slug: v.slug,
    vin: v.vin,
    stockNumber: v.stockNumber ?? "",
    year: v.year,
    // E3: idempotent display casing at the adapter too — the feed function
    // applies the same helpers, but committed snapshots fetched from an
    // older deploy would otherwise ship "Slk350"/"Mkz" for one more build.
    make: displayCase(v.make),
    model: displayCase(v.model),
    trim: dedupeTrim(displayCase(v.model), displayCase(v.trim)),
    price: v.price,
    mileage: v.mileage,
    exteriorColor: v.exteriorColor,
    interiorColor: v.interiorColor,
    drivetrain: v.drivetrain,
    transmission: v.transmission,
    engine: v.engine,
    bodyStyle: v.bodyStyle,
    fuelType: v.fuelType,
    description: synthesizeDescription(v),
    features: v.features,
    images: v.images,
    status: v.status,
    dateInStock: v.dateInStock,
    daysOnLot: v.daysOnLot,
    recentlyReduced: Boolean(v.recentlyReduced),
    bakedHeroUrl: v.bakedHeroUrl ?? null,
    asIs: v.asIs ?? true,
    knownIssues: v.knownIssues ?? null,
  };
}

/**
 * Generate a baseline description from structured fields. Mark's hand-written
 * descriptions live in src/data/inventory.ts and take precedence — we only use
 * this when KV is the source of truth (Dealer Center doesn't ship long-form
 * marketing copy). Once we add a merchandising-overrides KV layer, vehicle-
 * specific descriptions can override this string.
 */
function synthesizeDescription(v: SyncedVehicle): string {
  const parts: string[] = [];
  parts.push(`${v.year} ${v.make} ${v.model}${v.trim ? " " + v.trim : ""}.`);
  if (v.mileage) {
    parts.push(`${v.mileage.toLocaleString()} miles.`);
  }
  if (v.drivetrain && v.transmission) {
    parts.push(`${v.drivetrain} ${v.transmission}.`);
  }
  if (v.engine) {
    parts.push(`Powered by ${v.engine}.`);
  }
  if (v.exteriorColor && v.interiorColor) {
    parts.push(`${v.exteriorColor} exterior, ${v.interiorColor} interior.`);
  }
  parts.push(
    "Inspected, reconditioned, and ready to drive home from 735 N Yale Ave, Villa Park. Call or text (630) 359-3643 to set up a test drive."
  );
  return parts.join(" ");
}
