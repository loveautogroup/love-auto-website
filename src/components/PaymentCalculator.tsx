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

export default function PaymentCalculator() {
  const [monthlyBudget, setMonthlyBudget] = useState(250);
  const [creditTier, setCreditTier] = useState(1); // "Good" default
  const [downPayment, setDownPayment] = useState(1000);
  const [termMonths, setTermMonths] = useState(60);

  const estimatedPrice = useMemo(() => {
    const apr = CREDIT_TIERS[creditTier].apr;
    const monthlyRate = apr / 12;
    if (monthlyRate === 0) return monthlyBudget * termMonths + downPayment;
    const principal =
      (monthlyBudget * (Math.pow(1 + monthlyRate, termMonths) - 1)) /
      (monthlyRate * Math.pow(1 + monthlyRate, termMonths));
    return Math.round(principal + downPayment);
  }, [monthlyBudget, creditTier, downPayment, termMonths]);

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(estimatedPrice);

  return (
    <section className="bg-ink-100 py-16" aria-labelledby="calc-heading">
      <div className="max-w-5xl mx-auto px-4">
        <div className="bg-white border border-ink-200 overflow-hidden">
          <div className="md:grid md:grid-cols-[1fr_300px]">
            {/* Calculator inputs */}
            <div className="p-6 md:p-8">
              <h2
                id="calc-heading"
                className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-1"
              >
                See cars that fit your budget
              </h2>
              <p className="text-brand-gray-500 text-sm mb-6">
                Adjust the sliders to find vehicles in your price range
              </p>

              <div className="space-y-6">
                {/* Monthly Payment */}
                <div>
                  <div className="flex justify-between items-baseline mb-2">
                    <label
                      htmlFor="monthly-payment"
                      className="text-sm font-medium text-brand-gray-700"
                    >
                      Monthly Payment
                    </label>
                    <span className="text-lg font-bold text-brand-gray-900">
                      ${monthlyBudget}
                    </span>
                  </div>
                  <input
                    id="monthly-payment"
                    type="range"
                    min={100}
                    max={500}
                    step={25}
                    value={monthlyBudget}
                    onChange={(e) => setMonthlyBudget(Number(e.target.value))}
                    className="w-full h-1.5 bg-brand-gray-200 appearance-none cursor-pointer accent-brand-red"
                  />
                  <div className="flex justify-between text-xs text-brand-gray-400 mt-1">
                    <span>$100</span>
                    <span>$500</span>
                  </div>
                </div>

                {/* Credit Score */}
                <div>
                  <label
                    htmlFor="credit-score"
                    className="block text-sm font-medium text-brand-gray-700 mb-2"
                  >
                    Credit Score
                  </label>
                  <select
                    id="credit-score"
                    value={creditTier}
                    onChange={(e) => setCreditTier(Number(e.target.value))}
                    className="w-full border border-ink-200 px-3 py-2.5 text-brand-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red"
                  >
                    {CREDIT_TIERS.map((tier, i) => (
                      <option key={tier.label} value={i}>
                        {tier.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Down Payment + Term */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="down-payment"
                      className="block text-sm font-medium text-brand-gray-700 mb-2"
                    >
                      Down Payment
                    </label>
                    <select
                      id="down-payment"
                      value={downPayment}
                      onChange={(e) => setDownPayment(Number(e.target.value))}
                      className="w-full border border-ink-200 px-3 py-2.5 text-brand-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red"
                    >
                      <option value={0}>$0</option>
                      <option value={500}>$500</option>
                      <option value={1000}>$1,000</option>
                      <option value={2000}>$2,000</option>
                      <option value={3000}>$3,000</option>
                      <option value={5000}>$5,000</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="term-length"
                      className="block text-sm font-medium text-brand-gray-700 mb-2"
                    >
                      Term Length
                    </label>
                    <select
                      id="term-length"
                      value={termMonths}
                      onChange={(e) => setTermMonths(Number(e.target.value))}
                      className="w-full border border-ink-200 px-3 py-2.5 text-brand-gray-900 focus:outline-none focus:ring-1 focus:ring-brand-red focus:border-brand-red"
                    >
                      {TERMS.map((t) => (
                        <option key={t} value={t}>
                          {t} months
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Result panel */}
            <div className="bg-brand-navy text-white p-6 md:p-8 flex flex-col items-center justify-center text-center border-t-2 md:border-t-0 md:border-l-2 border-brand-red">
              <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-ink-300 mb-1">
                Est. vehicle price
              </p>
              <p className="font-heading font-extrabold text-4xl md:text-5xl mb-2">
                {formattedPrice}
              </p>
              <p className="text-xs text-ink-400 mb-6">
                at {(CREDIT_TIERS[creditTier].apr * 100).toFixed(2)}% APR
              </p>
              <Link
                href={`/inventory?maxPrice=${estimatedPrice}`}
                className="w-full bg-brand-red hover:bg-brand-red-dark text-white py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em] transition-colors text-center block"
              >
                Browse Vehicles
              </Link>
              <p className="text-xs text-ink-400 mt-4">
                Estimate only. Does not include tax, title, or fees. Subject to
                credit approval.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
