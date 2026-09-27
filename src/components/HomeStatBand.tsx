"use client";

/**
 * Full-bleed black stat band — four real numbers, hairline dividers, no
 * icons. Replaces the icon-in-a-circle trust strip pattern for this one
 * beat on the homepage (the existing 3-pillar VDPTrustStrip stays where it
 * is, restyled the same flat way, for the VDP/inventory/homepage ticker
 * role — this is a second, higher-impact "data band" moment, matching
 * homepage.html).
 *
 * "50 states" was never claimed here — copy says "Ships anywhere in the
 * U.S.", the wording actually used across the site, not a specific count.
 */

import { useReviews } from "@/context/ReviewsContext";

export default function HomeStatBand() {
  const googleReviews = useReviews();

  return (
    <section className="bg-brand-navy text-white">
      <div className="max-w-7xl mx-auto grid grid-cols-2 sm:grid-cols-4">
        <div className="px-4 py-10 sm:py-14 text-center border-t sm:border-t-0 border-white/[.14] first:border-t-0">
          <div className="font-heading font-extrabold text-[clamp(1.5rem,2.6vw,2.4rem)] text-brand-red">
            $0
          </div>
          <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-400">
            Dealer Fees
          </div>
        </div>
        <div className="px-4 py-10 sm:py-14 text-center border-t sm:border-t-0 border-l border-white/[.14]">
          <div className="font-heading font-extrabold text-[clamp(1.5rem,2.6vw,2.4rem)]">
            {googleReviews.rating}&#9733;
          </div>
          <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-400">
            Google Rating &middot; {googleReviews.reviewCount} Reviews
          </div>
        </div>
        <div className="px-4 py-10 sm:py-14 text-center border-t border-white/[.14] sm:border-l">
          <div className="font-heading font-extrabold text-[clamp(1.5rem,2.6vw,2.4rem)]">
            2014
          </div>
          <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-400">
            Family Owned Since
          </div>
        </div>
        <div className="px-4 py-10 sm:py-14 text-center border-t border-l border-white/[.14]">
          <div className="font-heading font-extrabold text-[clamp(1.05rem,2.2vw,1.7rem)] leading-tight">
            Ships Anywhere
          </div>
          <div className="mt-2 text-[11px] font-bold uppercase tracking-[0.1em] text-ink-400">
            In the U.S.
          </div>
        </div>
      </div>
    </section>
  );
}
