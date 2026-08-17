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
import { displayCase, dedupeTrim } from "../../shared/displayCase";
import { rewritePhotoHost } from "../../shared/photoHost";
import { safeDescription } from "../../shared/descriptionGuard";
import inventorySnapshot from "@/data/inventory-snapshot.json";
import { sampleInventory } from "@/data/inventory";

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
  no_fee_badge_enabled?: boolean;
  google_badge_position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  phone_badge_enabled: boolean;
  phone_number: string;
  phone_badge_position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  carfax_badge_enabled: boolean;
  carfax_badge_position: "bottom-right" | "bottom-left" | "top-right" | "top-left";
  margin_pct: number;
}

/**
 * Safe "everything on" default, used whenever the DMS badge-config
 * endpoint is unreachable. Also the default value of BadgeConfigContext,
 * so a card rendered outside the provider keeps the pre-context behavior.
 */
export const BADGE_CONFIG_FALLBACK: GlobalBadgeConfig = {
  dealer_badge_enabled: true,
  dealer_badge_position: "bottom-right",
  dealer_badge_size_pct: 28,
  google_badge_enabled: true,
  // Off unless the DMS turns it on, matching the column default.
  no_fee_badge_enabled: false,
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

const MERCHANDISING_CONFIG_URL = "https://www.loveautogroup.net/api/merchandising";

/**
 * Found in the website audit: sitemap.ts had no way to know which vehicles
 * were toggled "Hide from site" in the DMS — the KV-backed hidden overlay
 * is only ever checked by client-side hooks, never at build time. Fetches
 * the same public /api/merchandising endpoint the client uses and returns
 * the set of hidden VINs so a build-time consumer (sitemap.ts) can exclude
 * them. Best-effort: an empty set on any failure just means "nothing known
 * to be hidden," never blocks the build.
 */
export async function fetchHiddenVins(): Promise<Set<string>> {
  try {
    const res = await fetch(MERCHANDISING_CONFIG_URL, { cache: "no-store" });
    if (res.status === 204 || !res.ok) return new Set();
    const data = (await res.json()) as {
      overlays?: Record<string, { hidden?: boolean }>;
    };
    return new Set(
      Object.entries(data.overlays ?? {})
        .filter(([, o]) => o?.hidden === true)
        .map(([vin]) => vin.toUpperCase())
    );
  } catch {
    return new Set();
  }
}

// Statuses that are publicly indexable. Mirrors the "Available" /
// "Sale Pending" mapping in CLAUDE.md (RETAIL_READY → "available",
// DEAL_PENDING → "sale-pending").
const INDEXABLE_STATUSES = new Set(["available", "sale-pending"]);

// 2026-05-05 — defense-in-depth deny list for known-dead VDP slugs that
// somehow leaked into the live sitemap. These are old DMS vehicles
// (Prisma IDs 7, 9, 12) that have been sold but their slugs were sticky
// in the build artifact. Source: marketing-audit-2026-05-05/seo-audit.md.
const KNOWN_DEAD_SLUGS = new Set<string>([
  "2019-subaru-crosstrek-2-0i-limited-12",
  "2014-lincoln-mkz-hybrid-9",
  "2017-chrysler-pacifica-touring-l-plus-7",
]);

export interface IndexableVehicle {
  slug: string;
  vin: string;
  lastModified: Date;
  heroImageUrl?: string;
}

/**
 * The single, protected list of vehicles that should be publicly indexed —
 * union of seed-known slugs and the live DMS list, filtered to
 * INDEXABLE_STATUSES, KNOWN_DEAD_SLUGS, and the KV hidden overlay.
 * lastModified prefers DMS dateInStock when available. Soft-fails to
 * seed-only on a DMS error — never throws.
 *
 * Found in the website audit: sitemap-vehicles.xml used to read
 * sampleInventory directly with none of this — no live/seed intersection
 * to drop sold cars, no dead-slug denylist, no hidden-VIN exclusion — a
 * second, materially weaker implementation of exactly what sitemap.ts
 * already got right. Both now call this one function so there's only one
 * place "what counts as indexable" can drift.
 */
export async function resolveIndexableVehicles(): Promise<IndexableVehicle[]> {
  let live: SyncedVehicle[] = [];
  try {
    live = await fetchDmsInventory();
  } catch (err) {
    console.warn("[resolveIndexableVehicles] DMS fetch failed, using seed-only:", err);
    live = [];
  }

  const hiddenVins = await fetchHiddenVins();

  // Empty means "could not read the lot", never "the lot is empty" — see
  // the contract on fetchDmsInventory(). Only then does seed take over.
  const liveUnavailable = live.length === 0;
  const liveSlugs = new Set(live.map((v) => v.slug));

  const bySlug = new Map<string, IndexableVehicle>();

  for (const v of sampleInventory) {
    if (!INDEXABLE_STATUSES.has(v.status)) continue;
    if (KNOWN_DEAD_SLUGS.has(v.slug)) continue;
    if (hiddenVins.has(v.vin.toUpperCase())) continue;
    // Live feed wins: a seed slug absent from it is a sold vehicle.
    if (!liveUnavailable && !liveSlugs.has(v.slug)) continue;
    bySlug.set(v.slug, {
      slug: v.slug,
      vin: v.vin,
      lastModified: new Date(),
      heroImageUrl: v.images?.[0],
    });
  }
  for (const v of live) {
    if (!INDEXABLE_STATUSES.has(v.status)) continue;
    if (KNOWN_DEAD_SLUGS.has(v.slug)) continue;
    if (hiddenVins.has(v.vin.toUpperCase())) continue;
    let stamp = new Date();
    if (v.dateInStock) {
      const d = new Date(v.dateInStock);
      if (!isNaN(d.getTime())) stamp = d;
    }
    bySlug.set(v.slug, {
      slug: v.slug,
      vin: v.vin,
      lastModified: stamp,
      heroImageUrl: v.images?.[0],
    });
  }

  return Array.from(bySlug.values());
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
  // Found in the website audit: the outbound marketing feeds
  // (functions/_lib/feed.ts) rewrite photo URLs off the rate-limited
  // r2.dev dev-domain, but the website's own VDP rendering never did —
  // every on-page <img>, the og:image, and the JSON-LD image array all
  // served from the same host Cloudflare documents as rate-limited for
  // non-browser fetchers (the exact cause of a past Google Merchant
  // Center "Unsupported image type" rejection on the feeds).
  const images = ordered
    .map((p) => rewritePhotoHost(p.url))
    .filter((url): url is string => Boolean(url));

  const price = Number(v.retailPrice) || 0;

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
    price,
    status: mapStatus(v.status),
    features: Array.isArray(v.features)
      ? v.features.filter((f) => typeof f === "string")
      : [],
    // Found in the website audit: a stale price baked into free-text
    // description copy rendered right next to the real, current price —
    // see shared/descriptionGuard.ts for the full story.
    description: safeDescription(v.description ?? null, price),
    daysOnLot: Number(v.daysOnLot) || 0,
    dateInStock: v.dateInStock ?? "",
    images,
    dealerCenterFirstSeen: "",
    dealerCenterLastSeen: "",
    recentlyReduced: Boolean(v.recently_reduced),
    // Phase 2 photo pipeline — null in Phase 1 (VDPWalkaround renders nothing).
    bakedHeroUrl: rewritePhotoHost(v.bakedHeroUrl) ?? null,
    walkaroundUrl: v.media?.walkaround_url ?? null,
    walkaroundPosterUrl: v.media?.walkaround_poster_url ?? null,
    // AS-IS / legal disclosure fields (Diane, 2026-05-12)
    asIs: v.as_is ?? true,
    knownIssues: v.known_issues ?? null,
  };
}

