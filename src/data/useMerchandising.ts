"use client";

/**
 * useMerchandising — runtime hook for merchandising overlays.
 *
 * The static-export site bakes `MERCHANDISING.overlays` into HTML at build
 * time. The DMS panel writes overlays to Cloudflare KV at runtime — those
 * writes never reach static HTML. This hook closes that gap by fetching
 * `/api/merchandising` once per page-load and merging the live config over
 * the baked defaults.
 *
 * Module-level cache prevents the N-card-per-page case from making N
 * fetches; only the first hook call kicks the network, all others wait
 * for the same Promise.
 *
 * Initial render returns the baked-in MERCHANDISING constant so server-
 * rendered HTML and the first paint are correct. After the fetch resolves
 * (~50-200ms typical), useState updates and components re-render with
 * runtime data.
 */

import { pickStatusPill } from "./merchandising";
import { useEffect, useState } from "react";
import {
  MERCHANDISING,
  type MerchandisingConfig,
  type StatusBadgeKind,
  type VehicleOverlay,
} from "./merchandising";

// Module-level cache — survives between hook calls but is fresh on a full
// page reload, which is what we want (DMS edits propagate within ~60s
// of the next reload).
let cache: MerchandisingConfig | null = null;
let inflight: Promise<MerchandisingConfig | null> | null = null;

/**
 * Lazy fetch that dedupes concurrent calls. Returns null if KV is empty
 * or the request fails — callers fall back to baked-in defaults.
 */
function fetchMerchandising(): Promise<MerchandisingConfig | null> {
  if (cache) return Promise.resolve(cache);
  if (inflight) return inflight;
  inflight = fetch("/api/merchandising")
    .then((res) => {
      // 204 = KV empty, use baked default
      if (res.status === 204) return null;
      if (!res.ok) return null;
      return res.json();
    })
    .then((cfg: MerchandisingConfig | null) => {
      cache = cfg;
      inflight = null;
      return cfg;
    })
    .catch(() => {
      inflight = null;
      return null;
    });
  return inflight;
}

/**
 * Returns the live merchandising config from KV when available, falling
 * back to the build-time baked default until the runtime fetch resolves.
 */
export function useMerchandising(): MerchandisingConfig {
  const [config, setConfig] = useState<MerchandisingConfig>(
    cache ?? MERCHANDISING
  );

  useEffect(() => {
    let cancelled = false;
    fetchMerchandising().then((live) => {
      if (cancelled) return;
      if (live) setConfig(live);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return config;
}

/**
 * Runtime version of resolveOverlay(vin, daysOnLot, status). Same return
 * shape — drop-in for components that need overlay data to reflect KV
 * writes from the DMS without a site rebuild.
 *
 * Components calling this become Client Components.
 */
export function useResolveOverlay(
  vin: string,
  daysOnLot: number,
  vehicleStatus: "available" | "sale-pending" | "sold" | "coming-soon",
  recentlyReduced = false
): VehicleOverlay & { effectiveStatus?: StatusBadgeKind } {
  const config = useMerchandising();
  const override = config.overlays?.[vin] ?? {};

  // Priority lives in pickStatusPill() — ONE definition shared with the
  // server-side resolveOverlay(). This used to be a copy of that logic and the
  // two drifted, which is how a sold car kept a green JUST ARRIVED pill on its
  // hero after the server copy alone was fixed.
  //
  // NOTE: the auto "price-reduced" flag (fired off the DMS public feed's
  // recentlyReduced signal) was removed per Jeremiah 2026-05-09. The
  // `recentlyReduced` arg + the `price-reduced` StatusPill variant are kept
  // intact so the merchandising admin can still set it manually if desired.
  void recentlyReduced;
  const effectiveStatus = pickStatusPill(vehicleStatus, override.status, daysOnLot);

  // CARFAX needs BOTH answers to be yes, from two different owners:
  //   carfax         — "do we want to advertise CARFAX on this car?" (dealer)
  //   carfaxLinkLive — "does the link actually serve a free report?" (Routine)
  // Either one explicitly false hides the badge and the button.
  //
  // Both default ON when absent. That is deliberate: a missing verdict must
  // not blank the badge across the whole lot if the Routine stops running.
  // The car that actually needs protecting is a NEWLY listed one, which has
  // not reached CARFAX's Hot Listings index yet — and the DMS writes
  // carfaxLinkLive:false at the moment a car goes Listed, so those start
  // hidden and are switched on once the Routine sees a real report.
  const carfax = override.carfax !== false && override.carfaxLinkLive !== false;

  return { ...override, carfax, effectiveStatus };
}

/**
 * Convenience hook for components that only need the global textPhone
 * (e.g. the homepage Text Us button outside any vehicle context).
 */
export function useGlobalTextPhone(): string | undefined {
  const config = useMerchandising();
  return config.textPhone;
}

/**
 * Drop vehicles whose merchandising overlay has `hidden: true` in the
 * RUNTIME (KV-backed) config. The static `sortWithFeaturedFirst` helper
 * can only see build-time overlays; this hook is what the DMS "Hide from
 * website" toggle relies on to actually pull cars off the public site
 * within ~60s of save (no site rebuild needed).
 *
 * Pure filter — preserves order. Call this BEFORE sortWithFeaturedFirst
 * in any client component that renders a vehicle list.
 */
export function useVisibleVehicles<T extends { vin: string }>(
  vehicles: T[]
): T[] {
  const config = useMerchandising();
  const overlays = config.overlays ?? {};
  return vehicles.filter((v) => overlays[v.vin]?.hidden !== true);
}
