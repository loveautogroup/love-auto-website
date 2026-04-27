"use client";

/**
 * CARFAX Free Report badge.
 *
 * Uses the official Carfax solid-monochrome logo (from Jeremiah's Carfax
 * Advantage Dealer portal) paired with a "Free Report" label bar underneath.
 * Preserves Carfax brand integrity — no recreation, no approximation, no
 * tinting of the brand colors. Solid white wrapper + black "FREE REPORT"
 * bar are the official brand-compliant lockup.
 *
 * Top-left slot on vehicle photos. Live link — opens the Carfax report
 * for the VIN in a new tab when tapped. Client component because of the
 * stopPropagation onClick handler (needed so the Carfax click on a card
 * doesn't also navigate to the VDP).
 */

import Image from "next/image";

interface CarfaxBadgeProps {
  vin: string;
}

export default function CarfaxBadge({ vin }: CarfaxBadgeProps) {
  const reportUrl = `https://www.carfax.com/VehicleHistory/p/Report.cfx?partner=DVW_1&vin=${vin}`;

  return (
    <a
      href={reportUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="
        inline-flex flex-col items-stretch
        w-[140px] rounded-md overflow-hidden
        bg-white border-2 border-[#1A1919]
        shadow-[0_3px_6px_rgba(0,0,0,0.35)]
        transition-all duration-150
        hover:scale-[1.05] hover:shadow-[0_5px_10px_rgba(0,0,0,0.45)]
        active:scale-100
        focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white
      "
      aria-label="View free Carfax report for this vehicle"
    >
      <Image
        src="/brand/carfax-logo.svg"
        alt="Carfax"
        width={170}
        height={32}
        className="w-full h-auto px-0.5 pt-1 pb-0.5"
        unoptimized
      />
      <span
        className="
          bg-[#1A1919] text-white text-center uppercase
          text-[12px] font-black tracking-[0.12em] py-[6px]
        "
      >
        Free Report
      </span>
    </a>
  );
}
