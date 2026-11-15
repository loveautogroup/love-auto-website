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
import { trackOutboundClick } from "@/lib/analytics";
import { useLanguage } from "@/context/LanguageContext";

interface ShowCarfaxButtonProps {
  vin: string;
  /** Variant — wide (sidebar/hero) or narrow (inline/mobile). */
  variant?: "wide" | "inline";
  /** CARFAX's own value rating for this car (Valet reads it daily off
   *  CARFAX Online). Absent = no rating, plain button. */
  value?: "great" | "good" | "fair";
}

/** Strip colours per CARFAX band: green, lighter green, gray. */
const VALUE_STYLE: Record<"great" | "good" | "fair", string> = {
  great: "bg-[#1F7A3A] text-white",
  good: "bg-[#5E9E2F] text-white",
  fair: "bg-brand-gray-200 text-[#1A1919]",
};

export default function ShowCarfaxButton({ vin, variant = "wide", value }: ShowCarfaxButtonProps) {
  const { t } = useLanguage();
  const reportUrl = `https://www.carfax.com/VehicleHistory/p/Report.cfx?partner=DVW_1&vin=${vin}`;
  const valueLabel = value ? t.carfaxButton.value[value] : null;
  const ariaLabel = t.carfaxButton.ariaLabel.replace("{vin}", vin) + (valueLabel ? ` · CARFAX ${valueLabel}` : "");
  const strip = valueLabel ? (
    <span className={`block text-center text-[11px] font-extrabold uppercase tracking-wide px-2 py-0.5 ${VALUE_STYLE[value!]}`}>
      {valueLabel}
    </span>
  ) : null;

  if (variant === "inline") {
    return (
      <a
        href={reportUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => trackOutboundClick(reportUrl, "carfax_report_inline")}
        className="
          inline-flex flex-col
          bg-white border-2 border-[#1A1919]
          text-[#1A1919]
          hover:bg-brand-gray-50 hover:shadow-md
          transition-all text-sm font-bold
        "
        aria-label={ariaLabel}
      >
        <span className="inline-flex items-center gap-2 px-3 py-2">
          <Image
            src="/brand/carfax-logo.svg"
            alt="Carfax"
            width={68}
            height={14}
            className="h-3.5 w-auto"
            unoptimized
          />
          <span>{t.carfaxButton.showMeArrow}</span>
        </span>
        {strip}
      </a>
    );
  }

  return (
    <a
      href={reportUrl}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackOutboundClick(reportUrl, "carfax_report_vdp")}
      className="
        flex flex-col items-center gap-2
        bg-white border-2 border-[#1A1919]
        p-4 text-[#1A1919]
        hover:border-brand-red hover:shadow-lg hover:-translate-y-0.5
        transition-all
      "
      aria-label={ariaLabel}
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
        <span>{t.carfaxButton.showMe}</span>
      </div>
      {strip && <span className="self-stretch">{strip}</span>}
      <p className="text-[11px] text-brand-gray-500 text-center leading-tight">
        {t.carfaxButton.freeReportNote}
      </p>
    </a>
  );
}
