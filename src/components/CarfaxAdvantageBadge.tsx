"use client";

/**
 * Carfax Advantage Dealer trust badge — live link to the real Carfax
 * dealer-profile page.
 *
 * Carfax-issued accreditation. Clicking any badge opens Love Auto
 * Group's verified Carfax Reviews / About Us page in a new tab so
 * shoppers can confirm the accreditation independently. Same "verify
 * it yourself" trust pattern as the Google review badge.
 *
 * Placements: desktop header banner, homepage hero trust strip, "Why
 * Buy" Difference section, footer, and the /free-carfax-villa-park
 * landing page.
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

// Official Carfax dealer-profile URL for Love Auto Group Inc. Sourced from
// Carfax's public dealer directory (not portal-gated) so shoppers can
// verify the Advantage Dealer accreditation independently.
const CARFAX_DEALER_URL =
  "https://www.carfax.com/Reviews-Love-Auto-Group-Inc-Villa-Park-IL_QQHUM61BVE";

export default function CarfaxAdvantageBadge({
  size = "md",
  className = "",
}: CarfaxAdvantageBadgeProps) {
  const px = SIZE_PX[size];

  return (
    <a
      href={CARFAX_DEALER_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Love Auto Group is a Carfax Advantage Dealer — verify on Carfax"
      className={`
        inline-flex items-center justify-center
        transition-transform duration-150 hover:scale-[1.04] active:scale-100
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-red
        ${className}
      `}
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
    </a>
  );
}
