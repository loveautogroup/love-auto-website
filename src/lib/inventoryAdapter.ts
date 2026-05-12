/**
 * Adapter — convert the InventorySnapshot returned by /api/inventory
 * (which mirrors workers/inventory-sync/src/types.ts → SyncedVehicle) into
 * the UI-facing Vehicle shape (src/lib/types.ts).
 *
 * Why an adapter:
 *   - Decouples the wire format from the React tree. The Cron Worker can
 *     evolve its parser output independently as long as the adapter keeps
 *     producing Vehicle objects.
 *   - Lets us populate the `description` field — Dealer Center doesn't ship
 *     long-form descriptions; we generate a fallback from the structured
 *     fields and let Mark hand-edit specific vehicles via merchandising
 *     overrides later.
 *   - Lets us swap in PHOTO_ORDER reordering at boundary, so the rest of
 *     the app can ignore the raw photo order from DC.
 *
 * Shape contract (must stay in sync):
 *   workers/inventory-sync/src/types.ts → SyncedVehicle
 *   src/lib/types.ts                    → Vehicle
 */

import type { Vehicle } from "@/lib/types";

export interface SyncedVehicle {
  vin: string;
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
  features: string[];
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
    make: v.make,
    model: v.model,
    trim: v.trim,
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
