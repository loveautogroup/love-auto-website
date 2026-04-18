import Link from 'next/link';
import type { VehicleSummary } from '@/types/vehicle';

interface VehicleCardProps {
  vehicle: VehicleSummary;
}

export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(vehicle.price);

  const formattedMileage = new Intl.NumberFormat('en-US').format(vehicle.mileage);

  return (
    <Link
      href={`/inventory/${vehicle.slug}`}
      className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200"
    >
      {/* Photo */}
      <div className="relative aspect-[16/10] bg-gray-100 overflow-hidden">
        {/* Placeholder gradient — replaced by real photos in production */}
        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
          <svg className="w-20 h-12 text-gray-400" viewBox="0 0 120 60" fill="none">
            <rect x="15" y="25" width="90" height="25" rx="8" fill="currentColor" opacity="0.3" />
            <rect x="25" y="15" width="55" height="20" rx="6" fill="currentColor" opacity="0.2" />
            <circle cx="35" cy="50" r="8" fill="currentColor" opacity="0.3" />
            <circle cx="85" cy="50" r="8" fill="currentColor" opacity="0.3" />
          </svg>
        </div>

        {/* Badges */}
        <div className="absolute top-3 left-3 flex gap-2">
          {vehicle.daysOnLot <= 7 && (
            <span className="bg-red-600 text-white text-xs font-semibold px-2.5 py-1 rounded-full">
              Just Arrived
            </span>
          )}
          {vehicle.drivetrain === 'AWD' && (
            <span className="bg-gray-900/80 text-white text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm">
              AWD
            </span>
          )}
        </div>

        {vehicle.status === 'sale_pending' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="bg-yellow-500 text-black text-sm font-bold px-4 py-2 rounded-lg rotate-[-5deg]">
              Sale Pending
            </span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3
          className="font-bold text-gray-900 text-lg group-hover:text-red-600 transition-colors leading-tight"
          style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}
        >
          {vehicle.year} {vehicle.make} {vehicle.model}
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">{vehicle.trim}</p>

        <div className="flex items-baseline justify-between mt-3">
          <span className="text-xl font-bold text-gray-900">{formattedPrice}</span>
          <span className="text-sm text-gray-500">{formattedMileage} mi</span>
        </div>

        {/* Feature chips */}
        {vehicle.features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {vehicle.features.slice(0, 3).map((feature) => (
              <span
                key={feature}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded"
              >
                {feature}
              </span>
            ))}
            {vehicle.features.length > 3 && (
              <span className="text-xs text-gray-400">
                +{vehicle.features.length - 3} more
              </span>
            )}
          </div>
        )}

        <div className="mt-4 text-sm font-medium text-red-600 group-hover:text-red-700 flex items-center gap-1">
          View Details
          <svg className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
