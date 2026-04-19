import type { Metadata } from "next";
import { sampleInventory } from "@/data/inventory";
import VehicleCard from "@/components/VehicleCard";
import InventoryFilters from "./InventoryFilters";

export const metadata: Metadata = {
  title: "Used Cars for Sale in Villa Park, IL | Love Auto Group",
  description:
    "Browse our Villa Park, IL inventory of quality used cars from $4,500 to $18,000. Lexus, Subaru, Acura, Mazda. Fully reconditioned and ready to drive.",
  alternates: { canonical: "https://loveautogroup.com/inventory" },
};

export default function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  // In production, this would use the sync'd Dealer Center data
  const vehicles = sampleInventory.filter((v) => v.status === "available");

  return (
    <>
      <section className="bg-brand-navy text-white py-10">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold">Our Inventory</h1>
          <p className="mt-2 text-brand-gray-300">
            Every vehicle inspected and reconditioned. Ready to drive home today.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
          {/* Filters sidebar */}
          <aside aria-label="Filter vehicles">
            <InventoryFilters />
          </aside>

          {/* Vehicle grid */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <p className="text-brand-gray-500 text-sm">
                Showing{" "}
                <span className="font-semibold text-brand-gray-900">
                  {vehicles.length}
                </span>{" "}
                vehicles
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
              {vehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>

            {vehicles.length === 0 && (
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
          </div>
        </div>
      </section>
    </>
  );
}
