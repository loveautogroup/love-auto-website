"use client";

/**
 * Dealer logo badge — the Love Auto Group logo in a dark navy rounded pill.
 *
 * Matches the baked-photo badge exactly:
 *   • logo-primary.svg (red LOVE, white AUTO GROUP, SINCE 2014)
 *   • navy pill: rgba(6, 8, 18, ~0.90) background
 *   • border-radius 18% of pill height (approximated via rounded-xl)
 *   • 2.2% margin placement (handled by parent / PhotoGallery)
 *   • 93% opacity composite
 *
 * compact=true → scaled-down version for inventory grid cards.
 *   The parent (VehicleCard) applies scale-[0.6] so the logo itself
 *   stays legible at card size.
 *
 * hideBadge=true → hides the logo pill when it has been baked into
 *   the hero photo pixels (avoids double-stamping).
 *
 * Client component because of the stopPropagation onClick handler
 * on the Google Reviews lockup.
 */

/* ─── Google Reviews lockup ────────────────────────────────────────── */

export function GoogleReviewsLockup({
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
        <span style={{ color: "#FBBC05", fontSize: 13, letterSpacing: "1px" }} aria-hidden="true">
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

/* ─── Dealer logo badge ─────────────────────────────────────────────── */

interface DealerClusterProps {
  rating: number;
  reviewCount: number;
  /** URL to the dealership's public Google reviews page. */
  reviewsUrl: string;
  /** Compact mode for inventory grid cards. */
  compact?: boolean;
  /**
   * Show the Google Reviews lockup. Default true.
   * Pass false to hide (controlled from DMS merchandising panel).
   */
  showBadge?: boolean;
  /**
   * Hide the dealer logo pill.
   * Pass true when the logo has been baked into the hero photo pixels
   * to avoid double-stamping.
   */
  hideDealerPill?: boolean;
}

export default function DealerCluster({
  rating,
  reviewCount,
  reviewsUrl,
  compact,
  showBadge = true,
  hideDealerPill = false,
}: DealerClusterProps) {
  /* ── Logo badge pill — inline SVG, lives in JS bundle so CF CDN cache-busts automatically ── */
  // +15% (Jeremiah, Session 18) — keep in sync with the bake compositor
  // (photo_overlay.py composite_logo_badge uses 186x67).
  // Uniform badge spec (Jeremiah 2026-06-05): 186px wide, same as
  // CarfaxBadge and the natural GoogleReviewsLockup width.
  const logoW = compact ? 126 : 186;
  const logoH = compact ? 45  : 66;

  const logoPill = !hideDealerPill && (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: "rgba(6, 8, 18, 0.90)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.45)",
        padding: compact ? "6px 10px" : "8px 14px",
        opacity: 0.93,
      }}
      aria-label="Love Auto Group"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 280 100"
        width={logoW} height={logoH} style={{ display: "block" }} aria-hidden="true">
        <defs>
          <linearGradient id="lag-accent" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%"   stopColor="#dc2626" stopOpacity="0" />
            <stop offset="30%"  stopColor="#dc2626" stopOpacity="1" />
            <stop offset="70%"  stopColor="#dc2626" stopOpacity="1" />
            <stop offset="100%" stopColor="#dc2626" stopOpacity="0" />
          </linearGradient>
        </defs>
        <text x="140" y="43" textAnchor="middle"
          fontFamily="Montserrat, Arial Black, sans-serif"
          fontWeight="900" fontSize="42" fill="#dc2626" letterSpacing="6">LOVE</text>
        <rect x="70" y="51" width="140" height="2.5" rx="1.25" fill="url(#lag-accent)" />
        <text x="140" y="69" textAnchor="middle"
          fontFamily="Montserrat, Arial Black, sans-serif"
          fontWeight="600" fontSize="14" fill="#ffffff" letterSpacing="10">AUTO GROUP</text>
        <text x="140" y="88" textAnchor="middle"
          fontFamily="Inter, Arial, sans-serif"
          fontWeight="500" fontSize="16" fill="#cbd5e1" letterSpacing="2">loveautogroup.net</text>
      </svg>
    </div>
  );

  if (compact) {
    /* Inventory card: logo pill only (Google Reviews shown separately via
       GoogleReviewsLockup in VehicleCard) */
    return logoPill ? (
      <div onClick={(e) => e.stopPropagation()}>{logoPill}</div>
    ) : null;
  }

  /* VDP hero: logo pill stacked above Google Reviews lockup */
  return (
    <div className="flex flex-col items-end gap-2">
      {logoPill}
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
