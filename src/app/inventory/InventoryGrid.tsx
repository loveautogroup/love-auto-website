"use client";

import { useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Vehicle } from "@/lib/types";
import { useLanguage } from "@/context/LanguageContext";
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
  const { t } = useLanguage();
  const g = t.grid;
  const searchParams = useSearchParams();
  const { vehicles: liveVehicles, source, loading } = useInventory();
  // Filter out KV-hidden vehicles before any further processing.
  // Both hooks called unconditionally (Rules of Hooks).
  const visibleLiveVehicles = useVisibleVehicles(liveVehicles);
  const visibleFallbackVehicles = useVisibleVehicles(fallbackVehicles);

  // When source is "fallback" AND loading is still true we're waiting on the
  // live fetch. Show skeletons — don't flash the stale seed data which may
  // contain vehicles that have already been sold.
  // If loading finishes and source is still "fallback" (fetch errored) we fall
  // back to the seed, filtered for sold/hidden, so the page is never empty.
  const isLoadingInitial = source === "fallback" && loading;

  const vehicles = isLoadingInitial
    ? [] // skeleton rendered below
    : source !== "fallback"
    ? sortWithFeaturedFirst(
        visibleLiveVehicles.filter((v) => v.status !== "sold")
      )
    : sortWithFeaturedFirst(
        visibleFallbackVehicles.filter((v) => v.status !== "sold")
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

  if (isLoadingInitial) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6" aria-label="Loading inventory">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl bg-brand-gray-100 animate-pulse overflow-hidden"
            style={{ height: 380 }}
          />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <p className="text-brand-gray-500 text-sm">
          {g.showing}{" "}
          <span className="font-semibold text-brand-gray-900">{filtered.length}</span>{" "}
          {filtered.length === 1 ? g.vehicle : g.vehicles}
          {source === "live" && (
            <span className="ml-2 text-[11px] text-brand-gray-400">· {g.live}</span>
          )}
        </p>
        <select
          className="text-sm border border-brand-gray-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-red"
          aria-label="Sort vehicles"
        >
          <option value="recent">{g.sortRecent}</option>
          <option value="price-asc">{g.sortPriceAsc}</option>
          <option value="price-desc">{g.sortPriceDesc}</option>
          <option value="mileage-asc">{g.sortMileageAsc}</option>
          <option value="newest">{g.sortNewest}</option>
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
            {g.noResults}
          </p>
          <p className="mt-2 text-brand-gray-500">
            {g.noResultsSub}{" "}
            <a href="/contact" className="text-brand-red hover:underline">
              {g.noResultsContact}
            </a>{" "}
            {g.noResultsSource}
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
