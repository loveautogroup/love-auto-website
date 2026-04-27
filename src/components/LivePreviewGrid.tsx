"use client";

/**
 * 6-vehicle preview grid backed by useInventory(). Used by SEO landing
 * pages (free-carfax, /serving/[town]) where the parent server component
 * just supplies the marketing copy and we want the inventory portion to
 * always show live prices + the live set of available stock.
 *
 * Order: featured-picked first, then top-up with sortWithFeaturedFirst.
 */

import { useInventory } from "@/lib/useInventory";
import { sortWithFeaturedFirst, filterFeatured } from "@/data/merchandising";
import VehicleCard from "@/components/VehicleCard";

export default function LivePreviewGrid() {
  const { vehicles } = useInventory();
  const available = vehicles.filter((v) => v.status === "available");
  const featured = filterFeatured(available);
  const previewVehicles =
    featured.length >= 6
      ? featured.slice(0, 6)
      : sortWithFeaturedFirst(available).slice(0, 6);

  if (previewVehicles.length === 0) {
    return (
      <p className="text-brand-gray-500">
        Inventory rotates weekly. Browse our full inventory or call to ask
        about upcoming arrivals.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {previewVehicles.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}
