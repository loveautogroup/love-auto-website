"use client";

import { useState } from "react";
import Link from "next/link";
import { Vehicle } from "@/lib/types";
import { SITE_CONFIG } from "@/lib/constants";
import VDPFeaturesGrouped from "./VDPFeaturesGrouped";
import { useLanguage } from "@/context/LanguageContext";

interface VDPTabsProps {
  vehicle: Vehicle;
  formattedPrice: string;
  formattedMileage: string;
  monthlyPayment: number;
}

const ALL_TABS = ["Overview", "Features", "Vehicle History", "Financing"] as const;
type Tab = (typeof ALL_TABS)[number];

export default function VDPTabs({
  vehicle,
  formattedPrice,
  formattedMileage,
  monthlyPayment,
}: VDPTabsProps) {
  const { t } = useLanguage();
  // Jeremiah, 2026-09-15: a sold car's price is never republished, and the
  // Financing tab is nothing BUT a payment calculator + "Get Pre-Approved"
  // apply link for buying this specific car — both wrong once it's sold, so
  // the whole tab drops rather than showing a $0/mo calculator.
  const isSold = vehicle.status === "sold";
  const TABS: readonly Tab[] = isSold
    ? ALL_TABS.filter((tab) => tab !== "Financing")
    : ALL_TABS;
  const [activeTab, setActiveTab] = useState<Tab>("Overview");

  const tabLabels: Record<Tab, string> = {
    Overview: t.vdpTabs.tabOverview,
    Features: t.vdpTabs.tabFeatures,
    "Vehicle History": t.vdpTabs.tabHistory,
    Financing: t.vdpTabs.tabFinancing,
  };

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
              className={`whitespace-nowrap px-5 py-3.5 text-[12px] font-bold uppercase tracking-[0.07em] border-b-2 transition-colors ${
                activeTab === tab
                  ? "border-brand-red text-brand-red"
                  : "border-transparent text-brand-gray-500 hover:text-brand-gray-900 hover:border-brand-gray-300"
              }`}
              aria-selected={activeTab === tab}
              role="tab"
            >
              {tabLabels[tab]}
            </button>
          ))}
        </div>
      </nav>

      {/* Tab Content */}
      <div className="mt-8" role="tabpanel">
        {activeTab === "Overview" && (
          <div className="space-y-8">
            {/* 🔴 BRANDED TITLE, DISCLOSED ABOVE EVERYTHING ELSE.
                Owner, 2026-09-09: "The title status on the vehicles vdp should
                say rebuilt because ive already changed it in the workspace."
                He assumed it already did; the field reached the website
                nowhere at all, so a Rebuilt car was advertised with no
                disclosure on its own page.
                Deliberately NOT a row in the spec table — a brand is not a
                spec, it is the single most important fact about the car, and
                burying it beside the fuel type is how a disclosure becomes
                technically-present and practically invisible. */}
            {vehicle.titleBrand ? (
              <div className="border-2 border-amber-400 bg-amber-50 p-4">
                <p className="text-sm font-bold uppercase tracking-wide text-amber-900">
                  {vehicle.titleBrand} title
                </p>
                <p className="mt-1 text-sm text-amber-900/90">
                  This vehicle carries a {vehicle.titleBrand.toLowerCase()} title. Ask us about
                  it — we are happy to walk you through the history before you buy.
                </p>
              </div>
            ) : null}

            {/* Description — only render when there is real copy, so a
                vehicle with no description never shows an empty heading. */}
            {vehicle.description?.trim() ? (
              <section>
                <h2 className="text-xl font-bold text-brand-gray-900 mb-3">
                  {t.vdpTabs.aboutHeading}
                </h2>
                <p className="text-brand-gray-700 leading-relaxed">
                  {vehicle.description}
                </p>
              </section>
            ) : null}

            {/* Full spec sheet -- a real two-column hairline table (was a
                grid of shadowed pill cards; redesign 2026-09). */}
            <section>
              <h2 className="font-heading font-bold text-brand-gray-900 text-xl mb-4">
                {t.vdpTabs.specsHeading}
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 border-t border-ink-200">
                {[
                  { label: t.vdpTabs.mileage, value: `${formattedMileage} ${t.vdpTabs.mi}` },
                  { label: t.vdpTabs.exterior, value: vehicle.exteriorColor },
                  { label: t.vdpTabs.interior, value: vehicle.interiorColor },
                  { label: t.vdpTabs.drivetrain, value: vehicle.drivetrain },
                  { label: t.vdpTabs.transmission, value: vehicle.transmission },
                  { label: t.vdpTabs.engine, value: vehicle.engine },
                  { label: t.vdpTabs.bodyStyle, value: vehicle.bodyStyle },
                  { label: t.vdpTabs.fuelType, value: vehicle.fuelType },
                  { label: t.vdpTabs.stockNumber, value: vehicle.stockNumber },
                ].map((spec) => (
                  <div
                    key={spec.label}
                    className="flex items-baseline justify-between gap-4 border-b border-ink-200 py-3 sm:odd:border-r sm:odd:pr-4 sm:even:pl-4"
                  >
                    <dt className="text-[11px] font-bold uppercase tracking-[0.1em] text-brand-gray-500">
                      {spec.label}
                    </dt>
                    <dd className="font-semibold text-brand-gray-900 text-right tabular-nums">
                      {spec.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>
          </div>
        )}

        {activeTab === "Features" && (
          <section>
            <VDPFeaturesGrouped features={vehicle.features} />
          </section>
        )}

        {activeTab === "Vehicle History" && (
          <section className="space-y-6">
            <div className="bg-brand-green/5 border-l-[3px] border-brand-green p-6">
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
                {t.vdpTabs.commitmentHeading}
              </h2>
              <p className="text-brand-gray-700">
                {t.vdpTabs.commitmentBody}
              </p>
            </div>

            {/* Clean Title card is a title-status claim, so it only renders
                when the DMS feed's titleBrand is empty (a branded title, e.g.
                Rebuilt/Salvage, sets titleBrand. See the amber disclosure
                above). Grid adapts to 2 or 3 columns so a branded-title car
                never shows an empty slot (owner, 2026-09-26). */}
            <div className={`grid grid-cols-1 gap-4 ${vehicle.titleBrand ? "sm:grid-cols-2" : "sm:grid-cols-3"}`}>
              <div className="bg-ink-100 p-5 text-center">
                <div className="w-11 h-11 bg-brand-green/10 flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-bold text-brand-gray-900 text-sm">{t.vdpTabs.inspectedTitle}</h3>
                <p className="text-xs text-brand-gray-500 mt-1">{t.vdpTabs.inspectedSub}</p>
              </div>
              <div className="bg-ink-100 p-5 text-center">
                <div className="w-11 h-11 bg-brand-green/10 flex items-center justify-center mx-auto mb-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <h3 className="font-bold text-brand-gray-900 text-sm">{t.vdpTabs.reconditionedTitle}</h3>
                <p className="text-xs text-brand-gray-500 mt-1">{t.vdpTabs.reconditionedSub}</p>
              </div>
              {!vehicle.titleBrand && (
                <div className="bg-ink-100 p-5 text-center">
                  <div className="w-11 h-11 bg-brand-green/10 flex items-center justify-center mx-auto mb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-brand-green" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h3 className="font-bold text-brand-gray-900 text-sm">{t.vdpTabs.cleanTitleTitle}</h3>
                  <p className="text-xs text-brand-gray-500 mt-1">{t.vdpTabs.cleanTitleSub}</p>
                </div>
              )}
            </div>

            <p className="text-xs text-brand-gray-400">
              {t.vdpTabs.vin}: {vehicle.vin}
            </p>
          </section>
        )}

        {activeTab === "Financing" && !isSold && (
          <section className="space-y-6">
            <div className="bg-ink-100 p-6">
              <h2 className="text-xl font-bold text-brand-gray-900 mb-4">
                {t.vdpTabs.financingHeading}
              </h2>
              <div className="flex items-baseline gap-2 mb-4">
                <span className="text-4xl font-bold text-brand-red">${monthlyPayment}</span>
                <span className="text-brand-gray-500">{t.vdpTabs.perMonth}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-brand-gray-500">{t.vdpTabs.vehiclePrice}</p>
                  <p className="font-semibold text-brand-gray-900">{formattedPrice}</p>
                </div>
                <div>
                  <p className="text-brand-gray-500">{t.vdpTabs.downPayment}</p>
                  <p className="font-semibold text-brand-gray-900">$1,000</p>
                </div>
                <div>
                  <p className="text-brand-gray-500">{t.vdpTabs.apr}</p>
                  <p className="font-semibold text-brand-gray-900">6.99%</p>
                </div>
                <div>
                  <p className="text-brand-gray-500">{t.vdpTabs.term}</p>
                  <p className="font-semibold text-brand-gray-900">60 {t.vdpTabs.months}</p>
                </div>
              </div>
              <p className="text-xs text-brand-gray-400 mt-3">
                {t.vdpTabs.financeDisclaimer}
              </p>
            </div>

            <Link
              // The VIN and stock number travel with the apply link. Without
              // them the credit application reaches the DMS carrying only the
              // display label the customer saw, so the lender document printed
              // no VIN -- measured 2026-08-27: zero of the 8 applications on
              // file had one, even though every applicant had clicked through
              // from a specific car's page.
              href={`/financing?vehicle=${encodeURIComponent(`${vehicle.year} ${vehicle.make} ${vehicle.model}`)}&vin=${encodeURIComponent(vehicle.vin ?? "")}&stock=${encodeURIComponent(vehicle.stockNumber ?? "")}&price=${vehicle.price ?? ""}`}
              className="flex items-center justify-center w-full bg-brand-red hover:bg-brand-red-dark text-white py-4 text-[13px] font-bold uppercase tracking-[0.07em] transition-colors"
            >
              {t.vdpTabs.getPreApprovedNow}
            </Link>

            <div className="flex items-center gap-3 text-sm text-brand-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-brand-green shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              {t.vdpTabs.quickEasyNote}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
