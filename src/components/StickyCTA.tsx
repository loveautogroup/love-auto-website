"use client";

/**
 * Floating "Get a quote" button on every page. Opens an InquiryModal with
 * the LeadForm. Hidden on /contact (don't double up with the page form)
 * and admin routes. Positioned above the existing TextUsButton on desktop.
 */

import { useState } from "react";
import { usePathname } from "next/navigation";
import InquiryModal from "@/components/InquiryModal";

const HIDDEN_PATHS = ["/contact", "/admin"];

export default function StickyCTA() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  if (HIDDEN_PATHS.some((p) => pathname?.startsWith(p))) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 rounded-full bg-brand-red text-white font-semibold px-5 py-3 shadow-xl hover:bg-brand-red-dark transition-all flex items-center gap-2 sm:bottom-6 lg:bottom-24"
        aria-label="Get a quote"
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
        <span className="hidden sm:inline">Get a quote</span>
      </button>

      <InquiryModal
        open={open}
        onClose={() => setOpen(false)}
        source="website-sticky-cta"
        title="Get a quote"
        subtitle="We'll reach out within an hour during business hours."
      />
    </>
  );
}
