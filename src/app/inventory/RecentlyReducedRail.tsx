import VehicleCard from "@/components/VehicleCard";
import type { Vehicle } from "@/lib/types";

/**
 * E2 — "Recently Reduced" rail for the inventory page.
 *
 * Server component: receives the build-time filtered list (available
 * vehicles whose `recentlyReduced` flag is set by the DMS pricing
 * history) and renders a horizontal snap-scroll rail above the main
 * grid. Renders nothing when no prices have dropped — the section
 * only exists when there's a real deal to show.
 *
 * The cards themselves already carry the "Price Reduced" pill, so the
 * rail is pure merchandising placement: put the deals where a shopper
 * lands first.
 */
export default function RecentlyReducedRail({
  vehicles,
}: {
  vehicles: Vehicle[];
}) {
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