/**
 * -- ONE SNAPSHOT PER BUILD -------------------------------------------
 * Every build-time consumer of DMS inventory -- sitemap.ts,
 * generateStaticParams, generateMetadata and the VDP body -- must render
 * from the SAME vehicle list, or the build ships internally inconsistent
 * artifacts. On 2026-08-03 (commit f6f867d) sitemap.xml advertised the
 * newest car (Lincoln MKX #11423) while generateStaticParams did not, so
 * /inventory/2016-lincoln-mkx-reserve-11423/ returned 404 in production.
 *
 * Root cause: these were INDEPENDENT fetches of a rate-limited upstream,
 * and every failure path returned [] -- indistinguishable from "the lot is
 * empty". One fetch degraded, the others did not, and the resulting
 * half-built site looked perfectly healthy in the build log.
 *
 * Fix: the snapshot is fetched exactly ONCE per build, by
 * scripts/fetch-inventory-snapshot.ts during `prebuild`, and written to
 * src/data/inventory-snapshot.json. Everything downstream reads that file.
 * When it is fresh the Next build makes ZERO Railway requests, which also
 * removes the ~20 concurrent build-time calls that provoked the throttling
 * to begin with.
 *
 * Do NOT reintroduce a second independent fetch of this endpoint.
 */

/** How fresh the committed snapshot must be to serve as THE build
 *  snapshot. `prebuild` rewrites it seconds before `next build` starts, so
 *  a real deploy always satisfies this. In `next dev` the committed copy is
 *  usually older, and we fall through to a live fetch below. */
