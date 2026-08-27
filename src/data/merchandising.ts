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

import type { StatusKind } from "../../shared/statusKinds";

/**
 * Derived from shared/statusKinds.ts so this union and the edge validator
 * in functions/_lib/validation.ts can never disagree again — they used to
 * be hand-maintained copies and drifted (see that file's header).
 */
export type StatusBadgeKind = StatusKind;

/**
 * Per-vehicle overlay settings, keyed by VIN.
 *
 * All fields are optional. When a field is omitted, the site falls back to
 * sensible defaults (e.g. "Just Arrived" auto-shows for cars under 14 days).
 */
export interface VehicleOverlay {
  /** Status pill shown top-left when no Carfax is available. Overrides auto-detected status. */
  status?: StatusBadgeKind;

  /**
   * Whether we WANT to advertise CARFAX on this car — the dealer's own call,
   * set from the DMS merchandising panel. Turned off for cars where a report
   * exists and works but we would rather not lead with it (a branded title, a
   * rough history). Never written by automation.
   */
  carfax?: boolean;

  /**
   * Whether the public CARFAX link actually SERVES a free report right now,
   * as observed by the daily carfax-link-check Routine. CARFAX only honours
   * our partner=DVW_1 link while the car is in their Hot Listings index and
   * within 2 months of the report being run; outside that window it redirects
   * the shopper to a $49.99 order page. `false` means we watched it do exactly
   * that. Written ONLY by the Routine.
   *
   * Kept separate from `carfax` on purpose. They answer different questions
   * ("should we?" vs "does it work?") and have different owners, and while
   * they shared one flag the robot's nightly verdict would overwrite the
   * dealer's merchandising decision.
   */
  carfaxLinkLive?: boolean;

  /**
   * Up to 5 custom feature pills displayed top-center over the photo.
   * Each pill supports a two-line break using \n. Keep each line under ~14 characters.
   * Examples: "Blacked-Out\nAdventure Ready", "Symmetrical\nAWD", "LED Off-Road\nLight Bar"
   */
  featurePills?: [string?, string?, string?, string?, string?];

  /**
   * Per-vehicle warranty copy, e.g. "30-Day Warranty", "60-Day Powertrain
   * Warranty". Set to opt this vehicle into showing the warranty badge on
   * its VDP hero. Leave undefined for vehicles sold as-is (no warranty
   * badge will render anywhere).
   */
  warranty?: string;

  /** Hide this vehicle from the site entirely, even if it's active in Dealer Center. */
  hidden?: boolean;

  /** When true, the public site uses the branded "Coming Soon" placeholder
   *  as this vehicle's hero image, regardless of whether photos are present.
   *  Mirrors the same field on the DMS merchandising panel. Useful for
   *  IN_RECON cars you want to tease without showing rough in-progress
   *  shots, or to override the auto-fallback when you DON'T want the
   *  placeholder shown. */
  useComingSoonPlaceholder?: boolean;

  /**
   * Estimated fair market price for this vehicle (Jordan's research).
   * When set, the VDP renders a CarGurus-style price comparison bar:
   * Great Deal / Good Deal / Fair / Above Market based on the gap
   * between asking price and this estimate.
   * Source ideas: KBB Black Book, recent comparable sales, manual research.
   */
  marketEstimate?: number;

  /**
   * Per-vehicle override for the "Text Us" phone number on the VDP.
   * Format: digits only (no parens or dashes), e.g. "6303593643".
   * When set, this VIN's VDP routes Text Us SMS to this number instead of
   * the global MerchandisingConfig.textPhone (which itself falls back to
   * SITE_CONFIG.phoneRaw). Useful when a specific salesperson is
   * point-of-contact for a particular vehicle.
   */
  textPhone?: string;

  // ── Carfax data (set per vehicle in the DMS merchandising panel) ────
  /** Vehicle has had only one previous owner per Carfax. */
  carfaxOneOwner?: boolean;
  /** No accidents reported on Carfax. */
  carfaxNoAccidents?: boolean;
  /** Carfax shows documented service records. */
  carfaxServiceRecords?: boolean;
  /** Carfax title status is clean (not salvage/rebuilt/flood/lemon). */
  carfaxCleanTitle?: boolean;
  /** Carfax mileage readings are consistent (no rollback / discrepancy). */
  carfaxVerifiedMileage?: boolean;
  /** No open OEM safety recalls. */
  carfaxNoOpenRecalls?: boolean;
  /** Personal-use only (non-commercial). Manual flag for now. */
  carfaxPersonalUse?: boolean;
  /** Index into the variant phrasings (defined in CARFAX_PILL_VARIANTS
   *  below) for each Carfax highlight chip. Lets Jordan pick a different
   *  wording per vehicle and have it persist. */
  carfaxOneOwnerVariant?: number;
  carfaxNoAccidentsVariant?: number;
  carfaxServiceRecordsVariant?: number;
  carfaxCleanTitleVariant?: number;
  carfaxVerifiedMileageVariant?: number;
  carfaxNoOpenRecallsVariant?: number;
  carfaxPersonalUseVariant?: number;
  /** Public Carfax report URL. Customers click the shield on the VDP to
   *  view it; auto-built from VIN at panel save time using the standard
   *  Carfax pattern. */
  carfaxReportUrl?: string;

