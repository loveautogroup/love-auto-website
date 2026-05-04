"use client";

/**
 * Featured Vehicles grid + "On the Lot Now" carousel for the homepage.
 *
 * Featured list is driven EXCLUSIVELY by the live KV config (config.featuredVins).
 * The static MERCHANDISING fallback is intentionally NOT used here — if the DMS
 * has no vehicles toggled as featured, this grid renders nothing. No topUp/fallback
 * that bleeds all-inventory onto the homepage when nothing is hand-picked.
 *
 * The section wrapper + heading live inside this component so it can self-hide
 * when featuredVehicles.length === 0. page.tsx renders <HomeFeaturedGrid /> only.
 */

import Link from "next/link";
import { useInventory } from "@/lib/useInventory";
import { sortWithFeaturedFirst } from "@/data/merchandising";
import { useVisibleVehicles, useMerchandising } from "@/data/useMerchandising";
import VehicleCard from "@/components/VehicleCard";

export default function HomeFeaturedGrid() {
  const { vehicles } = useInventory();
  const config = useMerchandising();
  // Respect the DMS "Hide from website" toggle via live KV config.
  const visible = useVisibleVehicles(vehicles);
  const available = visible.filter((v) => v.status !== "sold");

  // Build featured list from the LIVE KV featuredVins — order preserved.
  // If KV returns an empty array, featuredVehicles is empty and the section
  // hides itself. No fallback to "show everything" when nothing is featured.
  const byVin = new Map(available.map((v) => [v.vin, v]));
  const featuredVehicles = (config.featuredVins ?? [])
    .map((vin) => byVin.get(vin))
    .filter((v): v is NonNullable<typeof v> => v !== undefined);

  // Nothing featured → hide the entire section (heading and all).
  if (featuredVehicles.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-16" aria-labelledby="featured-heading">
      <div className="text-center mb-10">
        <h2 id="featured-heading" className="text-3xl font-bold text-brand-gray-900">
          Featured Vehicles
        </h2>
        <p className="mt-2 text-brand-gray-500">
          Hand-picked from our inventory, inspected and ready to drive
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {featuredVehicles.map((vehicle) => (
          <VehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
      <div className="text-center mt-10">
        <Link
          href="/inventory"
          className="inline-flex items-center bg-brand-red hover:bg-brand-red-dark text-white px-8 py-3 rounded-xl font-semibold transition-colors"
        >
          View All Inventory
          <svg xmlns="http://www.w3.org/2000/svg" className="ml-2 w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </Link>
      </div>
    </section>
  );
}

export function HomeOnTheLot() {
  const { vehicles } = useInventory();
  const visible = useVisibleVehicles(vehicles);
  const ordered = sortWithFeaturedFirst(
    visible.filter((v) => v.status !== "sold")
  );
  return (
    <div className="flex gap-4 overflow-x-auto p