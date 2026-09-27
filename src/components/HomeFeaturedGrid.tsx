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
import { useRef, useEffect, type MouseEvent as ReactMouseEvent } from "react";

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
    <section className="bg-ink-100 py-14 sm:py-20" aria-labelledby="featured-heading">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink-200 pb-6 mb-10">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-red mb-3">
              Current Inventory
            </p>
            <h2 id="featured-heading" className="font-heading font-extrabold text-brand-gray-900 text-[clamp(1.65rem,3.2vw,2.5rem)] leading-[1.04]">
              On the lot now
            </h2>
          </div>
          <Link
            href="/inventory"
            className="group inline-flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-[0.09em] text-brand-gray-900 border-b border-current pb-0.5"
          >
            View all inventory
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 transition-transform duration-150 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-7 gap-y-10">
          {featuredVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
      </div>
    </section>
  );
}

export function HomeOnTheLot() {
  const { vehicles } = useInventory();
  const visible = useVisibleVehicles(vehicles);
  const config = useMerchandising();
  const ordered = sortWithFeaturedFirst(
    visible.filter((v) => v.status !== "sold")
  );
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollByPage = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.max(el.clientWidth * 0.9, 300), behavior: "smooth" });
  };

  // Click-and-drag to scroll (desktop mouse). Refs avoid re-renders mid-drag.
  const drag = useRef({ down: false, startX: 0, startScroll: 0, moved: false });
  const onDragStart = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el) return;
    drag.current = { down: true, startX: e.pageX, startScroll: el.scrollLeft, moved: false };
  };
  const onDragMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = scrollRef.current;
    if (!el || !drag.current.down) return;
    const dx = e.pageX - drag.current.startX;
    if (Math.abs(dx) > 5) drag.current.moved = true;
    const half = el.scrollWidth / 2;
    const target = drag.current.startScroll - dx;
    el.scrollLeft = half > 0 ? (((target % half) + half) % half) : Math.max(0, target);
  };
  const onDragEnd = () => {
    drag.current.down = false;
  };
  // Swallow the card-link click that would otherwise fire at the end of a drag.
  const onClickCapture = (e: ReactMouseEvent<HTMLDivElement>) => {
    if (drag.current.moved) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = false;
    }
  };

  // Continuous infinite auto-scroll (marquee). The list is duplicated below, so
  // wrapping scrollLeft back by one copy's width at the seam loops with no jump.
  // Paused while the visitor hovers or drags so they can read / interact.
  const pausedRef = useRef(false);
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    let raf = 0;
    let last = 0;
    const SPEED = 28; // px per SECOND (refresh-rate independent)
    const step = (now: number) => {
      if (last === 0) last = now;
      const dt = Math.min((now - last) / 1000, 0.05); // clamp so a backgrounded tab doesn't jump
      last = now;
      if (el && !pausedRef.current) {
        const half = el.scrollWidth / 2;
        if (half > 0) {
          let n = el.scrollLeft + SPEED * dt;
          if (n >= half) n -= half;
          el.scrollLeft = n;
        }
      }
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [ordered.length]);

  if (ordered.length === 0) return null;

  // Duplicate the vehicles so the strip can loop without a visible seam.
  const loopList = [...ordered, ...ordered];

  return (
    <div
      className="relative"
      onMouseEnter={() => { pausedRef.current = true; }}
      onMouseLeave={() => { pausedRef.current = false; onDragEnd(); }}
    >
      {/* Prev / Next arrows for the carousel (desktop); touch-swipe still works. */}
      <button
        type="button"
        aria-label="Previous vehicles"
        onClick={() => scrollByPage(-1)}
        className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-10 h-10 bg-white text-brand-gray-900 hover:bg-brand-gray-100 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <button
        type="button"
        aria-label="Next vehicles"
        onClick={() => scrollByPage(1)}
        className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 items-center justify-center w-10 h-10 bg-white text-brand-gray-900 hover:bg-brand-gray-100 transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <div
        ref={scrollRef}
        onMouseDown={onDragStart}
        onMouseMove={onDragMove}
        onMouseUp={onDragEnd}
        onMouseLeave={onDragEnd}
        onClickCapture={onClickCapture}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide cursor-grab active:cursor-grabbing select-none"
      >
      {loopList.map((v, i) => {
        const forcePh =
          config.overlays?.[v.vin]?.useComingSoonPlaceholder === true;
        const heroImg = forcePh
          ? "/images/coming-soon.png"
          : v.images && v.images[0]
            ? v.images[0]
            : "/images/coming-soon.png";
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
            key={`${v.id}-${i}`}
            href={`/inventory/${v.slug}`}
            className="w-[260px] sm:w-[280px] min-w-[260px] sm:min-w-[280px] bg-white/5 hover:bg-white/10 border border-white/10 hover:border-brand-red overflow-hidden transition-all snap-start shrink-0 group"
          >
            <div className="aspect-[4/3] bg-brand-gray-700/50 relative overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImg}
                alt={`${v.year} ${v.make} ${v.model}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={(e) => {
                  const img = e.currentTarget;
                  if (!img.src.endsWith("/images/coming-soon.png")) {
                    img.src = "/images/coming-soon.png";
                  }
                }}
              />
              {v.daysOnLot > 0 && v.daysOnLot <= 7 && (
                <span className="absolute top-0 left-0 bg-brand-navy text-white text-[10px] font-bold uppercase tracking-[0.08em] px-2.5 py-1">
                  Just Arrived
                </span>
              )}
            </div>
            <div className="p-3">
              <h3 className="font-bold text-white text-sm group-hover:text-brand-red-light transition-colors">
                {v.year} {v.make} {v.model}
              </h3>
              <div className="flex items-baseline justify-between mt-1.5">
                <span className="text-brand-red-light font-bold">{price}</span>
                <span className="text-xs text-brand-gray-400">{miles} mi</span>
              </div>
            </div>
          </Link>
        );
      })}
      </div>
    </div>
  );
}