  /**
   * Show the Google Reviews badge on the VDP hero photo. Default true.
   * Set false to hide per-vehicle (e.g. for coming-soon or off-market units).
   */
  showGoogleReviewsBadge?: boolean;
}

/**
 * Variant phrasings for the three Carfax highlight pills. Mirrors the
 * CARFAX_VARIANTS const in the DMS MerchandisingPanel — must stay in
 * sync. Index lookup is bounds-checked with clamp() before render.
 *
 * Pill text honors the two-line / 14-char-per-line format used by the
 * regular feature pills. Defaults (index 0) are the safe canonical
 * phrasings; later entries are alternates Jordan can rotate through.
 */
export const CARFAX_PILL_VARIANTS: Record<
  | "oneOwner"
  | "noAccidents"
  | "serviceRecords"
  | "cleanTitle"
  | "verifiedMileage"
  | "noOpenRecalls"
  | "personalUse",
  Array<{ pill: string }>
> = {
  oneOwner: [
    { pill: "1-Owner" },
    { pill: "Single\nOwner" },
    { pill: "Original\nOwner" },
    { pill: "One\nOwner" },
    { pill: "1-Owner\nVehicle" },
  ],
  noAccidents: [
    { pill: "No Accidents" },
    { pill: "Accident\nFree" },
    { pill: "Clean\nHistory" },
    { pill: "Zero\nAccidents" },
    { pill: "Crash\nFree" },
  ],
  serviceRecords: [
    { pill: "Service\nRecords" },
    { pill: "Service\nHistory" },
    { pill: "Records\nVerified" },
    { pill: "Maintained\nRecords" },
    { pill: "Records\nDocumented" },
  ],
  cleanTitle: [
    { pill: "Clean Title" },
    { pill: "Title\nGuaranteed" },
    { pill: "No Title\nIssues" },
    { pill: "Verified\nClean" },
    { pill: "Title\nVerified" },
  ],
  verifiedMileage: [
    { pill: "Verified\nMileage" },
    { pill: "Odometer\nOK" },
    { pill: "No\nRollback" },
    { pill: "Mileage\nConfirmed" },
    { pill: "Mileage\nVerified" },
  ],
  noOpenRecalls: [
    { pill: "No Open\nRecalls" },
    { pill: "Recall\nFree" },
    { pill: "No Pending\nRecalls" },
    { pill: "Recalls\nClear" },
    { pill: "Up to\nDate" },
  ],
  personalUse: [
    { pill: "Personal\nUse" },
    { pill: "Non-\nCommercial" },
    { pill: "Family\nOwned" },
    { pill: "Personal\nVehicle" },
    { pill: "Owner\nDriven" },
  ],
};

export interface MerchandisingConfig {
  /**
   * Ordered list of VINs that pin to the top of the inventory grid and fill
   * the homepage Featured Vehicles section. Order matters.
   */
  featuredVins: string[];

