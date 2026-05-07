/**
 * Public GET /api/inventory
 *
 * Proxy to the live DMS public inventory endpoint
 * (https://dms.loveautogroup.net/api/v1/public/inventory).
 *
 * Why a proxy and not a direct browser fetch?
 *   - DMS sets CORS open, but routing through this Pages Function lets
 *     us cache aggressively at Cloudflare's edge (60s s-maxage), shape
 *     the response into the InventorySnapshot envelope the React app
 *     already expects, and keep a single point of control if the DMS
 *     URL ever changes.
 *
 * Fallback chain:
 *   1. Live DMS fetch (preferred). On 200, normalize to InventorySnapshot
 *      and return.
 *   2. KV snapshot (workers/inventory-sync writes here every ~15 min).
 *      Used if DMS is unreachable.
 *   3. 204 No Content. Client falls back to build-time sampleInventory.
 *
 * On any DMS shape change the adapter at src/lib/inventoryAdapter.ts
 * carries the conversion. Wire format here mirrors what the cron worker
 * already writes to KV so consumers don't need a code change.
 */

import { titleCase, vehicleSlug } from "../../shared/slug";

interface Env {
  INVENTORY?: KVNamespace;
}

const KV_KEY_CURRENT = "inventory:current";
const DMS_URL = "https://dms.loveautogroup.net/api/v1/public/inventory";
const DMS_TIMEOUT_MS = 5000;

// SEED_SLUGS_BY_VIN now lives in shared/slug.ts. vehicleSlug() handles the
// override → auto-slug fallback. Don't add overrides here — add them once
// in shared/slug.ts and all three callers see the change.

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
  // True if asking_price decreased in the last 14 days (DMS public feed
  // reads this from VehiclePriceHistory). Optional — older deploys omit
  // the field, treat absent as false for back-compat.
  recently_reduced?: boolean | null;
}

interface DmsResponse {
  data: DmsVehicle[];
  count?: number;
}

interface SyncedVehicle {
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
  description?: string;
  recentlyReduced?: boolean;
}

interface InventorySnapshot {
  syncedAt: string;
  syncedBy: "cron" | "manual" | "live-dms";
  vehicles: SyncedVehicle[];
}

function mapStatus(
  raw: string | null | undefined
): "available" | "sale-pending" | "sold" | "coming-soon" {
  const s = (raw ?? "").toString().trim().toLowerCase();
  if (s === "sale pending" || s === "sale-pending" || s === "deal pending" || s === "deal_pending") {
    return "sale-pending";
  }
  if (s === "sold") return "sold";
  // IN_RECON cars come through as "Coming Soon" from the DMS public route.
  // We surface them on the website with a Coming Soon badge so customers can
  // submit interest before the car hits retail-ready.
  if (s === "coming soon" || s === "coming-soon" || s === "in_recon" || s === "in recon") {
    return "coming-soon";
  }
  // Default to available for "Available", "RETAIL_READY", "" etc.
  return "available";
}

function adaptDmsVehicle(v: DmsVehicle): SyncedVehicle {
  const make = titleCase(v.make ?? "");
  const model = titleCase(v.model ?? "");
  const trim = v.trim ? titleCase(v.trim) : "";
  const stockNumber = v.stockNumber ? String(v.stockNumber) : "";
  // Shared slug computer — see shared/slug.ts. Honors SEED_SLUGS_BY_VIN.
  const slug = vehicleSlug(v);
  const photos = Array.isArray(v.photos) ? v.photos : [];
  // Sort primary photo first, preserve relative order otherwise.
  const ordered = [...photos];
  ordered.sort((a, b) => Number(Boolean(b.isPrimary)) - Number(Boolean(a.isPrimary)));
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
    features: Array.isArray(v.features) ? v.features.filter((f) => typeof f === "string") : [],
    daysOnLot: Number(v.daysOnLot) || 0,
    dateInStock: v.dateInStock ?? "",
    images,
    dealerCenterFirstSeen: "",
    dealerCenterLastSeen: "",
    description: v.description ?? undefined,
    recentlyReduced: Boolean(v.recently_reduced),
  };
}

async function fetchDms(): Promise<InventorySnapshot | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), DMS_TIMEOUT_MS);
  try {
    const res = await fetch(DMS_URL, {
      signal: ctrl.signal,
      // Edge-cache the upstream call too (Cloudflare honors cf.cacheTtl).
      cf: { cacheTtl: 60, cacheEverything: true },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      console.warn("[/api/inventory] DMS upstream non-OK:", res.status);
      return null;
    }
    const json = (await res.json()) as DmsResponse;
    if (!json || !Array.isArray(json.data)) {
      console.warn("[/api/inventory] DMS upstream malformed payload");
      return null;
    }
    const vehicles = json.data
      .filter((v) => v && v.vin && v.year && v.make && v.model)
      .map(adaptDmsVehicle)
      // Only surface vehicles Jeremiah has explicitly marked Listed (available)
      // or Sale Pending. Coming Soon / In Recon vehicles stay off the public site.
      .filter((v) => v.status === "available" || v.status === "sale-pending");
    return {
      syncedAt: new Date().toISOString(),
      syncedBy: "live-dms",
      vehicles,
    };
  } catch (err) {
    console.warn("[/api/inventory] DMS upstream fetch failed:", err);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  // Allow cache-busting for admin/debug — append ?fresh=1 to bypass edge cache.
  const url = new URL(request.url);
  const isFresh = url.searchParams.get("fresh") === "1";

  // 1. Try live DMS first.
  const live = await fetchDms();
  if (live && live.vehicles.length > 0) {
    return new Response(JSON.stringify(live), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": isFresh
          ? "no-store"
          : "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
        "X-Inventory-Source": "live-dms",
        ...corsHeaders(),
      },
    });
  }

  // 2. Fall back to KV snapshot if available.
  if (env.INVENTORY) {
    try {
      const raw = await env.INVENTORY.get(KV_KEY_CURRENT, { type: "json" });
      if (raw) {
        return new Response(JSON.stringify(raw), {
          status: 200,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            "Cache-Control": isFresh
              ? "no-store"
              : "public, max-age=15, s-maxage=30, stale-while-revalidate=300",
            "X-Inventory-Source": "kv-fallback",
            ...corsHeaders(),
          },
        });
      }
    } catch (err) {
      console.error("[/api/inventory] KV read failed:", err);
    }
  }

  // 3. Nothing — tell the client to fall back to build-time sampleInventory.
  return new Response(null, {
    status: 204,
    headers: {
      "X-Inventory-Source": "none",
      ...corsHeaders(),
    },
  });
};

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });
