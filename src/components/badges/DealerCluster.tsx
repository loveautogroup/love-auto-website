/**
 * Dealer logo + Google review cluster — bottom-right slot.
 *
 * Frosted-glass translucent treatment to match the rest of the photo
 * overlay system. Heart/star/Google text reads through the photo with
 * a backdrop blur and white text-shadow for legibility.
 */

interface DealerClusterProps {
  rating: number;
  reviewCount: number;
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

export default function DealerCluster({ rating, reviewCount, compact }: DealerClusterProps) {
  if (compact) {
    // Compact: single combined pill — heart mono + Google rating.
    // Mobile sizing (~9px) sm+ scales up to 10px so it doesn't dominate
    // the photo at narrow widths.
    return (
      <div
        className="
          flex items-center gap-1 sm:gap-1.5
          rounded-md px-1.5 py-0.5 sm:px-2 sm:py-1
          text-white border border-white/25
          shadow-[0_2px_6px_rgba(0,0,0,0.35)]
          text-[9px] sm:text-[10px] font-bold
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
        <span className="sr-only">
          Love Auto Group, {rating} out of 5 stars based on {reviewCount} or more reviews
        </span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      {/* Dealer logo pill */}
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

      {/* Google review pill */}
      <div
        className="
          flex items-center gap-1.5
          rounded-md px-2.5 py-1.5
          text-white border border-white/25
          shadow-[0_2px_6px_rgba(0,0,0,0.35)]
          text-[11px] font-bold
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
        <span className="sr-only">
          {rating} out of 5 stars based on {reviewCount} or more reviews
        </span>
      </div>
    </div>
  );
}
