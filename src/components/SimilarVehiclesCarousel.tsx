"use client";

/**
 * SimilarVehiclesCarousel — live client-side "You may also like" strip.
 *
 * Uses useInventory() which reads from Cloudflare KV via /api/inventory.
 * This is Railway-hibernation-proof: CF KV is always available even when
 * the FastAPI backend is cold-starting. Server-side fetchDmsInventory()
 * was the prior approach but returned [] on cold builds, making the
 * section disappear entirely.
 *
 * Matching logic (in priority order):
 *   1. Same make — strongest signal
 *   2. Same body style — fallback when fewer same-make vehicles exist
 *
 * Filters out: the current vehicle, sold vehicles, hidden (KV overlay),
 * and vehicles with no photos.
 */

import Link from "next/link";
import { useInventory } from "@/lib/useInventory";
import { useVisibleVehicles } from "@/data/useMerchandising";

interface Props {
  currentId: string;
  make: string;
  bodyStyle: string;
}

export default function SimilarVehiclesCarousel({
  currentId,
  make,
  bodyStyle,
}: Props) {
  const { vehicles, loading } = useInventory();
  // Respect the DMS "Hide from website" toggle via live KV config.
  const visible = useVisibleVehicles(vehicles);

  const pool = visible.filter(
    (v) =>
      v.id !== currentId &&
      v.status !== "sold" &&
      v.images &&
      v.images.length > 0
  );

  // Prefer same make; fall back to same body style if we'd get fewer than 3.
  const sameMake = pool.filter((v) => v.make === make);
  const sameBody = pool.filter(
    (v) => v.make !== make && v.bodyStyle === bodyStyle
  );

  const candidates = sameMake.length >= 3
    ? sameMake
    : [...sameMake, ...sameBody];

  const similar = candidates.slice(0, 8);

  // Don't render while loading (avoids flash of sampleInventory stale cards)
  // and don't render if there's genuinely nothing.
  if (loading || similar.length === 0) return null;

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold text-brand-gray-900 mb-6">
        Similar Vehicles
      </h2>
      <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide">
        {similar.map((v) => {
          const priceHasCents = Math.round(v.price * 100) % 100 !== 0;
          const price = new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            minimumFractionDigits: priceHasCents ? 2 : 0,
            maximumFractionDigits: 2,
          }).format(v.price);
          const miles = new Intl.NumberFormat("en-US").format(v.mileage);

          return (
            <Link
              key={v.id}
              href={`/inventory/${v.slug}`}
              className="w-[260px] sm:w-[280px] min-w-[260px] sm:min-w-[280px] bg-white border border-brand-gray-200 hover:border-brand-red/40 rounded-xl overflow-hidden transition-all snap-start shrink-0 group hover:shadow-md"
            >
              <div className="aspect-[4/3] bg-brand-gray-100 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={v.images[0]}
                  alt={`${v.year} ${v.make} ${v.model}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </div>
              <div className="p-3">
                <h3 className="font-bold text-brand-gray-900 text-sm group-hover:text-brand-red transition-colors">
                  {v.year} {v.make} {v.model}
                </h3>
                <div className="flex items-baseline justify-between mt-1.5">
                  <span className="text-brand-red font-bold">{price}</span>
                  <span className="text-xs text-brand-gray-500">{miles} mi</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
