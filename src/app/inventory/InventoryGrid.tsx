"use client";

import { useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Vehicle } from "@/lib/types";
import VehicleCard from "@/components/VehicleCard";
import { useInventory } from "@/lib/useInventory";
import { sortWithFeaturedFirst } from "@/data/merchandising";
import { useVisibleVehicles } from "@/data/useMerchandising";

interface InventoryGridProps {
  /**
   * Build-time merchandise-ordered fallback. Used as initial render
   * (avoids empty state flash) and whenever the live KV-backed feed is
   * unavailable. Once /api/inventory returns a snapshot, we replace
   * with that — re-applying merchandising sort + status filter.
   */
  vehicles: Vehicle[];
}

function InventoryGridInner({ vehicles: fallbackVehicles }: InventoryGridProps) {
  const searchParams = useSearchParams();
  const { vehicles: liveVehicles, source, syncedAt } = useInventory();
  // Filter out KV-hidden vehicles before any further processing.
  // This is what makes the DMS "Hide from website" toggle work in real time.
  const visibleLiveVehicles = useVisibleVehicles(liveVehicles);

  // Use live snapshot when present, otherwise stick with the SSR'd fallback.
  // Either way, run them through the same merchandising sort + availability
  // filter so featured cars stay pinned and sold cars stay hidden from the
  // public grid.
  const vehicles =
    source === "fallback"
      ? fallbackVehicles
      : sortWithFeaturedFirst(
          visibleLiveVehicles.filter((v) => v.status !== "sold")
        );

  const filtered = useMemo(() => {
    const make = searchParams.get("make")?.toLowerCase();
    const bodyStyle = searchParams.get("bodyStyle")?.toLowerCase();
    const drivetrain = searchParams.get("drivetrain");
    const minPrice = Number(searchParams.get("minPrice")) || null;
    const maxPrice = Number(searchParams.get("maxPrice")) || null;
    const maxMileage = Number(searchParams.get("maxMileage")) || null;
    const minYear = Number(searchParams.get("minYear")) || null;
    const maxYear = Number(searchParams.get("maxYear")) || null;
    const q = searchParams.get("q")?.toLowerCase();

    return vehicles.filter((v) => {
      if (make && v.make.toLowerCase() !== make) return false;
      if (bodyStyle && v.bodyStyle.toLowerCase() !== bodyStyle) return false;
      if (drivetrain && v.drivetrain !== drivetrain) return false;
      if (minPrice !== null && v.price < minPrice) return false;
      if (maxPrice !== null && v.price > maxPrice) return false;
      if (maxMileage !== null && v.mileage > maxMileage) return false;
      if (minYear !== null && v.year < minYear) return false;
      if (maxYear !== null && v.year > maxYear) return false;
      if (q) {
        const tokens = q.split(/\s+/).filter(Boolean);
        const haystack = [
          v.make,
          v.model,
          v.trim,
          v.drivetrain,
          v.bodyStyle,
          ...(v.features ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!tokens.every((t) => haystack.includes(t))) return false;
      }
      return true;
    });
  }, [vehicles, searchParams]);

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-brand-gray-500 text-sm">
          Showing{" "}
          <span className="font-semibold text-brand-gray-900">{filtered.length}</span>{" "}
          {filtered.length === 1 ? "vehicle" : "vehicles"}
          {source === "live" && syncedAt && (
            <span
              className="ml-2 text-[11px] text-brand-gray-400"
              title={`Live from Dealer Center, synced ${new Date(syncedAt).toLocaleString()}`}
            >
              · live
            </span>
          )}
        </p>
        <select
          className="text-sm border border-brand-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-red"
          aria-label="Sort vehicles"
        >
          <option value="recent">Recently Added</option>
          <option value="price-asc">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="mileage-asc">Mileage: Low to High</option>
          <option value="newest">Year: Newest First</option>
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-xl font-semibold text-brand-gray-700">
            No vehicles match your filters
          </p>
          <p className="mt-2 text-brand-gray-500">
            Try adjusting your search, or{" "}
            <a href="/contact" className="text-brand-red hover:underline">
              contact us
            </a>{" "}
            . We source vehicles to order.
          </p>
        </div>
      )}
    </>
  );
}

/**
 * Inventory grid — client component so it can read URL search params
 * (required for static export, where server-side searchParams isn't
 * available at build time). Wraps in Suspense because useSearchParams
 * requires it under Next 15+.
 */
export default function InventoryGrid({ vehicles }: InventoryGridProps) {
  return (
    <Suspense fallback={<div className="py-16 text-center text-brand-gray-500">Loading inventory...</div>}>
      <InventoryGridInner vehicles={vehicles} />
    </Suspense>
  );
}
