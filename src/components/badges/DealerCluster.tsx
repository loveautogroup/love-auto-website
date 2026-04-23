/**
 * Dealer logo + Google review cluster — bottom-right slot.
 * Two stacked dark-transparent pills: Love Auto Group wordmark on top,
 * Google review rating (stars + count) on bottom.
 */

interface DealerClusterProps {
  rating: number;
  reviewCount: number;
  /** Compact mode for inventory cards — single combined pill, monogram only. */
  compact?: boolean;
}

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
          text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]
          backdrop-blur-sm text-[9px] sm:text-[10px] font-bold
        "
        style={{ backgroundColor: "rgba(15, 23, 42, 0.78)" }}
      >
        <span className="text-[10px] sm:text-[12px] font-black text-[#EF4444]" aria-hidden="true">
          ♥
        </span>
        <span className="text-[#F59E0B] text-[10px] sm:text-[11px]" aria-hidden="true">
          ★
        </span>
        <span>{rating.toFixed(1)}</span>
        <span className="text-[#94A3B8]">· {reviewCount}+</span>
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
          text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]
          backdrop-blur-sm
        "
        style={{ backgroundColor: "rgba(15, 23, 42, 0.78)" }}
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
          text-white shadow-[0_2px_4px_rgba(0,0,0,0.3)]
          backdrop-blur-sm
          text-[11px] font-bold
        "
        style={{ backgroundColor: "rgba(15, 23, 42, 0.78)" }}
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
