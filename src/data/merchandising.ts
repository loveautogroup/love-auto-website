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

  /**
   * Estimated fair market price for this vehicle (Jordan's research).
   * When set, the VDP renders a CarGurus-style price comparison bar:
   * Great Deal / Good Deal / Fair / Above Market based on the gap
   * between asking price and this estimate.
   * Source ideas: KBB Black Book, recent comparable sales, manual research.
   */
  marketEstimate?: number;
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
  // Jordan's hero picks in display order. Four selected to match the
  // Japanese specialist positioning + highest-margin units.
  featuredVins: [
    "5FNYF6H9XGB041495", // 2016 Honda Pilot Touring (newest, loaded)
    "JTHHE5BC2G5011456", // 2016 Lexus RC 350 (Japanese, luxury, premium margin)
    "1FA6P8TH6H1202495", // 2017 Ford Mustang EcoBoost Premium (desirable coupe)
    "2HNYD2H63AH509874", // 2010 Acura MDX Sport (value play, AWD, SH-AWD)
  ],

  defaultWarranty: "30-Day Warranty",

  overlays: {
    // 2016 Honda Pilot Touring — fresh arrival, third-row family hauler
    "5FNYF6H9XGB041495": {
      carfax: true,
      featurePills: [
        "Third-Row\nSeating",
        "Adaptive\nCruise",
        "Heated\nLeather",
      ],
      marketEstimate: 12500, // priced at $10,999 — Good Deal
    },

    // 2017 Ford Mustang EcoBoost Premium — sporty coupe, turbo
    "1FA6P8TH6H1202495": {
      carfax: true,
      featurePills: [
        "EcoBoost\nTurbo",
        "Premium\nPackage",
        "Heated\nLeather",
      ],
      marketEstimate: 14800, // priced at $13,999 — Fair
    },

    // 2010 Acura MDX Sport — value luxury SUV, SH-AWD, third-row under $5K
    "2HNYD2H63AH509874": {
      carfax: true,
      status: "price-reduced",
      featurePills: [
        "Super Handling\nAWD",
        "Third-Row\nSeats",
        "Under\n$5,000",
      ],
      marketEstimate: 5500, // priced at $4,499 — Great Deal
    },

    // 2013 GMC Terrain SLT-1 — well-equipped compact SUV
    "2GKALJEK6D1300009": {
      carfax: true,
      featurePills: [
        "Heated\nLeather",
        "Pioneer\nPremium Audio",
        "Remote\nStart",
      ],
      marketEstimate: 5400, // priced at $4,999 — Good Deal
    },

    // 2017 Hyundai Accent SE — efficient commuter sedan
    "KMHCT4AE6HU222547": {
      carfax: true,
      featurePills: [
        "36 Hwy\nMPG",
        "Under\n$4,000",
        "Commuter\nReady",
      ],
      marketEstimate: 4500, // priced at $3,999 — Good Deal
    },

    // 2016 Lexus RC 350 — Japanese luxury coupe, premium margin hero
    "JTHHE5BC2G5011456": {
      carfax: true,
      status: "staff-pick",
      featurePills: [
        "306 HP\nV6",
        "Blind Spot\nMonitor",
        "Premium\nPackage",
      ],
      marketEstimate: 19200, // priced at $17,999 — Good Deal
    },

    // 2008 Saab 9-3 2.0T Convertible — niche, unique, under $2,500
    "YS3FB79Y886005860": {
      carfax: true,
      status: "price-drop",
      featurePills: [
        "Power\nConvertible",
        "Turbo\nPerformance",
        "Under\n$2,500",
      ],
      marketEstimate: 3200, // priced at $2,499 — Great Deal
    },
  },

  lastUpdated: "2026-04-20",
  updatedBy: "Jordan (initial merchandising pass)",
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
