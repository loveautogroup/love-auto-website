/**
 * Cloudflare Pages Function — /vdp/*  (legacy DealerCenter VDP URLs)
 *
 * DealerCenter builds every syndicated click-through URL from its own
 * template: `<dealer website>/vdp/<DCID>-<stock>/`, e.g.
 *
 *     https://www.loveautogroup.net/vdp/9079472-11423/
 *
 * That shape belongs to the retired DealerCenter-hosted site. The
 * hand-built site has never served `/vdp/*`, so every one of those links
 * has been a hard 404 — including the ones live in CarGurus listings
 * today (owner report 2026-08-10: all four active cars). Anywhere else a
 * DC-era link was ever published — old marketplace ads, Facebook posts,
 * printed material — is 404ing the same way.
 *
 * This resolves the stock number against the live DMS and forwards to the
 * canonical VDP. Not a rewrite of the underlying problem: CarGurus should
 * be sourcing our own feed (`/api/feed/cargurus.xml`), whose vdp_url is
 * already correct. This is the net that stops shopper clicks hitting a
 * 404 while that source change is negotiated, and it keeps working for
 * legacy links long after.
 *
 * 302, not 301: a stock number's slug follows its trim/model text, which
 * gets corrected in the DMS from time to time. A 301 is cached hard by
 * browsers and would pin a shopper to a slug we later changed.
 *
 * A stock number we can't resolve — sold and dropped from the public
 * feed, mistyped, or DMS unreachable — lands on /inventory/ rather than a
 * 404. An ad click should always reach something it can shop.
 *
 * NOTE: this only runs because `/vdp/*` is in public/_routes.json. Pages
 * invokes Functions solely for paths in that include list.
 */

import { vehicleSlug } from "../../shared/slug";

const DMS_PUBLIC_URL = "https://dms.loveautogroup.net/api/v1/public/inventory";

interface DmsVehicle {
  vin: string;
  stockNumber?: string;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
}

/**
 * Pull the stock number out of a legacy path segment.
 *
 * Handles the DealerCenter form (`9079472-11423`), a bare stock number
 * (`11423`), and anything else that ends in a digit run. Love Auto stock
 * numbers are 5-digit sequential (11xxx), so the DCID prefix is stripped
 * by taking the LAST digit group — not the first, which would return the
 * dealer id on every DC link.
 */
function extractStockNumber(raw: string): string | null {
  const decoded = decodeURIComponent(raw).trim();
  const groups = decoded.match(/\d+/g);
  if (!groups || groups.length === 0) return null;
  return groups[groups.length - 1];
}

function redirect(location: string, indexable: boolean): Response {
  return new Response(null, {
    status: 302,
    headers: {
      Location: location,
      // These URLs are not ours to rank — they exist only as inbound
      // links from third-party listings. Keep them out of the index
      // whichever way they resolve.
      "X-Robots-Tag": "noindex, follow",
      "Cache-Control": indexable
        ? "public, max-age=300, s-maxage=300"
        : "no-store",
    },
  });
}

export const onRequest: PagesFunction = async (context) => {
  const params = (context.params as Record<string, string | string[]>).path;
  const segments = Array.isArray(params) ? params : params ? [params] : [];
  const stock = segments.length ? extractStockNumber(segments.join("-")) : null;

  if (!stock) return redirect("/inventory/", false);

  try {
    const res = await fetch(DMS_PUBLIC_URL, {
      headers: { Accept: "application/json" },
      cf: { cacheTtl: 30, cacheEverything: false },
    });
    if (!res.ok) return redirect("/inventory/", false);

    // The Railway public endpoint returns a bare array; tolerate a
    // { data: [...] } wrapper too, matching functions/inventory/[slug].ts.
    const raw = (await res.json()) as DmsVehicle[] | { data?: DmsVehicle[] };
    const vehicles: DmsVehicle[] = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as { data?: DmsVehicle[] }).data)
      ? (raw as { data: DmsVehicle[] }).data
      : [];

    const match = vehicles.find(
      (v) => (v.stockNumber ?? "").trim() === stock
    );
    if (!match) return redirect("/inventory/", false);

    // Forward to the canonical slug. /inventory/[slug] then applies the
    // live-status rules on its own (sold → 410, in-recon → bridge page),
    // so this function never has to reason about vehicle state.
    return redirect(`/inventory/${vehicleSlug(match)}/`, true);
  } catch {
    return redirect("/inventory/", false);
  }
};
