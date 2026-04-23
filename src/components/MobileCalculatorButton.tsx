"use client";

import { useState, useEffect } from "react";
import VDPPaymentCalculator from "./VDPPaymentCalculator";

interface MobileCalculatorButtonProps {
  vehiclePrice: number;
  vehicleSlug: string;
  vehicleLabel: string;
}

/**
 * Mobile-only sticky-bar button that opens the payment calculator in a
 * bottom-sheet modal. Lets mobile shoppers explore monthly payment scenarios
 * without leaving the VDP. On desktop the calculator already lives in the
 * sidebar and this component is hidden.
 */
export default function MobileCalculatorButton({
  vehiclePrice,
  vehicleSlug,
  vehicleLabel,
}: MobileCalculatorButtonProps) {
  const [open, setOpen] = useState(false);

  // Lock body scroll while modal is open
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="
          flex items-center justify-center gap-1.5
          flex-1 bg-brand-red text-white py-3 rounded-xl font-semibold
        "
        aria-haspopup="dialog"
        aria-expanded={open}
      >
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
          <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zM7 7h10v2H7V7zm10 12H7v-2h10v2zm0-4H7v-4h10v4z" />
        </svg>
        Calculate
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="calc-modal-heading"
        >
          {/* Backdrop */}
          <button
            type="button"
            aria-label="Close calculator"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/55"
          />

          {/* Bottom sheet */}
          <div className="relative w-full max-w-md bg-white rounded-t-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-brand-gray-100 px-4 py-3 flex items-center justify-between">
              <h2
                id="calc-modal-heading"
                className="text-base font-bold text-brand-gray-900"
              >
                Estimate Your Payment
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-brand-gray-500 hover:text-brand-gray-900 p-1 -m-1"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            </div>
            <div className="p-4">
              <VDPPaymentCalculator
                vehiclePrice={vehiclePrice}
                vehicleSlug={vehicleSlug}
                vehicleLabel={vehicleLabel}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
