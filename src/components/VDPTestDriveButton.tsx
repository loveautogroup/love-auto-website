"use client";

/**
 * VDPTestDriveButton - "Schedule a Test Drive" CTA on the vehicle detail page.
 *
 * Opens InquiryModal (reused chrome) hosting TestDriveForm. Deliberately
 * styled as an outlined button so it reads clearly without outranking the
 * primary contact CTA (the solid green "Call" button) directly above it.
 *
 * LEAD-ONLY (Jeremiah, 2026-08-03): this books nothing. It captures a
 * requested day + time window as a lead; Jeremiah calls back to confirm.
 */

import { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import InquiryModal from "@/components/InquiryModal";
import TestDriveForm from "@/components/TestDriveForm";

interface Props {
  vehicleLabel: string; // "2015 Lexus RC 350 F Sport"
  vehicleVin: string;
  stockNumber?: string;
  make?: string;
  model?: string;
  className?: string;
}

export default function VDPTestDriveButton({
  vehicleLabel,
  vehicleVin,
  stockNumber,
  make,
  model,
  className = "",
}: Props) {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          "rounded-lg border-2 border-brand-gray-300 bg-white text-brand-gray-900 font-semibold px-5 py-3 hover:border-brand-red hover:text-brand-red transition-colors flex items-center justify-center gap-2 " +
          className
        }
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        {t.testDrive.cta}
      </button>

      <InquiryModal
        open={open}
        onClose={() => setOpen(false)}
        title={t.testDrive.title}
        subtitle={t.testDrive.subtitle}
      >
        <TestDriveForm
          vehicleLabel={vehicleLabel}
          vehicleVin={vehicleVin}
          stockNumber={stockNumber}
          make={make}
          model={model}
          onSuccess={() => setTimeout(() => setOpen(false), 5000)}
        />
      </InquiryModal>
    </>
  );
}
