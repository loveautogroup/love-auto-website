/**
 * Merchandising overlay config.
 *
 * This file is Jordan's control surface for how vehicles are presented on the site:
 * which cars are featured, in what order, what feature-pill copy appears on the
 * photo, which status badge shows, and which cards have Carfax / warranty flags.
 *
 * Current workflow (MVP): edit this file directly and commit.
 * Cloudflare Pages rebuilds the site automatically (~90 seconds).
 *
 * Phase 2 will move this data into Cloudflare KV with an admin UI at
 * /admin/merchandising so Jordan can edit without touching code. The types
 * defined here are the same shape that KV will store, so the migration is
 * a drop-in swap.
 */

export type StatusBadgeKind =
  | "just-arrived"
  | "price-reduced"
  | "price-drop"
  | "staff-pick"
  | "low-mileage"
  | "sale-pending";

/**
 * Per-vehicle overlay settings, keyed by VIN.
 *
 * All fields are optional. When a field is omitted, the site falls back to
 * sensible defaults (e.g. "Just Arrived" auto-shows for cars under 14 days).
 */
export interface VehicleOverlay {
  /** Status pill shown top-left when no Carfax is available. Overrides auto-detected status. */
  status?: StatusBadgeKind;

  /** Whether the CARFAX Free Report button shows. Requires a Carfax report for the VIN. */
  carfax?: boolean;

  /**
   * Up to 3 custom feature pills displayed top-center over the photo.
   * Each pill supports a two-line break using \n. Keep each line under ~14 characters.
   * Examples: "Blacked-Out\nAdventure Ready", "Symmetrical\nAWD", "LED Off-Road\nLight Bar"
   */
  featurePills?: [string?, string?, string?];

  /** Override the default warranty copy on this card. Defaults to DEFAULT_WARRANTY. */
  warrantyOverride?: string;

  /** Hide this vehicle from the site entirely, even if it's active in Dealer Center. */
  hidden?: boolean;
}

export interface MerchandisingConfig {
  /**
   * Ordered list of VINs that pin to the top of the inventory grid and fill
   * the homepage Featured Vehicles section. Order matters.
   */
  featuredVins: string[];

  /** Default warranty copy shown on every vehicle card (unless overridden). */
  defaultWarranty: string;

  /** Per-VIN overlay settings. */
  overlays: Record<string, VehicleOverlay>;

  /** Audit trail — informational, shown on the admin page when it ships. */
  lastUpdated: string;
  updatedBy: string;
}

export const MERCHANDISING: MerchandisingConfig = {
  featuredVins: [
    // Jordan picks 3-6 heroes here, in display order.
    // VINs come from src/data/inventory.ts.
    "5FNYF6H9XGB041495", // 2016 Honda Pilot Touring
    "1FA6P8TH6H1202495", // 2017 Ford Mustang EcoBoost Premium
  ],

  defaultWarranty: "30-Day Warranty",

  overlays: {
    // 2016 Honda Pilot Touring — example of a hero listing with full overlay
    "5FNYF6H9XGB041495": {
      carfax: true,
      featurePills: [
        "Third-Row\nSeating",
        "Adaptive\nCruise",
        "Heated\nLeather",
      ],
    },

    // 2017 Ford Mustang EcoBoost Premium
    "1FA6P8TH6H1202495": {
      carfax: true,
      featurePills: [
        "EcoBoost\nTurbo",
        "Premium\nPackage",
        "Heated\nLeather Seats",
      ],
    },
  },

  lastUpdated: "2026-04-20",
  updatedBy: "Charlotte (initial config)",
};

/**
 * Helper — resolves the effective overlay for a vehicle, applying auto-detected
 * defaults (e.g. Just Arrived for new inventory) when no override is set.
 */
export function resolveOverlay(
  vin: string,
  daysOnLot: number,
  vehicleStatus: "available" | "sale-pending" | "sold"
): VehicleOverlay & { effectiveStatus?: StatusBadgeKind } {
  const override = MERCHANDISING.overlays[vin] ?? {};

  // Priority: manual status > Sale Pending > Just Arrived (new inventory)
  let effectiveStatus: StatusBadgeKind | undefined = override.status;
  if (!effectiveStatus && vehicleStatus === "sale-pending") {
    effectiveStatus = "sale-pending";
  }
  if (!effectiveStatus && daysOnLot <= 14) {
    effectiveStatus = "just-arrived";
  }

  return { ...override, effectiveStatus };
}

/**
 * Helper — returns featured vehicles from an inventory list in the order
 * specified in MERCHANDISING.featuredVins. Non-featured vehicles are excluded.
 */
export function filterFeatured<T extends { vin: string }>(vehicles: T[]): T[] {
  const byVin = new Map(vehicles.map((v) => [v.vin, v]));
  return MERCHANDISING.featuredVins
    .map((vin) => byVin.get(vin))
    .filter((v): v is T => v !== undefined);
}

/**
 * Helper — returns vehicles sorted with featured VINs pinned to the top
 * (in MERCHANDISING order), followed by the rest in their original order.
 * Hidden VINs are filtered out.
 */
export function sortWithFeaturedFirst<T extends { vin: string }>(
  vehicles: T[]
): T[] {
  const featuredSet = new Set(MERCHANDISING.featuredVins);
  const hiddenSet = new Set(
    Object.entries(MERCHANDISING.overlays)
      .filter(([, overlay]) => overlay.hidden)
      .map(([vin]) => vin)
  );

  const visible = vehicles.filter((v) => !hiddenSet.has(v.vin));
  const featured = filterFeatured(visible);
  const rest = visible.filter((v) => !featuredSet.has(v.vin));

  return [...featured, ...rest];
}
