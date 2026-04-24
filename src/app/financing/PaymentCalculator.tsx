"use client";

/**
 * Payment Calculator — standalone widget for the /financing hero.
 *
 * Customer enters Vehicle Price, Down Payment, Loan Term, APR → shows
 * an estimated monthly payment. Pure client-side math (standard
 * amortization formula), no API calls, no data collection.
 *
 * Maxim's version is reference — same layout + same labels + same
 * disclaimer ("estimate only"). If someone likes the number and wants
 * real terms, they scroll down to the application form.
 */

import { useMemo, useState } from "react";

function money(v: number): string {
  if (!Number.isFinite(v) || v < 0) return "—";
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });
}

function estimateMonthlyPayment(
  price: number,
  down: number,
  months: number,
  aprPct: number
): number | null {
  const principal = price - down;
  if (!Number.isFinite(principal) || principal <= 0 || months <= 0) return null;
  if (!Number.isFinite(aprPct) || aprPct < 0 || aprPct > 40) return null;
  const monthlyRate = aprPct / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  // Standard amortization
  const factor = Math.pow(1 + monthlyRate, months);
  return (principal * monthlyRate * factor) / (factor - 1);
}

export default function PaymentCalculator() {
  const [price, setPrice] = useState(12000);
  const [down, setDown] = useState(0);
  const [months, setMonths] = useState(60);
  const [apr, setApr] = useState(9.9);

  const monthly = useMemo(
    () => estimateMonthlyPayment(price, down, months, apr),
    [price, down, months, apr]
  );
  const totalInterest = useMemo(() => {
    if (monthly === null) return null;
    return monthly * months - (price - down);
  }, [monthly, months, price, down]);

  return (
    <section
      className="bg-white rounded-2xl border border-brand-gray-200 p-6 md:p-8 shadow-sm"
      aria-labelledby="calc-heading"
    >
      <h2
        id="calc-heading"
        className="text-2xl font-bold text-brand-gray-900 mb-1"
      >
        Payment Calculator
      </h2>
      <p className="text-sm text-brand-gray-500 mb-6">
        Adjust the numbers to see your estimated monthly payment.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <Field label="Vehicle Price" id="calc-price">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray-500">$</span>
              <input
                id="calc-price"
                type="number"
                inputMode="numeric"
                min={0}
                step={100}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-2 border border-brand-gray-200 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none"
              />
            </div>
          </Field>

          <Field label="Down Payment" id="calc-down">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray-500">$</span>
              <input
                id="calc-down"
                type="number"
                inputMode="numeric"
                min={0}
                step={100}
                value={down}
                onChange={(e) => setDown(Number(e.target.value) || 0)}
                className="w-full pl-7 pr-3 py-2 border border-brand-gray-200 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none"
              />
            </div>
          </Field>

          <Field label="Loan Term" id="calc-term">
            <select
              id="calc-term"
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="w-full px-3 py-2 border border-brand-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none"
            >
              <option value={24}>24 months (2 years)</option>
              <option value={36}>36 months (3 years)</option>
              <option value={48}>48 months (4 years)</option>
              <option value={60}>60 months (5 years)</option>
              <option value={72}>72 months (6 years)</option>
              <option value={84}>84 months (7 years)</option>
            </select>
          </Field>

          <Field label="Est. APR" id="calc-apr">
            <div className="relative">
              <input
                id="calc-apr"
                type="number"
                inputMode="decimal"
                min={0}
                max={40}
                step={0.1}
                value={apr}
                onChange={(e) => setApr(Number(e.target.value) || 0)}
                className="w-full pl-3 pr-8 py-2 border border-brand-gray-200 rounded-lg focus:ring-2 focus:ring-brand-red focus:border-transparent outline-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-gray-500">%</span>
            </div>
            <p className="text-xs text-brand-gray-400 mt-1">
              Rates depend on your credit profile — apply below for your real rate.
            </p>
          </Field>
        </div>

        <div className="bg-brand-navy text-white rounded-xl p-6 flex flex-col justify-center">
          <p className="text-sm text-brand-gray-300 uppercase tracking-wide font-semibold">
            Estimated Monthly Payment
          </p>
          <p className="mt-1 text-5xl font-bold tabular-nums">
            {monthly !== null ? money(monthly) : "—"}
          </p>
          <p className="mt-1 text-xs text-brand-gray-300">per month</p>

          <div className="mt-6 pt-6 border-t border-white/10 text-sm space-y-2 text-brand-gray-300">
            <div className="flex justify-between">
              <span>Amount financed</span>
              <span className="tabular-nums text-white">
                {money(Math.max(0, price - down))}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Loan term</span>
              <span className="tabular-nums text-white">{months} months</span>
            </div>
            <div className="flex justify-between">
              <span>Total interest</span>
              <span className="tabular-nums text-white">
                {totalInterest !== null ? money(totalInterest) : "—"}
              </span>
            </div>
          </div>

          <a
            href="#apply"
            className="mt-6 inline-flex items-center justify-center bg-brand-red hover:bg-brand-red-dark text-white font-semibold px-5 py-3 rounded-lg transition-colors"
          >
            Get my real rate →
          </a>
        </div>
      </div>

      <p className="mt-6 text-xs text-brand-gray-400 leading-relaxed">
        This calculator is an estimate only. Your actual monthly payment depends on
        your credit profile, the lender&apos;s offer, trade-in value, taxes, fees,
        and other variables. Apply below for a real offer — no impact to your
        credit score to inquire.
      </p>
    </section>
  );
}

function Field({
  label,
  id,
  children,
}: {
  label: string;
  id: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-semibold text-brand-gray-700 mb-1"
      >
        {label}
      </label>
      {children}
    </div>
  );
}
