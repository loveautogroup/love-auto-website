"use client";

/**
 * Client-side inventory section for /inventory/used-{make} and
 * /inventory/used-{bodyStyle} landing pages. Fetches live DMS inventory
 * via useInventory(), filters by make or body style, and renders the
 * grid + headline count + empty state. The parent server component
 * (MakeLandingPage) renders only the surrounding marketing copy so the
 * inventory portion is always live.
 */

import Link from "next/link";
import { useInventory } from "@/lib/useInventory";
import { sortWithFeaturedFirst } from "@/data/merchandising";
import VehicleCard from "@/components/VehicleCard";

interface MakeLandingInventoryProps {
  filterType: "make" | "bodyStyle";
  filterValue: string;
  pluralNoun: string;
  make: string;
}

export default function MakeLandingInventory({
  filterType,
  filterValue,
  pluralNoun,
  make,
}: MakeLandingInventoryProps) {
  const { vehicles } = useInventory();
  const value = filterValue.toLowerCase();
  const isBodyStyle = filterType === "bodyStyle";

  const inventoryForMake = sortWithFeaturedFirst(
    vehicles.filter((v) => {
      if (v.status !== "available") return false;
      if (isBodyStyle) return v.bodyStyle.toLowerCase() === value;
      return v.make.toLowerCase() === value;
    })
  );

  return (
    <section
      className="max-w-7xl mx-auto px-4 py-12"
      aria-labelledby="live-inv-heading"
    >
      <h2
        id="live-inv-heading"
        className="text-2xl font-bold text-brand-gray-900 mb-2"
      >
        Available {isBodyStyle ? pluralNoun : `Used ${make}`} Inventory
      </h2>
      <p className="text-brand-gray-500 mb-6">
        {inventoryForMake.length > 0
          ? `${inventoryForMake.length} ${pluralNoun.toLowerCase()} on the lot today.`
          : `No ${pluralNoun.toLowerCase()} in stock right now — check back soon, or `}
        {inventoryForMake.length === 0 && (
          <Link
            href="/sell-your-car"
            className="text-brand-red hover:underline font-semibold"
          >
            tell us what you're looking for
          </Link>
        )}
        {inventoryForMake.length === 0 && " and we'll source one to order."}
      </p>

      {inventoryForMake.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {inventoryForMake.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      ) : (
        <div className="bg-brand-gray-50 border border-brand-gray-200 rounded-xl p-8 text-center">
          <p className="text-brand-gray-700">
            We rotate inventory weekly. Browse our{" "}
            <Link
              href="/inventory"
              className="text-brand-red hover:underline font-semibold"
            >
              full inventory
            </Link>{" "}
            or call{" "}
            <a
              href="tel:6303593643"
              className="text-brand-red hover:underline font-semibold"
            >
              (630) 359-3643
            </a>{" "}
            to ask about upcoming arrivals.
          </p>
        </div>
      )}
    </section>
  );
}
