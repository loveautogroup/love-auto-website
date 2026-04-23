"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const CREDIT_TIERS = [
  { label: "Excellent (720+)", apr: 0.0549 },
  { label: "Good (680-719)", apr: 0.0699 },
  { label: "Fair (620-679)", apr: 0.0999 },
  { label: "Rebuilding (<620)", apr: 0.1499 },
];

const TERMS = [36, 48, 60, 72];

interface VDPPaymentCalculatorProps {
  vehiclePrice: number;
  vehicleSlug: string;
  vehicleLabel: string;
}

/**
 * Vehicle-specific interactive payment calculator displayed in the VDP
 * sidebar. Unlike the homepage calculator (which finds vehicles for a
 * monthly budget), this calculates the monthly payment for THIS vehicle's
 * price as the buyer adjusts down payment, credit tier, and term.
 *
 * Conversion mechanic: keeps shoppers on the page longer, helps them
 * visualize affordability, and exposes the financing CTA at the moment
 * of highest engagement.
 */
export default function VDPPaymentCalculator({
  vehiclePrice,
  vehicleSlug,
  vehicleLabel,
}: VDPPaymentCalculatorProps) {
  const [downPayment, setDownPayment] = useState(1000);
  const [creditTier, setCreditTier] = useState(1); // "Good" default
  const [termMonths, setTermMonths] = useState(60);

  const monthlyPayment = useMemo(() => {
    const apr = CREDIT_TIERS[creditTier].apr;
    const principal = Math.max(0, vehiclePrice - downPayment);
    if (principal === 0) return 0;
    const monthlyRate = apr / 12;
    return Math.round(
      (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
        (Math.pow(1 + monthlyRate, termMonths) - 1)
    );
  }, [vehiclePrice, downPayment, creditTier, termMonths]);

  const apr = CREDIT_TIERS[creditTier].apr;
  const financed = Math.max(0, vehiclePrice - downPayment);
  const formattedFinanced = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(financed);

  return (
    <div className="bg-brand-gray-50 rounded-xl border border-brand-gray-200 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 24 24" className="w-5 h-5 fill-brand-red" aria-hidden="true">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1.41 16.09V20h-2.67v-1.93c-1.71-.36-3.16-1.46-3.27-3.4h1.96c.1 1.05.82 1.87 2.65 1.87 1.96 0 2.4-.98 2.4-1.59 0-.83-.44-1.61-2.67-2.14-2.48-.6-4.18-1.62-4.18-3.67 0-1.72 1.39-2.84 3.11-3.21V4h2.67v1.95c1.86.45 2.79 1.86 2.85 3.39H14.3c-.05-1.11-.64-1.87-2.22-1.87-1.5 0-2.4.68-2.4 1.64 0 .84.65 1.39 2.67 1.91s4.18 1.39 4.18 3.91c-.01 1.83-1.38 2.83-3.12 3.16z" />
        </svg>
        <h3 className="text-sm font-bold text-brand-gray-900 uppercase tracking-wide">
          Estimate Your Payment
        </h3>
      </div>

      {/* Down Payment slider */}
      <div>
        <div className="flex justify-between items-baseline mb-1.5">
          <label htmlFor="vdp-down" className="text-xs font-medium text-brand-gray-700">
            Down Payment
          </label>
          <span className="text-sm font-bold text-brand-gray-900">
            ${downPayment.toLocaleString()}
          </span>
        </div>
        <input
          id="vdp-down"
          type="range"
          min={0}
          max={Math.min(vehiclePrice - 500, 10000)}
          step={250}
          value={downPayment}
          onChange={(e) => setDownPayment(Number(e.target.value))}
          className="w-full h-1.5 bg-brand-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-red"
        />
      </div>

      {/* Credit + Term row */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label htmlFor="vdp-credit" className="block text-xs font-medium text-brand-gray-700 mb-1">
            Credit
          </label>
          <select
            id="vdp-credit"
            value={creditTier}
            onChange={(e) => setCreditTier(Number(e.target.value))}
            className="w-full text-xs border border-brand-gray-200 rounded-md px-2 py-1.5 bg-white"
          >
            {CREDIT_TIERS.map((tier, i) => (
              <option key={tier.label} value={i}>
                {tier.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="vdp-term" className="block text-xs font-medium text-brand-gray-700 mb-1">
            Term
          </label>
          <select
            id="vdp-term"
            value={termMonths}
            onChange={(e) => setTermMonths(Number(e.target.value))}
            className="w-full text-xs border border-brand-gray-200 rounded-md px-2 py-1.5 bg-white"
          >
            {TERMS.map((t) => (
              <option key={t} value={t}>
                {t} months
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result */}
      <div className="bg-brand-navy text-white rounded-lg p-3 text-center">
        <p className="text-xs text-brand-gray-300 uppercase tracking-wide">
          Estimated Monthly Payment
        </p>
        <p className="text-3xl font-extrabold mt-1">
          ${monthlyPayment.toLocaleString()}
          <span className="text-sm font-medium text-brand-gray-300">/mo</span>
        </p>
        <p className="text-[10px] text-brand-gray-400 mt-1">
          {formattedFinanced} financed at {(apr * 100).toFixed(2)}% APR
        </p>
      </div>

      <Link
        href={`/financing?vehicle=${encodeURIComponent(vehicleLabel)}&down=${downPayment}&term=${termMonths}`}
        className="
          block w-full text-center
          bg-brand-red hover:bg-brand-red-dark text-white
          py-2.5 rounded-lg text-sm font-bold
          transition-colors
        "
      >
        Get Pre-Approved
      </Link>

      <p className="text-[10px] text-brand-gray-400 text-center leading-tight">
        Estimate only. Does not include tax, title, or fees. Subject to credit approval.
      </p>
    </div>
  );
}
