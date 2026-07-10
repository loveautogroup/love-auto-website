/**
 * Build-time + runtime DMS inventory adapter.
 *
 * One module shared by:
 *   - generateStaticParams in /inventory/[slug]/page.tsx (build-time fetch
 *     so live-only vehicles get pre-rendered VDPs)
 *   - sitemap.ts (so DMS-discovered VINs land in the sitemap on rebuild)
 *   - any client component that wants to talk to DMS directly without
 *     going through the Pages Function (rare; useInventory is the
 *     normal path)
 *
 * Wire shape mirrors functions/api/inventory.ts. If you change one, change
 * the other — the contract has to stay symmetric.
 */
import type { Vehicle } from "@/lib/types";
import type { SyncedVehicle } from "@/lib/inventoryAdapter";
import { titleCase, vehicleSlug, SEED_SLUGS_BY_VIN as SHARED_SEED_SLUGS } from "../../shared/slug";

// Re-export for any external consumer that previously imported from here.
// All slug logic lives in shared/slug.ts now — change there, not here.
export const SEED_SLUGS_BY_VIN = SHARED_SEED_SLUGS;

export const DMS_PUBLIC_INVENTORY_URL =
  "https://dms.loveautogroup.net/api/v1/public/inventory";

const RAILWAY_BADGE_CONFIG_URL =
  "https://web-production-d5f3a.up.railway.app/api/badge-config/global-public";

export interface GlobalBadgeConfig {
  dealer_badge_enabled: boolean;
  dealer_badge_position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  dealer_badge_size_pct: number;
  google_badge_enabled: boolean;
  google_badge_position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  phone_badge_enabled: boolean;
  phone_number: string;
  phone_badge_position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  carfax_badge_enabled: boolean;
  carfax_badge_position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  margin_pct: number;
}

const BADGE_CONFIG_FALLBACK: GlobalBadgeConfig = {
  dealer_badge_enabled: true,
  dealer_badge_position: "bottom-right",
  dealer_badge_size_pct: 28,
  google_badge_enabled: true,
  google_badge_position: "bottom-right",
  phone_badge_enabled: true,
  phone_number: "(630) 359-3643",
  phone_badge_position: "bottom-left",
  carfax_badge_enabled: true,
  carfax_badge_position: "top-left",
  margin_pct: 2.2,
};

/**
 * Fetch global badge config from Railway (no auth required).
 * Called at build time from VDP pages. Falls back to safe defaults on error.
 */
export async function fetchGlobalBadgeConfig(): Promise<GlobalBadgeConfig> {
  try {
    const res = await fetch(RAILWAY_BADGE_CONFIG_URL, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return BADGE_CONFIG_FALLBACK;
    const data = (await res.json()) as Partial<GlobalBadgeConfig>;
    return { ...BADGE_CONFIG_FALLBACK, ...data };
  } catch {
    return BADGE_CONFIG_FALLBACK;
  }
}

interface DmsPhoto {
  url: string;
  isPrimary?: boolean;
}

interface DmsVehicle {
  id: string | number;
  vin: string;
  stockNumber?: string;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  mileage?: number | null;
  retailPrice?: number | null;
  exteriorColor?: string | null;
  interiorColor?: string | null;
  bodyStyle?: string | null;
  drivetrain?: string | null;
  transmission?: string | null;
  fuelType?: string | null;
  engine?: string | null;
  description?: string | null;
  status?: string | null;
  daysOnLot?: number | null;
  features?: string[] | null;
  photos?: DmsPhoto[] | null;
  dateInStock?: string | null;
  /** Recently Reduced flag from dms-inventory-api public feed.
   *  True if asking_price decreased in the last 14 days. Optional —
   *  older deploys of the DMS may omit it; treat absent as false. */
  recently_reduced?: boolean | null;
  /** AS-IS flag — true when vehicle is sold as-is (no dealer warranty).
   *  Added in Railway commit 83e3af6; optional for back-compat. */
  as_is?: boolean | null;
  /** Known defects documented by the seller. Null when none. */
  known_issues?: string | null;
  /** Branded hero with badges baked into the pixels — used for social
   *  og:image only on the website. Hero display always uses photos[0]
   *  (raw) + interactive HTML badge overlays. */
  bakedHeroUrl?: string | null;
  /** V2 photo pipeline media shape — optional, absent on older responses. */
  media?: {
    hero_url?: string | null;
    hero_thumbnail_url?: string | null;
    walkaround_url?: string | null;
    walkaround_poster_url?: string | null;
    gallery?: Array<{ url: string; thumbnail_url: string }> | null;
    photo_count?: number;
    video_present?: boolean;
  } | null;
}

interface DmsResponse {
  data: DmsVehicle[];
  count?: number;
}

function mapStatus(
  raw: string | null | undefined
): "available" | "sale-pending" | "sold" | "coming-soon" {
  const s = (raw ?? "").toString().trim().toLowerCase();
  if (
    s === "sale pending" ||
    s === "sale-pending" ||
    s === "deal pending" ||
    s === "deal_pending"
  ) {
    return "sale-pending";
  }
  if (s === "sold") return "sold";
  if (
    s === "coming soon" ||
    s === "coming-soon" ||
    s === "in_recon" ||
    s === "in recon"
  ) {
    return "coming-soon";
  }
  return "available";
}

export function adaptDmsVehicle(v: DmsVehicle): SyncedVehicle {
  const make = titleCase(v.make ?? "");
  const model = titleCase(v.model ?? "");
  const trim = v.trim ? titleCase(v.trim) : "";
  const stockNumber = v.stockNumber ? String(v.stockNumber) : "";
  // Slug computed from raw DMS fields by the shared module so the sitemap,
  // the public inventory feed, and the VDP bridge function all agree.
  const slug = vehicleSlug(v);

  const photos = Array.isArray(v.photos) ? v.photos : [];
  const ordered = [...photos];
  ordered.sort(
    (a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary))
  );
  const images = ordered.map((p) => p.url).filter(Boolean);

  return {
    vin: v.vin,
    stockNumber,
    slug,
    year: Number(v.year) || 0,
    make,
    model,
    trim,
    bodyStyle: v.bodyStyle ?? "",
    drivetrain: v.drivetrain ?? "",
    transmission: v.transmission ?? "",
    fuelType: v.fuelType ?? "",
    engine: v.engine ?? "",
    exteriorColor: v.exteriorColor ?? "",
    interiorColor: v.interiorColor ?? "",
    mileage: Number(v.mileage) || 0,
    price: Number(v.retailPrice) || 0,
    status: mapStatus(v.status),
    features: Array.isArray(v.features)
      ? v.features.filter((f) => typeof f === "string")
      : [],
    description: v.description ?? null,
    daysOnLot: Number(v.daysOnLot) || 0,
    dateInStock: v.dateInStock ?? "",
    images,
    dealerCenterFirstSeen: "",
    dealerCenterLastSeen: "",
    recentlyReduced: Boolean(v.recently_reduced),
    // Phase 2 photo pipeline — null in Phase 1 (VDPWalkaround renders nothing).
    bakedHeroUrl: v.bakedHeroUrl ?? null,
    walkaroundUrl: v.media?.walkaround_url ?? null,
    walkaroundPosterUrl: v.media?.walkaround_poster_url ?? null,
    // AS-IS / legal disclosure fields (Diane, 2026-05-12)
    asIs: v.as_is ?? true,
    knownIssues: v.known_issues ?? null,
  };
}