const SNAPSHOT_MAX_AGE_MS = 6 * 60 * 60 * 1000;

/** Retry budget for the live fallback path. An empty array is treated as a
 *  TRANSIENT failure, not as an answer: Railway's shared read rate-limit
 *  returns empty rather than erroring under throttle (CLAUDE.md, S65), so
 *  "no vehicles" and "you are being throttled" look identical on the wire.
 *  Precedent: the S65 auction backfill used the same retry-on-empty rule. */
const LIVE_FETCH_ATTEMPTS = 4;

let liveFetchPromise: Promise<SyncedVehicle[]> | null = null;

function snapshotVehicles(): SyncedVehicle[] | null {
  try {
    const snap = inventorySnapshot as unknown as {
      syncedAt?: string;
      vehicles?: SyncedVehicle[];
    };
    if (!snap || !Array.isArray(snap.vehicles) || snap.vehicles.length === 0) {
      return null;
    }
    const stamp = snap.syncedAt ? Date.parse(snap.syncedAt) : NaN;
    if (!Number.isFinite(stamp)) return null;
    if (Date.now() - stamp > SNAPSHOT_MAX_AGE_MS) return null;
    return snap.vehicles;
  } catch {
    return null;
  }
}

/** Single attempt. Returns null for "could not read the lot" and a
 *  (possibly empty) array for "read it successfully". The caller decides
 *  whether an empty array is believable. */
