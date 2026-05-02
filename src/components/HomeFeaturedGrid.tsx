"use client";

/**
 * Featured Vehicles grid + "On the Lot Now" carousel for the homepage.
 *
 * Wraps useInventory() so price, mileage, status, and the membership of
 * "what's on the lot" all reflect the live DMS snapshot once it loads.
 * Build-time fallback (sampleInventory via useInventory) keeps the grid
 * populated for SSR + when /api/inventory is unreachable.
 */

import Link from "next/link";
import { useInventory } from "@/lib/useInventory";
import { filterFeatured, sortWithFeaturedFirst } from "@/data/merchandising";
import { useVisibleVehicles } from "@/data/useMerchandising";
import VehicleCard from "@/components/VehicleCard";

export default function HomeFeaturedGrid() {
  const { vehicles } = useInventory();
  // Respect the DMS "Hide from website" toggle via live KV config.
  const visible = useVisibleVehicles(vehicles);
  const available = visible.filter((v) => v.status !== "sold");
  const featured = filterFeatured(available);
  const topUp = sortWithFeaturedFirst(available).slice(0, 6);
  const featuredVehicles = featured.length >= 6 ? featured.slice(0, 6) : topUp;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {featuredVehicles.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}

export function HomeOnTheLot() {
  const { vehicles } = useInventory();
  const visible = useVisibleVehicles(vehicles);
  const ordered = sortWithFeaturedFirst(
    visible.filter((v) => v.status !== "sold")
  );
  return (
    <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
      {ordered.map((v) => {
        const priceHasCents = Math.round(v.price * 100) % 100 !== 0;
        const price = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
          minimumFractionDigits: priceHasCents ? 2 : 0,
          maximumFractionDigits: 2,
        }).format(v.price);
        const miles = new Intl.NumberFormat("en-US").format(v.mileage);
        return (
          <Link
            key={v.id}
            href={`/inventory/${v.slug}`}
            className="min-w-[260px] sm:min-w-[280px] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 rounded-xl overflow-hidden transition-all snap-start shrink-0 group"
          >
            <div className="aspect-[4/3] bg-brand-gray-700/50 relative">
              {v.daysOnLot <= 7 && (
                <span className="absolute top-2 left-2 bg-brand-green text-white text-xs font-semibold px-2 py-0.5 rounded-full">
                  Just Arrived
                </span>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-bold text-white text-sm group-hover:text-brand-red-light transition-colors">
                {v.year} {v.make} {v.model}
              </h3>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="text-brand-red-light font-bold">{price}</span>
                <span className="text-xs text-brand-gray-400">{miles} mi</span>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
