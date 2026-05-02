"use client";

/**
 * Generic make/body-style/serving-area inventory grid that pulls from
 * the live DMS snapshot via useInventory(). Server-rendered fallback
 * count + grid is provided by the parent page (so the static HTML still
 * shows something when JS is off); once useInventory() hydrates with
 * the live data this component swaps in fresh prices and the live set
 * of available vehicles.
 *
 * predicate runs against the same filter logic the parent used to build
 * fallback content — keeping the two in sync is a parent responsibility.
 */

import { useInventory } from "@/lib/useInventory";
import { sortWithFeaturedFirst, filterFeatured } from "@/data/merchandising";
import { useVisibleVehicles } from "@/data/useMerchandising";
import VehicleCard from "@/components/VehicleCard";
import type { Vehicle } from "@/lib/types";

interface LiveFilteredGridProps {
  predicate: (v: Vehicle) => boolean;
  /** "all" → every vehicle matching predicate, sorted with featured first.
   *  "preview" → first 6, featured-first.
   *  "preview-featured-only" → only featured (matching predicate), capped 6,
   *  topping up with sortWithFeaturedFirst if fewer than 6 are featured. */
  mode?: "all" | "preview" | "preview-featured-only";
  emptyMessage?: string;
}

export default function LiveFilteredGrid({
  predicate,
  mode = "all",
  emptyMessage,
}: LiveFilteredGridProps) {
  const { vehicles } = useInventory();
  // Filter KV-hidden vehicles first so hidden cars don't appear on brand/area pages.
  const visibleVehicles = useVisibleVehicles(vehicles);
  const matched = visibleVehicles.filter(
    (v) => v.status === "available" && predicate(v)
  );
  const ordered = sortWithFeaturedFirst(matched);

  let toShow = ordered;
  if (mode === "preview") toShow = ordered.slice(0, 6);
  if (mode === "preview-featured-only") {
    const featured = filterFeatured(matched);
    toShow = featured.length >= 6 ? featured.slice(0, 6) : ordered.slice(0, 6);
  }

  if (toShow.length === 0) {
    return emptyMessage ? (
      <p className="text-brand-gray-500">{emptyMessage}</p>
    ) : null;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {toShow.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}

export function LiveFilteredCount({
  predicate,
  fallbackCount,
}: {
  predicate: (v: Vehicle) => boolean;
  fallbackCount: number;
}) {
  const { vehicles, source } = useInventory();
  const visibleForCount = useVisibleVehicles(vehicles);
  if (source === "fallback") return <>{fallbackCount}</>;
  const n = visibleForCount.filter((v) => v.status === "available" && predicate(v)).length;
  return <>{n}</>;
}