async function fetchDmsInventoryOnce(
  timeoutMs: number,
  attempt: number
): Promise<SyncedVehicle[] | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  // Attempt 1 keeps the plain URL so it can share Next's Data Cache with
  // any other in-render caller. Retries append a throwaway param: with
  // cache:"force-cache" a 200-but-empty response IS cached, so retrying the
  // same URL would just replay the throttled answer forever. FastAPI
  // ignores unknown query params (verified 2026-08-03, identical body).
  const url =
    attempt === 1
      ? DMS_PUBLIC_INVENTORY_URL
      : DMS_PUBLIC_INVENTORY_URL + "?_retry=" + attempt;
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { Accept: "application/json" },
      // force-cache is deliberate: `no-store` inside a server component opts
      // the route into dynamic rendering, which output:"export" rejects.
      // Staleness is bounded by deploy cadence.
      cache: "force-cache",
    });
    if (!res.ok) {
      console.warn(
        "[dmsInventory] attempt " + attempt + "/" + LIVE_FETCH_ATTEMPTS +
          " -- upstream non-OK: " + res.status
      );
      return null;
    }
    const json = (await res.json()) as DmsResponse;
    if (!json || !Array.isArray(json.data)) {
      console.warn(
        "[dmsInventory] attempt " + attempt + "/" + LIVE_FETCH_ATTEMPTS +
          " -- malformed payload (no data array)"
      );
      return null;
    }
    return json.data
      .filter((v) => v && v.vin && v.year && v.make && v.model)
      .map(adaptDmsVehicle);
  } catch (err) {
    console.warn(
      "[dmsInventory] attempt " + attempt + "/" + LIVE_FETCH_ATTEMPTS +
        " -- fetch failed:",
      err
    );
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchLiveWithRetry(timeoutMs: number): Promise<SyncedVehicle[]> {
  for (let attempt = 1; attempt <= LIVE_FETCH_ATTEMPTS; attempt++) {
    const result = await fetchDmsInventoryOnce(timeoutMs, attempt);
    if (result && result.length > 0) {
      console.log(
        "[dmsInventory] live fetch OK -- " + result.length +
          " vehicles (attempt " + attempt + ")"
      );
      return result;
    }
    if (result && result.length === 0) {
      console.warn(
        "[dmsInventory] attempt " + attempt + "/" + LIVE_FETCH_ATTEMPTS +
          " -- upstream returned ZERO vehicles; treating as throttle, retrying"
      );
    }
    if (attempt < LIVE_FETCH_ATTEMPTS) {
      await new Promise((r) => setTimeout(r, attempt * 3000));
    }
  }

  // Loud, unmissable and greppable in a Cloudflare Pages build log. This
  // used to be a single console.warn that nobody ever saw, which is exactly
  // how a site shipped without its newest vehicle.
  console.error(
    [
      "",
      "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
      "!! [dmsInventory] LIVE DMS INVENTORY UNAVAILABLE after " +
        LIVE_FETCH_ATTEMPTS + " attempts, and no fresh build snapshot.",
      "!! Vehicle pages and sitemap.xml will be built from seed data --",
      "!! REAL CARS MAY BE MISSING FROM THE LIVE SITE. Check Railway",
      "!! before trusting this deploy.",
      "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!",
      "",
    ].join("\n")
  );
  return [];
}

/**
 * THE build-time inventory list. Snapshot-first, live fetch as fallback.
 *
 * Contract for callers: a NON-EMPTY result is authoritative and must be
 * preferred over seed data. An EMPTY result means "we could not read the
 * lot" -- never "the lot is empty" -- so callers fall back to seed rather
 * than publishing an empty inventory.
 */
export async function fetchDmsInventory(
  // Bumped 8s -> 20s on 2026-04-30 after a build shipped without
  // pre-rendered VDPs for two Coming Soon vehicles (Crosstrek + MKZ).
  // Root cause: Railway free-tier hibernation cold-start can run 15-25s.
  timeoutMs = 20000
): Promise<SyncedVehicle[]> {
  const snap = snapshotVehicles();
  if (snap) return snap;

  // One in-flight fetch shared by every caller in this process, so the VDP
  // route's per-page resolveVehicle() + generateMetadata() calls cannot
  // stampede Railway (they were issuing 2 requests per vehicle page).
  if (!liveFetchPromise) {
    console.warn(
      "[dmsInventory] no fresh build snapshot -- falling back to a live DMS " +
        "fetch. In a deploy this means `prebuild` did not run or did not succeed."
    );
    liveFetchPromise = fetchLiveWithRetry(timeoutMs);
  }
  return liveFetchPromise;
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
    // E3: idempotent showroom casing here too — this mapper feeds the VDPs
    // from the live DMS fetch, which bypasses the inventoryAdapter path.
    make: displayCase(s.make),
    model: displayCase(s.model),
    trim: dedupeTrim(displayCase(s.model), displayCase(s.trim)),
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
