/**
 * Carfax Advantage Dealer trust badge.
 *
 * Carfax-issued accreditation mark — Love Auto Group qualifies as an
 * Advantage Dealer in Carfax's program (free Carfax reports on every
 * inventory vehicle, ongoing reporting compliance, etc.). It's a real
 * differentiator vs. most local indie used-car dealers, so we surface
 * it in multiple high-trust spots: the desktop header banner, the
 * homepage hero trust strip, the "Why Buy" Difference section, and
 * the footer.
 *
 * Currently rendered as a static graphic (non-clickable). When we have
 * the real Carfax dealer-locator URL for our store, wrap the <Image> in
 * an <a target="_blank"> and add hover/active scale + focus-visible
 * outline back — the previous live-link version 404'd because the URL
 * was a placeholder. Tracking the URL in SITE_CONFIG once obtained.
 */

import Image from "next/image";

interface CarfaxAdvantageBadgeProps {
  /** Display size variant. xs=banner, sm=footer, md=hero trust strip, lg=accreditations row. */
  size?: "xs" | "sm" | "md" | "lg";
  /** Optional className passthrough for layout-level positioning. */
  className?: string;
}

const SIZE_PX: Record<NonNullable<CarfaxAdvantageBadgeProps["size"]>, number> = {
  xs: 36,
  sm: 64,
  md: 96,
  lg: 140,
};

export default function CarfaxAdvantageBadge({
  size = "md",
  className = "",
}: CarfaxAdvantageBadgeProps) {
  const px = SIZE_PX[size];

  return (
    <span
      role="img"
      aria-label="Love Auto Group is a Carfax Advantage Dealer"
      className={`inline-flex items-center justify-center ${className}`}
    >
      <Image
        src="/brand/carfax-advantage-dealer.png"
        alt="CARFAX Advantage Dealer"
        width={px}
        // 714 × 525 native aspect ≈ 1.36; height = width / 1.36 (rounded).
        height={Math.round(px / (714 / 525))}
        className="h-auto w-auto"
        style={{ width: px }}
        unoptimized
      />
    </span>
  );
}
