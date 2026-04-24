/**
 * Photo sync — pull vehicle photos from Dealer Center URLs into our R2
 * bucket and rewrite each vehicle's `images` array to point at our own
 * CDN. We store the canonical photos so the public site doesn't depend
 * on Dealer Center's hotlink permissions, response time, or URL stability.
 *
 * Storage layout in R2:
 *   vehicles/{VIN}/{NN}.jpg     — original (or re-hosted) photo
 *
 * Where NN is a zero-padded ordinal (01, 02, ...) matching the order
 * the photo appeared in the feed.
 *
 * Public URL pattern (configured via env.PHOTOS_PUBLIC_BASE):
 *   https://photos.loveautogroup.net/vehicles/{VIN}/{NN}.jpg
 *
 * Idempotency: we HEAD-check R2 before fetching. If the object exists
 * AND has the same source-url etag in metadata, we skip. If the source
 * URL changed (DC re-hosted the photo), we re-download.
 *
 * What we DON'T do here:
 *   - WebP / AVIF re-encoding (Cloudflare Images handles that at the
 *     edge via Image Resizing on the public URL).
 *   - Background removal / overlays. Those happen client-side via the
 *     existing PhotoOrder + frosted-glass layer.
 *   - Vision-based reordering. That's the separate `classify-photos.ts`
 *     job (Phase 2) and runs offline against the snapshot in KV.
 */

import type { Env, SyncedVehicle, SyncLog } from "./types";

const MAX_PHOTO_BYTES = 8 * 1024 * 1024; // 8MB safety limit per photo
const PHOTO_FETCH_CONCURRENCY = 4; // How many photos we download in parallel per vehicle

export async function syncPhotos(
  vehicles: SyncedVehicle[],
  env: Env,
  log: SyncLog
): Promise<number> {
  if (!env.PHOTOS) {
    log.errors.push("PHOTOS R2 binding missing — skipping photo sync. Vehicles will keep DC source URLs.");
    return 0;
  }

  const publicBase = (env.PHOTOS_PUBLIC_BASE ?? "").replace(/\/+$/, "");
  if (!publicBase) {
    log.errors.push("PHOTOS_PUBLIC_BASE not set — falling back to r2.dev URL pattern. Set this for production.");
  }

  let downloaded = 0;

  for (const vehicle of vehicles) {
    if (!vehicle.images.length) continue;
    const sourceUrls = vehicle.images.slice(); // copy — we mutate vehicle.images at the end
    const finalUrls: string[] = new Array(sourceUrls.length);

    // Process in small batches so a vehicle with 30 photos doesn't
    // hammer Dealer Center with 30 parallel requests.
    for (let i = 0; i < sourceUrls.length; i += PHOTO_FETCH_CONCURRENCY) {
      const batch = sourceUrls.slice(i, i + PHOTO_FETCH_CONCURRENCY);
      const results = await Promise.all(
        batch.map((url, j) => syncOnePhoto(vehicle.vin, i + j, url, env, log))
      );
      results.forEach((r, j) => {
        finalUrls[i + j] = r.publicUrl;
        if (r.downloaded) downloaded++;
      });
    }

    // Replace DC URLs with our R2 URLs (skip any that failed → keep DC URL).
    vehicle.images = finalUrls;
  }

  return downloaded;
}

async function syncOnePhoto(
  vin: string,
  position: number,
  sourceUrl: string,
  env: Env,
  log: SyncLog
): Promise<{ publicUrl: string; downloaded: boolean }> {
  const ordinal = String(position + 1).padStart(2, "0");
  const r2Key = `vehicles/${vin}/${ordinal}.jpg`;
  const publicUrl = makePublicUrl(env, r2Key);

  try {
    // 1. Check if we already have it AND the source URL matches.
    const existing = await env.PHOTOS.head(r2Key);
    if (existing && existing.customMetadata?.sourceUrl === sourceUrl) {
      return { publicUrl, downloaded: false };
    }

    // 2. Download from Dealer Center (or wherever it's hosted).
    const res = await fetch(sourceUrl, {
      headers: {
        "User-Agent": "LoveAutoGroup-PhotoSync/1.0",
        Accept: "image/*",
      },
      // Cloudflare-specific: cache the source briefly so re-runs in the
      // same window don't re-pull from origin.
      cf: { cacheTtl: 300, cacheEverything: true },
    } as RequestInit);

    if (!res.ok) {
      log.errors.push(`photo ${vin}#${ordinal}: HTTP ${res.status} from ${sourceUrl}`);
      return { publicUrl: sourceUrl, downloaded: false }; // fall back to DC URL
    }

    const contentType = res.headers.get("content-type") ?? "image/jpeg";
    if (!contentType.startsWith("image/")) {
      log.errors.push(`photo ${vin}#${ordinal}: non-image content-type "${contentType}" from ${sourceUrl}`);
      return { publicUrl: sourceUrl, downloaded: false };
    }

    const buf = await res.arrayBuffer();
    if (buf.byteLength > MAX_PHOTO_BYTES) {
      log.errors.push(`photo ${vin}#${ordinal}: ${buf.byteLength} bytes exceeds ${MAX_PHOTO_BYTES} cap`);
      return { publicUrl: sourceUrl, downloaded: false };
    }
    if (buf.byteLength < 1024) {
      log.errors.push(`photo ${vin}#${ordinal}: only ${buf.byteLength} bytes — likely a placeholder image`);
      return { publicUrl: sourceUrl, downloaded: false };
    }

    // 3. Write to R2 with metadata that lets us detect changes next run.
    await env.PHOTOS.put(r2Key, buf, {
      httpMetadata: {
        contentType,
        cacheControl: "public, max-age=31536000, immutable",
      },
      customMetadata: {
        sourceUrl,
        vin,
        position: String(position + 1),
        syncedAt: new Date().toISOString(),
      },
    });

    return { publicUrl, downloaded: true };
  } catch (err) {
    log.errors.push(`photo ${vin}#${ordinal} sync error: ${(err as Error).message}`);
    // On any error, keep the DC URL so the vehicle still has a photo.
    return { publicUrl: sourceUrl, downloaded: false };
  }
}

function makePublicUrl(env: Env, r2Key: string): string {
  const base = (env.PHOTOS_PUBLIC_BASE ?? "").replace(/\/+$/, "");
  if (base) return `${base}/${r2Key}`;
  // Fallback: r2.dev pattern. Won't actually serve until a public bucket
  // or a custom domain is configured. The error above warns about this.
  return `/${r2Key}`;
}