  /**
   * Phone number where customer text messages are received. Used by the
   * "Text Us" button on the VDP. If unset, falls back to SITE_CONFIG.phoneRaw.
   * Format: digits only (no parens or dashes), e.g. "6303593643".
   * Allows routing texts to a different number than calls — e.g. a sales
   * line that's monitored 24/7 vs the main shop line.
   */
  textPhone?: string;

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
    // 2026-04-27: Featured rotated to the 3 cleanest active units after a
    // full Carfax sweep on every vehicle. Previous picks pulled because:
    //   - Honda Pilot 5FNYF6H9XGB041495: SOLD 04/13/2026
    //   - Lexus RC 350: 2 airbag deployments (still listed, just not featured)
    //   - Mustang 1FA6P8TH6H1202495: VIN typo (real Mustang is H5, NAM title brand)
    //   - Acura MDX 2HNYD2H63AH509874: 4 accidents reported
    "KMHCT4AE6HU222547", // 2017 Hyundai Accent SE
    "2GKALUEK6D6300009", // 2013 GMC Terrain SLT-1
    // 2026-05-20: Forester JF2SJAGC1HH553881 removed — status Photo Ready, not Listed
  ],

  overlays: {
    // 2011 Subaru Legacy 2.5i Limited — stock 10976. Verified 2026-08-26:
    // the public CARFAX link redirects to the $49.99 order page, because the
    // car was only just listed and has not reached CARFAX's Hot Listings
    // index yet. Nothing is wrong with the car or the report — 72 history
    // records exist.
    //
    // This is `carfaxLinkLive`, not `carfax`: it records what the link DOES,
    // not a merchandising decision, so when the carfax-link-check Routine
    // sees the report go live it flips this and the badge returns on its own.
    //
    // The live KV overlay carries the same value; this static entry is what
    // keeps it out of the PRERENDERED HTML too. Without it the badge and
    // button ship in the markup and are only removed after hydration — a
    // visible flash, and a link crawlers still follow.
    "4S3BMCK61B3263681": {
      carfaxLinkLive: false,
    },

    // 2016 Honda Pilot Touring — fresh arrival, third-row family hauler
    "5FNYF6H9XGB041495": {
      carfax: true,
      featurePills: [
        "Third-Row\nSeating",
        "Adaptive\nCruise",
        "Heated\nLeather",
      ],
      marketEstimate: 12500, // priced at $10,999 — Good Deal
      warranty: "30-Day Warranty",
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
      warranty: "30-Day Powertrain Warranty",
    },

    // 2010 Acura MDX Sport — high mileage, sold as-is, no warranty
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

    // 2013 GMC Terrain SLT-1 — well-equipped compact SUV, sold as-is
    "2GKALJEK6D1300009": {
      carfax: true,
      featurePills: [
        "Heated\nLeather",
        "Pioneer\nPremium Audio",
        "Remote\nStart",
      ],
      marketEstimate: 5400, // priced at $4,999 — Good Deal
    },

    // 2017 Hyundai Accent SE — efficient commuter sedan, sold as-is
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
      warranty: "30-Day Warranty",
    },

    // 2008 Saab 9-3 2.0T Convertible — niche, sold as-is
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

    // 2017 Subaru Forester 2.5i Premium — hidden: Photo Ready in Railway, not Listed
    // 2026-05-21: pulled from site until photos are approved and status flips to Listed
    "JF2SJAGC1HH553881": {
      hidden: true,
    },
  },

  lastUpdated: "2026-04-20",
  updatedBy: "Jordan (initial merchandising pass)",
};

/**
 * Helper — resolves the effective overlay for a vehicle, applying auto-detected
 * defaults (e.g. Just Arrived for new inventory) when no override is set.
 */
/**
 * Which status pill a vehicle wears. ONE definition — the server/build
 * resolveOverlay() and the client useResolveOverlay() both call this.
 *
 * It lived in both files as copy-pasted twins, and they drifted the moment
 * "sold" was added: the hero of a sold Outback kept a green JUST ARRIVED pill
 * because only the server copy had been fixed.
 *
 * Priority, highest first:
 *   sold          a sold car keeps its VDP for 30 days and must never look
 *                 available. Outranks a manual override — nobody meant to
 *                 advertise "Staff Pick" on a car that is gone.
 *   coming-soon   set by the DMS, not a merchandising choice.
 *   manual        whatever Jordan picked in the merchandising panel.
 *   sale-pending  a deposit is down.
 *   just-arrived  on the lot 14 days or less.
 */
export function pickStatusPill(
  vehicleStatus: "available" | "sale-pending" | "sold" | "coming-soon",
  manual: StatusBadgeKind | undefined,
  daysOnLot: number,
): StatusBadgeKind | undefined {
  if (vehicleStatus === "sold") return "sold";
  if (vehicleStatus === "coming-soon") return "coming-soon";
  if (manual) return manual;
  if (vehicleStatus === "sale-pending") return "sale-pending";
  if (daysOnLot > 0 && daysOnLot <= 14) return "just-arrived";
  return undefined;
}

export function resolveOverlay(
  vin: string,
  daysOnLot: number,
  vehicleStatus: "available" | "sale-pending" | "sold" | "coming-soon",
  recentlyReduced = false
): VehicleOverlay & { effectiveStatus?: StatusBadgeKind } {
  const override = MERCHANDISING.overlays[vin] ?? {};

  // Priority: coming-soon > manual status > sale-pending > just-arrived.
  // NOTE: the auto "price-reduced" flag was removed per Jeremiah 2026-05-09.
  // The `recentlyReduced` arg + the `price-reduced` StatusPill variant are
  // kept intact so the merchandising admin can still pick it manually if
  // desired — only the auto-flip from the DMS feed is suppressed.
  void recentlyReduced;
  const effectiveStatus = pickStatusPill(vehicleStatus, override.status, daysOnLot);

  // Default-on for the Carfax shield/button: every Love Auto vehicle is
  // sold with a free Carfax, so it should appear on every VDP unless
  // Jordan explicitly opts a vehicle OUT in the merchandising panel
  // (e.g. while waiting for a fresh report). The DMS panel writes
  // `carfax: false` to opt out and omits the field to keep the default.
  const carfax = override.carfax !== false;

  return { ...override, carfax, effectiveStatus };
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
