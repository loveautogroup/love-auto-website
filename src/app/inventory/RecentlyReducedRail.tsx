"use client";

import VehicleCard from "@/components/VehicleCard";
import type { Vehicle } from "@/lib/types";
import { useInventory } from "@/lib/useInventory";
import { useVisibleVehicles } from "@/data/useMerchandising";

/**
 * E2 — "Recently Reduced" rail for the inventory page.
 *
 * Receives the build-time filtered list (available vehicles whose
 * `recentlyReduced` flag is set by the DMS pricing history) as a seed for
 * SSR/first paint, then — like InventoryGrid right below it on the same
 * page — re-derives the rail from the live feed once it hydrates. Found in
 * the website audit: this used to be a pure server component with no live
 * refresh at all, so a vehicle hidden or sold correctly dropped out of the
 * grid within ~60s while staying advertised as an active deal in this rail
 * until the next full site rebuild. Renders nothing when no prices have
 * dropped — the section only exists when there's a real deal to show.
 *
 * The cards themselves already carry the "Price Reduced" pill, so the
 * rail is pure merchandising placement: put the deals where a shopper
 * lands first.
 */
export default function RecentlyReducedRail({
  vehicles: seedVehicles,
}: {
  /** Already the final, build-time-computed "recently reduced" list —
   *  used directly as the SSR/fallback render. */
  vehicles: Vehicle[];
}) {
  const { vehicles: liveVehicles, source } = useInventory();
  // Both hooks called unconditionally (Rules of Hooks) even though only
  // one branch below ends up using each result.
  const visibleLive = useVisibleVehicles(liveVehicles);
  const visibleSeed = useVisibleVehicles(seedVehicles);

  // Same "recently reduced" + sanity-guard ratio the server page's
  // original build-time computation used (src/app/inventory/page.tsx) —
  // re-run against the live pool once it's trustworthy. /api/inventory
  // already excludes sold vehicles, so visibleLive never needs a status
  // filter beyond what recentlyReduced itself checks.
  const reducedFromLive = () => {
    const reducedAll = visibleLive.filter(
      (v) => v.recentlyReduced && v.status === "available"
    );
    return reducedAll.length * 2 <= visibleLive.length
      ? reducedAll.slice(0, 8)
      : [];
  };

  const vehicles = source !== "fallback" ? reducedFromLive() : visibleSeed;

  if (vehicles.length === 0) return null;

  return (
    <section
      aria-labelledby="recently-reduced-heading"
      className="max-w-7xl mx-auto px-4 pt-8"
    >
      <div className="flex items-baseline justify-between mb-1">
        <h2
          id="recently-reduced-heading"
          className="text-2xl font-bold text-brand-gray-900"
        >
          Recently Reduced
        </h2>
        <span className="text-sm text-brand-gray-500">
          {vehicles.length} price drop{vehicles.length === 1 ? "" : "s"} in the
          last 14 days
        </span>
      </div>
      <p className="text-brand-gray-500 mb-4 text-sm">
        These prices just came down — they tend not to stay long.
      </p>
      <div
        className="flex gap-6 overflow-x-auto pb-4 snap-x snap-mandatory [-webkit-overflow-scrolling:touch]"
        role="list"
      >
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            role="listitem"
            className="min-w-[300px] max-w-[320px] shrink-0 snap-start"
          >
            <VehicleCard vehicle={vehicle} />
          </div>
        ))}
      </div>
    </section>
  );
}
