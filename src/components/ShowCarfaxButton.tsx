"use client";

/**
 * Show Carfax button — explicit, labeled CTA for the vehicle's Carfax
 * report. Sits in the VDP sidebar and mobile title area because buyers
 * don't realize the small CARFAX badge on the photo is clickable. This
 * one spells it out.
 *
 * Opens the partner-branded Carfax report in a new tab. Same URL
 * pattern as CarfaxBadge.tsx on the photo overlay.
 */

import Image from "next/image";

interface ShowCarfaxButtonProps {
  vin: string;
  /** Variant — wide (sidebar/hero) or narrow (inline/mobile). */
  variant?: "wide" | "inline";
}

export default function ShowCarfaxButton({ vin, variant = "wide" }: ShowCarfaxButtonProps) {
  const reportUrl = `https://www.carfax.com/VehicleHistory/p/Report.cfx?partner=DVW_1&vin=${vin}`;

  if (variant === "inline") {
    return (
      <a
        href={reportUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="
          inline-flex items-center gap-2
          bg-white border-2 border-[#1A1919] rounded-lg
          px-3 py-2 text-[#1A1919]
          hover:bg-brand-gray-50 hover:shadow-md
          transition-all text-sm font-bold
        "
        aria-label={`Show free Carfax report for VIN ${vin}`}
      >
        <Image
          src="/brand/carfax-logo.svg"
          alt="Carfax"
          width={68}
          height={14}
          className="h-3.5 w-auto"
          unoptimized
        />
        <span>Show Me the Carfax →</span>
      </a>
    );
  }

  return (
    <a
      href={reportUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="
        flex flex-col items-center gap-2
        bg-white border-2 border-[#1A1919] rounded-xl
        p-4 text-[#1A1919]
        hover:border-brand-red hover:shadow-lg hover:-translate-y-0.5
        transition-all
      "
      aria-label={`Show free Carfax report for VIN ${vin}`}
    >
      <Image
        src="/brand/carfax-logo.svg"
        alt="Carfax"
        width={140}
        height={28}
        className="h-7 w-auto"
        unoptimized
      />
      <div className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wide">
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
          <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4zm-1 14l-4-4 1.4-1.4L11 13.2l5.6-5.6L18 9l-7 7z" />
        </svg>
        <span>Show Me the Carfax</span>
      </div>
      <p className="text-[11px] text-brand-gray-500 text-center leading-tight">
        Free vehicle history report · Opens in a new tab
      </p>
    </a>
  );
}
