import type { Metadata } from 'next';
import Link from 'next/link';
import VehicleCard from '@/components/ui/VehicleCard';
import { FEATURED_VEHICLES } from '@/data/featured-vehicles';

export const metadata: Metadata = {
  title: 'Inventory',
  description:
    'Browse our current inventory of quality used vehicles. Every car is inspected and reconditioned. Love Auto Group, Villa Park, IL.',
};

export default function InventoryPage() {
  // In production, vehicles come from Dealer Center sync via API
  const vehicles = FEATURED_VEHICLES;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1
          className="text-3xl md:text-4xl font-bold text-gray-900"
          style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}
        >
          Our Inventory
        </h1>
        <p className="mt-2 text-gray-500">
          Showing {vehicles.length} vehicles. Every one inspected and reconditioned.
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filter sidebar */}
        <aside className="lg:w-64 shrink-0">
          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200 sticky top-24">
            <h2 className="font-semibold text-gray-900 mb-4">Filters</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Make</label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">All Makes</option>
                  <option>Lexus</option>
                  <option>Subaru</option>
                  <option>Acura</option>
                  <option>Mazda</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Body Style</label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">All Styles</option>
                  <option>Sedan</option>
                  <option>SUV</option>
                  <option>Truck</option>
                  <option>Coupe</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Max Price</label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="">No Limit</option>
                  <option value="10000">$10,000</option>
                  <option value="15000">$15,000</option>
                  <option value="20000">$20,000</option>
                  <option value="25000">$25,000</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
                <select className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
                  <option value="newest">Recently Added</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="mileage_asc">Mileage: Low to High</option>
                </select>
              </div>

              <button className="w-full bg-red-600 hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-lg transition-colors">
                Apply Filters
              </button>
            </div>
          </div>
        </aside>

        {/* Vehicle grid */}
        <div className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {vehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>

          {vehicles.length === 0 && (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">No vehicles match your filters.</p>
              <p className="text-gray-400 mt-2">
                Try adjusting your search or{' '}
                <Link href="/contact" className="text-red-600 hover:text-red-700">contact us</Link>
                {' '}and we can source a vehicle for you.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