/**
 * Server-side fetch (build-time or Node runtime) of the live DMS inventory.
 * Returns [] on any upstream failure — callers should always have a static
 * fallback for an empty result.
 */
export async function fetchDmsInventory(
  // Bumped 8s → 20s on 2026-04-30 after a build shipped without
  // pre-rendered VDPs for two Coming Soon vehicles (Crosstrek + MKZ).
  // Root cause: Railway free-tier hibernation cold-start can run 15-25s,
  // and 8s wasn't enough during the build's parallel generateStaticParams
  // call. The sitemap got the slugs (it ran later, after warm-up) but
  // pages did not — clicking through from the inventory grid 404'd.
  // 20s is comfortably above observed cold-start. If we move to a paid
  // Railway plan with always-on, this can come back down.
  timeoutMs = 20000
): Promise<SyncedVehicle[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(DMS_PUBLIC_INVENTORY_URL, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
      // force-cache: required for output:"export" static generation.
      // Shares one Railway response across all 3 SSG workers in the same
      // build run. The static HTML is rebuilt on every CF Pages deploy, so
      // staleness is bounded by deploy cadence, not cache TTL.
      cache: "force-cache",
    });
    if (!res.ok) {
      console.warn("[dmsInventory] DMS upstream non-OK:", res.status);
      return [];
    }
    const json = (await res.json()) as DmsResponse;
    if (!json || !Array.isArray(json.data)) return [];
    return json.data
      .filter((v) => v && v.vin && v.year && v.make && v.model)
      .map(adaptDmsVehicle);
  } catch (err) {
    console.warn("[dmsInventory] DMS upstream fetch failed:", err);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Same shape as adaptVehicle in inventoryAdapter, but skips the
 * synthesized description so the VDP can keep using the build-time
 * seed description when present and only override when DMS provides
 * marketing copy.
 */
export function syncedToVehicle(s: SyncedVehicle): Vehicle {
  return {
    id: s.stockNumber || s.vin,
    slug: s.slug,
    vin: s.vin,
    stockNumber: s.stockNumber ?? "",
    year: s.year,
    make: s.make,
    model: s.model,
    trim: s.trim,
    price: s.price,
    mileage: s.mileage,
    exteriorColor: s.exteriorColor,
    interiorColor: s.interiorColor,
    drivetrain: s.drivetrain,
    transmission: s.transmission,
    engine: s.engine,
    bodyStyle: s.bodyStyle,
    fuelType: s.fuelType,
    description: s.description ?? "",
    features: s.features,
    images: s.images,
    status: s.status,
    dateInStock: s.dateInStock,
    daysOnLot: s.daysOnLot,
    recentlyReduced: s.recentlyReduced,
    asIs: s.asIs ?? true,
    knownIssues: s.knownIssues ?? null,
    bakedHeroUrl: s.bakedHeroUrl ?? null,
  };
}
