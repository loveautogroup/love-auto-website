"use client";

/**
 * Dealer logo + Google review cluster — bottom-right slot.
 *
 * Non-compact (VDP hero): stacked LOVE AUTO GROUP pill + Option 2
 * gradient-circle Google badge. The circle uses a conic gradient ring
 * in Google brand colours with a frosted-glass interior.
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

/** Option 2 — thin conic-gradient ring circle badge. */
function GoogleCircleBadge({
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
      aria-label={`Read Love Auto Group's ${rating} star Google reviews — ${reviewCount}+ reviews`}
      className="
        block no-underline
        hover:scale-[1.06] active:scale-100
        transition-transform duration-150
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white
      "
      style={{
        /* Gradient ring — Google brand colours as a conic gradient */
        background:
          "conic-gradient(#4285F4 0%, #34A853 25%, #FBBC05 50%, #EA4335 75%, #4285F4 100%)",
        borderRadius: "50%",
        padding: "2.5px",
        width: 58,
        height: 58,
        boxShadow: "0 3px 10px rgba(0,0,0,0.45)",
        flexShrink: 0,
      }}
    >
      {/* Inner frosted circle */}
      <div
        style={{
          background: "rgba(10, 18, 36, 0.82)",
          backdropFilter: "blur(10px) saturate(1.3)",
          WebkitBackdropFilter: "blur(10px) saturate(1.3)",
          borderRadius: "50%",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 1,
        }}
      >
        {/* Google G */}
        <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        {/* Stars */}
        <span style={{ color: "#F59E0B", fontSize: 8, lineHeight: 1 }} aria-hidden="true">
          ★★★★★
        </span>
        {/* Rating */}
        <span
          style={{
            color: "#FFFFFF",
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 1,
            textShadow: "0 1px 2px rgba(0,0,0,0.8)",
            letterSpacing: "-0.02em",
          }}
        >
          {rating.toFixed(1)}
        </span>
        {/* Review count */}
        <span
          style={{
            color: "#CBD5E1",
            fontSize: 7.5,
            lineHeight: 1,
          }}
        >
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

      {/* Option 2: gradient circle Google Reviews badge */}
      {showBadge && (
        <GoogleCircleBadge
          rating={rating}
          reviewCount={reviewCount}
          reviewsUrl={reviewsUrl}
        />
      )}
    </div>
  );
}
