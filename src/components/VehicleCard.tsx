import Image from "next/image";
import Link from "next/link";
import { Vehicle } from "@/lib/types";
import { resolveOverlay } from "@/data/merchandising";
import { CarfaxBadge, StatusPill } from "./badges";

interface VehicleCardProps {
  vehicle: Vehicle;
}

function estimateMonthlyPayment(
  price: number,
  downPayment = 1000,
  apr = 0.0699,
  termMonths = 60
): number {
  const principal = price - downPayment;
  if (principal <= 0) return 0;
  const monthlyRate = apr / 12;
  return Math.round(
    (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1)
  );
}

/**
 * Vehicle card for the inventory grid and homepage Featured section.
 *
 * Bob's call: cards in a grid are too small (~360px wide on desktop, narrower
 * on mobile) for the full Maxim-style overlay. The full overlay lives on the
 * VDP main photo (PhotoGallery) where there's room. Cards keep ONLY the two
 * elements that drive a click:
 *   - Top-left: CARFAX Free Report (or status pill if no Carfax)
 *   - Top-center: up to 3 feature pills (Jordan-authored copy, slimmed down)
 *
 * Phone, warranty, dealer logo, Google review badge are all available
 * sitewide in the header — duplicating them on every card was clutter.
 */
export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const overlay = resolveOverlay(
    vehicle.vin,
    vehicle.daysOnLot,
    vehicle.status
  );
  const showCarfax = overlay.carfax === true;
  const visiblePills = (overlay.featurePills ?? []).filter(
    (p): p is string => Boolean(p && p.trim())
  );

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(vehicle.price);

  const formattedMileage = new Intl.NumberFormat("en-US").format(
    vehicle.mileage
  );

  const monthlyPayment = estimateMonthlyPayment(vehicle.price);
  const hasRealImage =
    vehicle.images.length > 0 && !vehicle.images[0].includes("placeholder");

  return (
    <article
      className="
        group relative
        bg-white rounded-xl border border-brand-gray-200 overflow-hidden
        hover:shadow-lg hover:border-brand-red/30 transition-all duration-200
      "
    >
      {/* Photo + minimal corner overlays */}
      <div className="relative aspect-[4/3] bg-brand-gray-100 overflow-hidden">
        {hasRealImage ? (
          <Image
            src={vehicle.images[0]}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-brand-gray-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-16 h-16"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Top-left: CARFAX (compact at card scale) or status pill */}
        <div className="absolute top-3 left-3 z-10 [&_.carfax-scale]:scale-90 [&_.carfax-scale]:origin-top-left">
          {showCarfax ? (
            <div className="carfax-scale">
              <CarfaxBadge vin={vehicle.vin} />
            </div>
          ) : overlay.effectiveStatus ? (
            <StatusPill kind={overlay.effectiveStatus} />
          ) : null}
        </div>
      </div>

      {/* Info area */}
      <div className="p-4">
        <h3 className="font-bold text-brand-gray-900 group-hover:text-brand-red transition-colors">
          <Link
            href={`/inventory/${vehicle.slug}`}
            className="before:absolute before:inset-0 before:z-[2] before:content-['']"
          >
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Link>
        </h3>
        <p className="text-sm text-brand-gray-500 mt-0.5">{vehicle.trim}</p>

        <div className="flex items-baseline justify-between mt-3">
          <span className="text-xl font-bold text-brand-red">
            {formattedPrice}
          </span>
          <span className="text-sm text-brand-gray-500">
            {formattedMileage} mi
          </span>
        </div>

        <p className="text-sm text-brand-gray-500 mt-1">
          Est.{" "}
          <span className="font-semibold text-brand-gray-700">
            ${monthlyPayment}/mo
          </span>
          <span
            className="text-xs text-brand-gray-400 ml-1"
            title="Based on $1,000 down, 6.99% APR, 60 months"
          >
            *
          </span>
        </p>

        {/* Jordan-authored feature pills, sized for card width.
            (On the VDP these sit on the photo; on cards they live below
            because there isn't room over the photo.) */}
        {visiblePills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {visiblePills.map((pill, i) => (
              <span
                key={i}
                className="
                  text-[11px] font-bold leading-tight
                  bg-blue-600/90 text-white
                  px-2.5 py-1 rounded-full
                "
              >
                {pill.replace(/\n/g, " ")}
              </span>
            ))}
          </div>
        )}

        {/* Spec chips — drivetrain + first 2 features */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {vehicle.drivetrain !== "FWD" && (
            <span className="text-xs bg-brand-gray-100 text-brand-gray-700 px-2 py-0.5 rounded-full">
              {vehicle.drivetrain}
            </span>
          )}
          {vehicle.features.slice(0, 2).map((feature) => (
            <span
              key={feature}
              className="text-xs bg-brand-gray-100 text-brand-gray-700 px-2 py-0.5 rounded-full"
            >
              {feature.length > 20 ? feature.slice(0, 18) + "..." : feature}
            </span>
          ))}
        </div>

        <div className="mt-4 text-sm text-brand-red font-semibold group-hover:underline">
          View Details →
        </div>
      </div>
    </article>
  );
}
