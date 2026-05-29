"use client";

/**
 * Dealer logo + Google review cluster — bottom-right slot.
 *
 * Non-compact (VDP hero): stacked LOVE AUTO GROUP pill + a "Google
 * Reviews" lockup (multicolor wordmark + gold stars + rating) on a
 * frosted-glass chip.
 *
 * Compact (inventory cards): single combined pill — heart + star + rating.
 *
 * showBadge=false hides the Google circle entirely (controlled per-vehicle
 * from the DMS merchandising panel).
 *
 * Client component because of the stopPropagation onClick handler.
 */

interface DealerClusterProps {
  rating: number;
  reviewCount: number;
  /** URL to the dealership's public Google reviews page. */
  reviewsUrl: string;
  /** Compact mode for inventory cards — single combined pill, monogram only. */
  compact?: boolean;
  /**
   * Show the Google Reviews badge. Default true.
   * Pass false to hide (controlled from DMS merchandising panel).
   */
  showBadge?: boolean;
}

// Shared frosted-glass surface — same recipe as FeaturePillCluster /
// WarrantyBadge for a unified look.
const GLASS_STYLE = {
  backgroundColor: "rgba(15, 23, 42, 0.18)",
  backdropFilter: "blur(10px) saturate(1.4)",
  WebkitBackdropFilter: "blur(10px) saturate(1.4)",
  textShadow:
    "0 0 1px rgba(0,0,0,0.95), 1px 1px 1px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.7)",
} as const;

/** Stacked "Google Reviews" lockup — multicolor wordmark + gold stars + our
 *  real rating/count. Sits on a frosted dark chip so it reads over any photo. */
function GoogleReviewsLockup({
  rating,
  reviewCount,
  reviewsUrl,
}: {
  rating: number;
  reviewCount: number;
  reviewsUrl: string;
}) {
  return (
    <a
      href={reviewsUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      aria-label={`Read Love Auto Group's ${rating} star Google reviews, ${reviewCount}+ reviews`}
      className="
        block no-underline text-right
        rounded-lg px-3 py-2 border border-white/20
        hover:scale-[1.04] active:scale-100
        transition-transform duration-150
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white
      "
      style={{
        backgroundColor: "rgba(10, 18, 36, 0.55)",
        backdropFilter: "blur(10px) saturate(1.3)",
        WebkitBackdropFilter: "blur(10px) saturate(1.3)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
        textShadow: "0 1px 2px rgba(0,0,0,0.7)",
        flexShrink: 0,
      }}
    >
      {/* Google wordmark + "Reviews" */}
      <div
        style={{ fontWeight: 700, fontSize: 18, lineHeight: 1, letterSpacing: "-0.01em" }}
        aria-hidden="true"
      >
        <span style={{ color: "#4285F4" }}>G</span>
        <span style={{ color: "#EA4335" }}>o</span>
        <span style={{ color: "#FBBC05" }}>o</span>
        <span style={{ color: "#4285F4" }}>g</span>
        <span style={{ color: "#34A853" }}>l</span>
        <span style={{ color: "#EA4335" }}>e</span>
        <span style={{ color: "#C7CDD6", fontWeight: 600 }}> Reviews</span>
      </div>

      {/* Gold stars + rating + count */}
      <div
        style={{
          marginTop: 5,
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          gap: 6,
        }}
      >
        <span
          style={{ color: "#FBBC05", fontSize: 13, letterSpacing: "1px" }}
          aria-hidden="true"
        >
          ★★★★★
        </span>
        <span style={{ color: "#FFFFFF", fontSize: 13, fontWeight: 800 }}>
          {rating.toFixed(1)}
        </span>
        <span style={{ color: "#CBD5E1", fontSize: 11 }}>
          {reviewCount}+ reviews
        </span>
      </div>
    </a>
  );
}

export default function DealerCluster({
  rating,
  reviewCount,
  reviewsUrl,
  compact,
  showBadge = true,
}: DealerClusterProps) {
  if (compact) {
    // Compact: single combined pill — heart mono + Google rating.
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

  // Non-compact (VDP hero): LOVE AUTO GROUP pill + Option 2 gradient circle
  return (
    <div className="flex flex-col items-end gap-2">
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

      {/* Stacked Google Reviews lockup */}
      {showBadge && (
        <GoogleReviewsLockup
          rating={rating}
          reviewCount={reviewCount}
          reviewsUrl={reviewsUrl}
        />
      )}
    </div>
  );
}
