/**
 * Carfax Advantage Dealer trust badge.
 *
 * Carfax-issued accreditation mark — Love Auto Group qualifies as an
 * Advantage Dealer in Carfax's program (free Carfax reports on every
 * inventory vehicle, ongoing reporting compliance, etc.). It's a real
 * differentiator vs. most local indie used-car dealers, so we surface
 * it in three high-trust spots: the homepage hero trust strip, the
 * "Why Buy" Difference section, and the footer.
 *
 * Renders as a link to the Carfax dealer-locator listing for our store
 * so shoppers can verify the accreditation independently — same trust
 * pattern as the live Google review badge (shoppers can read the actual
 * reviews, not just see a star count we wrote).
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
    <a
      href="https://www.carfax.com/Dealer-Inventory_loveautogroup-Villa-Park-IL_4l8r5"
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
