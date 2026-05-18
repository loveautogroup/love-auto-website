"use client";

/**
 * SimilarVehiclesCarousel — live client-side "You may also like" strip
 * with prev/next arrow navigation.
 *
 * Uses useInventory() which reads from Cloudflare KV via /api/inventory.
 * Railway-hibernation-proof: CF KV is always available even when the
 * FastAPI backend is cold-starting.
 */

import { useRef, useState, useEffect, useCallback } from "react";
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
  const visible = useVisibleVehicles(vehicles);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const pool = visible.filter(
    (v) =>
      v.id !== currentId &&
      v.status !== "sold" &&
      v.images &&
      v.images.length > 0
  );

  const sameMake = pool.filter((v) => v.make === make);
  const sameBody = pool.filter(
    (v) => v.make !== make && v.bodyStyle === bodyStyle
  );
  const candidates = sameMake.length >= 3 ? sameMake : [...sameMake, ...sameBody];
  const similar = candidates.slice(0, 8);

  // Update arrow visibility whenever scroll position changes.
  const updateArrows = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateArrows();
    el.addEventListener("scroll", updateArrows, { passive: true });
    // Also re-check on resize (viewport changes, images load, etc.)
    const ro = new ResizeObserver(updateArrows);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", updateArrows);
      ro.disconnect();
    };
  }, [similar.length, updateArrows]);

  const scroll = (dir: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    // Scroll by ~1 card width (288px + 16px gap)
    el.scrollBy({ left: dir === "left" ? -304 : 304, behavior: "smooth" });
  };

  if (loading || similar.length === 0) return null;

  return (
    <section className="mt-12">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-brand-gray-900">
          Similar Vehicles
        </h2>

        {/* Arrow buttons — only shown when there are enough cards to scroll */}
        {(canScrollLeft || canScrollRight) && (
          <div className="flex gap-2">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              aria-label="Scroll left"
              className="w-9 h-9 rounded-full border border-brand-gray-200 flex items-center justify-center transition-colors
                disabled:opacity-30 disabled:cursor-not-allowed
                enabled:hover:border-brand-red enabled:hover:text-brand-red enabled:hover:bg-red-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => scroll("right")}
              disabled={!canScrollRight}
              aria-label="Scroll right"
              className="w-9 h-9 rounded-full border border-brand-gray-200 flex items-center justify-center transition-colors
                disabled:opacity-30 disabled:cursor-not-allowed
                enabled:hover:border-brand-red enabled:hover:text-brand-red enabled:hover:bg-red-50"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        )}
      </div>

      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
      >
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
