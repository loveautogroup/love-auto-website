/**
 * Shared types for the inventory sync.
 *
 * Mirror of the SyncedVehicle shape used by the website. Keep this in
 * sync with src/lib/types.ts on the Pages side, otherwise the API
 * contract drifts.
 */

export type Drivetrain = "AWD" | "FWD" | "RWD" | "4WD";
export type VehicleStatus = "available" | "sale-pending" | "sold";

export interface SyncedVehicle {
  vin: string;
  stockNumber?: string;
  slug: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  bodyStyle: string;
  drivetrain: Drivetrain;
  transmission: string;
  fuelType: string;
  engine: string;
  exteriorColor: string;
  interiorColor: string;
  mileage: number;
  price: number;
  status: VehicleStatus;
  features: string[];
  daysOnLot: number;
  dateInStock: string; // ISO YYYY-MM-DD
  images: string[]; // R2 URLs in display order
  dealerCenterFirstSeen: string;
  dealerCenterLastSeen: string;
}

export interface InventorySnapshot {
  syncedAt: string;
  syncedBy: "cron" | "manual";
  vehicles: SyncedVehicle[];
}

export interface SyncLog {
  syncedAt: string;
  durationMs: number;
  vehiclesIn: number;
  vehiclesOut: number;
  added: string[];
  updated: string[];
  removed: string[];
  photosDownloaded: number;
  errors: string[];
  feedSource: string;
  parserUsed: string;
}

/** Cloudflare bindings the worker expects. Configured in wrangler.toml. */
export interface Env {
  /** KV: canonical inventory snapshot + sync logs */
  INVENTORY: KVNamespace;
  /** R2: vehicle photo storage */
  PHOTOS: R2Bucket;
  /** Dealer Center feed URL — set via `wrangler secret put` */
  DEALER_CENTER_FEED_URL?: string;
  /** Optional Basic Auth or Bearer token for the feed */
  DEALER_CENTER_FEED_AUTH?: string;
  /**
   * Parser to use. Defaults to "stub" until DC tells us their format.
   * After they respond with the feed URL, set PARSER to one of:
   *   - "adf-xml"       (industry-standard ADF/IMS XML)
   *   - "dealer-xml"    (DC custom XML)
   *   - "csv"           (DC CSV export)
   *   - "stub"          (no-op, useful for dry-run testing)
   */
  PARSER?: string;
  /** Optional Healthchecks.io URL to ping on success */
  HEALTHCHECK_URL?: string;
  /**
   * Public base URL where the R2 PHOTOS bucket is exposed.
   * E.g. "https://photos.loveautogroup.net" (custom domain on R2)
   * or "https://pub-xxxxx.r2.dev" (R2 public bucket dev URL).
   * If unset, photos sync still works but the rewritten image URLs
   * will be relative paths starting with /vehicles/...
   */
  PHOTOS_PUBLIC_BASE?: string;
}
