"use client";

import { useState } from "react";
import Link from "next/link";
import { Vehicle } from "@/lib/types";
import { SITE_CONFIG } from "@/lib/constants";

interface VDPTabsProps {
  vehicle: Vehicle;
  formattedPrice: string;
  formattedMileage: string;
  monthlyPayment: number;
}

const TABS = ["Overview", "Features", "Vehicle History", "Financing"] as const;
type Tab = (typeof TABS)[number];

export default function VDPTabs({
  vehicle,
  formattedPrice,
  formattedMileage,
  monthlyPayment,
}: VDPTabsProps) {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  return (
    <>
      {/* Sticky Tab Bar */}
      <nav
        className="sticky top-[72px] md:top-[104px] z-30 bg-white border-b border-brand-gray-200 -mx-4 px-4"
        aria-label="Vehicle details tabs"
      >
        <div className="flex gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`whitespace-nowrap px-5 py-3.5 text-sm font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-brand-red text-brand-red"
                  : "border-transparent text-brand-gray-500 hover:text-brand-gray-900 hover:border-brand-gray-300"
              }`}
              aria-selected={activeTab === tab}
              role="tab"
            >
              {tab}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab Content */}
      <div className="mt-8" role="tabpanel">
        {activeTab === "Overview" && (
          <div className="space-y-8">
            {/* Quick Specs Row */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { icon: "⚡", label: "Engine", value: vehicle.engine },
                { icon: "⚙️", label: "Transmission", value: vehicle.transmission },
                { icon: "🔄", label: "Drivetrain", value: vehicle.drivetrain },
                { icon: "⛽", label: "Fuel", value: vehicle.fuelType },
              ].map((spec) => (
                <div key={spec.label} className="bg-brand-gray-50 rounded-xl p-4 text-center">
                  <span className="text-2xl">{spec.icon}</span>
                  <p className="text-xs text-brand-gray-500 uppercase tracking-wider mt-1">
                    {spec.label}
                  </p>
                  <p className="font-semibold text-brand-gray-900 text-sm mt-0.5">
                    {spec.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Description */}
            <section>
              <h2 className="text-xl font-bold text-brand-gray-900 mb-3">
                About This Vehicle
              </h2>
              <p className="text-brand-gray-700 leading-relaxed">
                {vehicle.description}
              </p>
            </section>

            {/* Full Specs Grid */}
            <section>
              <h2 className="text-xl font-bold text-brand-gray-900 mb-3">
                Specifications
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Mileage", value: `${formattedMileage} mi` },
                  { label: "Exterior", value: vehicle.exteriorColor },
                  { label: "Interior", value: vehicle.interiorColor },
                  { label: "Drivetrain", value: vehicle.drivetrain },
                  { label: "Transmission", value: vehicle.transmission },
                  { label: "Engine", value: vehicle.engine },
                  { label: "Body Style", value: vehicle.bodyStyle },
                  { label: "Fuel Type", value: vehicle.fuelType },
                  { label: "Stock #", value: vehicle.stockNumber },
                ].map((spec) => (
                  <div key={spec.label} className="bg-brand-gray-50 rounded-lg p-3">
                    <p className="text-xs text-brand-gray-500 uppercase tracking-wider">
                      {spec.label}
                    </p>
                    <p className="font-semibold text-brand-gray-900 mt-0.5">
                      {spec.value}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "Features" && (
          <section>
            <h2 className="text-xl font-bold text-brand-gray-900 mb-4">
              Key Features
            </h2>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {vehicle.features.map((feature) => (
                <li
                  key={feature}
                  className="flex items-center gap-3 bg-brand-gray-50 rounded-lg px-4 py-3"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5 text-brand-green shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-brand-gray-700 font-medium">{feature}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {activeTab === "Vehicle History" && (
          <section className="space-y-6">
            <div className="bg-brand-green/5 border border-brand-green/20 rounded-xl p-6">
              <h2 className="text-lg font-bold text-brand-gray-900 mb-2 flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-5 h-5 text-brand-green"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
                Our Commitment
              </h2>
              <p className="text-brand-gray-700">
                This vehicle has been fully inspected and reconditioned before
                going on the lot. We stand behind what we sell. If you have
                questions about this vehicle&apos;s history or condition, just ask.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-brand-gray-50 rounded-xl p-5 text-center">
                <div className="w-12 h-12 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-brand-gray-900 text-sm">Thoroughly Inspected</h3>
                <p className="text-xs text-brand-gray-500 mt-1">Multi-point inspection completed</p>
              </div>
              <div className="bg-brand-gray-50 rounded-xl p-5 text-center">
                <div className="w-12 h-12 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="font-bold text-brand-gray-900 text-sm">Fully Reconditioned</h3>
                <p className="text-xs text-brand-gray-500 mt-1">Serviced and road-ready</p>
              </div>
              <div className="bg-brand-gray-50 rounded-xl p-5 text-center">
                <div className="w-12 h-12 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-bold text-brand-gray-900 text-sm">Clean Title</h3>
                <p className="text-xs text-brand-gray-500 mt-1">No accidents, clean history</p>
              </div>
            </div>

            <p className="text-xs text-brand-gray-400">
              VIN: {vehicle.vin}
            </p>
          </section>
        )}

        {activeTab === "Financing" && (
          <section className="space-y-6">
            <div className="bg-brand-gray-50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-brand-gray-900 mb-4">
                Estimated Monthly Payment
              </h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-brand-red">${monthlyPayment}</span>
                <span className="text-brand-gray-500">/month</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-brand-gray-500">Vehicle Price</p>
                  <p className="font-semibold text-brand-gray-900">{formattedPrice}</p>
                </div>
                <div>
                  <p className="text-brand-gray-500">Down Payment</p>
                  <p className="font-semibold text-brand-gray-900">$1,000</p>
                </div>
                <div>
                  <p className="text-brand-gray-500">APR</p>
                  <p className="font-semibold text-brand-gray-900">6.99%</p>
                </div>
                <div>
                  <p className="text-brand-gray-500">Term</p>
                  <p className="font-semibold text-brand-gray-900">60 months</p>
                </div>
              </div>
              <p className="text-xs text-brand-gray-400 mt-3">
                *Estimated payment for illustration only. Actual terms depend on credit approval. Does not include tax, title, or fees.
              </p>
            </div>

            <Link
              href={`/financing?vehicle=${encodeURIComponent(`${vehicle.year} ${vehicle.make} ${vehicle.model}`)}`}
              className="flex items-center justify-center w-full bg-brand-red hover:bg-brand-red-dark text-white py-4 rounded-xl font-bold text-lg transition-colors"
            >
              Get Pre-Approved Now
            </Link>

            <div className="flex items-center gap-3 text-sm text-brand-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-brand-green shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Quick, easy, and won&apos;t affect your credit. We work with multiple lenders.
            </div>
          </section>
        )}
      </div>
    </>
  );
}
