"use client";

/**
 * VDP-side "Ask about this {vehicle}" button. Opens InquiryModal with
 * vehicleInterest and vehicleVin pre-filled.
 */

import { useState } from "react";
import InquiryModal from "@/components/InquiryModal";

interface Props {
  vehicleLabel: string; // e.g. "2017 Subaru Forester 2.5i Premium"
  vehicleVin: string;
  className?: string;
}

export default function VDPInquireButton({
  vehicleLabel,
  vehicleVin,
  className = "",
}: Props) {
  const [open, setOpen] = useState(false);
  // Truncate label so the button stays readable on mobile.
  const shortLabel = vehicleLabel.split(" ").slice(0, 3).join(" ");
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          "rounded-lg bg-brand-navy text-white font-semibold px-5 py-3 hover:opacity-90 transition-opacity flex items-center justify-center gap-2 " +
          className
        }
      >
        <svg
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={2}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
        Ask about this {shortLabel}
      </button>

      <InquiryModal
        open={open}
        onClose={() => setOpen(false)}
        source="website-vdp"
        title={`Ask about the ${vehicleLabel}`}
        subtitle="We'll get back to you within an hour during business hours."
        initialVehicleInterest={vehicleLabel}
        vehicleVin={vehicleVin}
      />
    </>
  );
}
