"use client";

/**
 * Dealer logo + Google review cluster — bottom-right slot.
 *
 * Renders as a live link to the dealership's Google Business Profile so
 * shoppers can read the actual reviews. Frosted-glass translucent
 * treatment matches the rest of the photo overlay system.
 *
 * Client component because of the stopPropagation onClick — needed so
 * tapping the badge on an inventory card opens Google Reviews instead
 * of navigating to the vehicle's VDP (the card itself is a click target
 * via the title link's ::before pseudo-element).
 */

interface DealerClusterProps {
  rating: number;
  reviewCount: number;
  /** URL to the dealership's public Google reviews page. */
  reviewsUrl: string;
  /** Compact mode for inventory cards — single combined pill, monogram only. */
  compact?: boolean;
}

// Shared frosted-glass surface — same recipe as FeaturePillCluster /
// WarrantyBadge for a unified look.
const GLASS_STYLE = {
  backgroundColor: "rgba(15, 23, 42, 0.32)",
  backdropFilter: "blur(8px) saturate(1.4)",
  WebkitBackdropFilter: "blur(8px) saturate(1.4)",
  textShadow: "0 1px 2px rgba(0,0,0,0.6)",
} as const;

export default function DealerCluster({
  rating,
  reviewCount,
  reviewsUrl,
  compact,
}: DealerClusterProps) {
  if (compact) {
    // Compact: single combined pill — heart mono + Google rating.
    // Mobile sizing (~9px) sm+ scales up to 10px so it doesn't dominate
    // the photo at narrow widths.
    return (
      <a
        href={reviewsUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        aria-label={`Read Love Auto Group's ${rating} star Google reviews (${reviewCount} or more)`}
        className="
          flex items-center gap-1 sm:gap-1.5
          rounded-md px-1.5 py-0.5 sm:px-2 sm:py-1
          text-white border border-white/25 no-underline
          shadow-[0_2px_6px_rgba(0,0,0,0.35)]
          text-[9px] sm:text-[10px] font-bold
          hover:border-white/50 hover:scale-[1.03] active:scale-100
          transition-all duration-150
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white
        "
        style={GLASS_STYLE}
      >
        <span className="text-[10px] sm:text-[12px] font-black text-[#EF4444]" aria-hidden="true">
          ♥
        </span>
        <span className="text-[#F59E0B] text-[10px] sm:text-[11px]" aria-hidden="true">
          ★
        </span>
        <span>{rating.toFixed(1)}</span>
        <span className="text-[#CBD5E1]">· {reviewCount}+</span>
      </a>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      {/* Dealer logo pill — links to home page */}
      <div
        className="
          flex items-center gap-1.5
          rounded-md px-3 py-1.5
          text-white border border-white/25
          shadow-[0_2px_6px_rgba(0,0,0,0.35)]
        "
        style={GLASS_STYLE}
      >
        <span className="text-[14px] font-black text-[#EF4444]" aria-hidden="true">
          ♥
        </span>
        <span className="text-[12px] font-extrabold tracking-[0.05em]">
          LOVE AUTO GROUP
        </span>
      </div>

      {/* Google review pill — live link to Google reviews */}
      <a
        href={reviewsUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        aria-label={`Read Love Auto Group's ${rating} star Google reviews (${reviewCount} or more)`}
        className="
          flex items-center gap-1.5
          rounded-md px-2.5 py-1.5
          text-white border border-white/25 no-underline
          shadow-[0_2px_6px_rgba(0,0,0,0.35)]
          text-[11px] font-bold
          hover:border-white/50 hover:scale-[1.03] active:scale-100
          transition-all duration-150
          focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white
        "
        style={GLASS_STYLE}
      >
        <span
          className="
            inline-flex items-center justify-center
            w-[18px] h-[18px] rounded-full bg-white
            text-[13px] font-black
          "
          style={{ color: "#4285F4" }}
          aria-hidden="true"
        >
          G
        </span>
        <span className="text-white">{rating.toFixed(1)}</span>
        <span className="text-[#F59E0B] text-[11px]" aria-hidden="true">
          ★★★★★
        </span>
        <span className="text-white">· {reviewCount}+</span>
      </a>
    </div>
  );
}
