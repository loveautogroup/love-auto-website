"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const MAKES = ["Subaru", "Lexus", "Acura", "Mazda", "Honda", "Toyota"];
const BODY_STYLES = ["SUV", "Sedan", "Wagon", "Truck", "Coupe"];

const PRICE_TABS = [
  { label: "All Vehicles",  href: "/inventory",                              minPrice: null,  maxPrice: null  },
  { label: "Under $5K",     href: "/inventory?maxPrice=5000",                minPrice: null,  maxPrice: 5000  },
  { label: "$5K – $10K",    href: "/inventory?minPrice=5000&maxPrice=10000", minPrice: 5000,  maxPrice: 10000 },
  { label: "$10K – $20K",   href: "/inventory?minPrice=10000&maxPrice=20000",minPrice: 10000, maxPrice: 20000 },
  { label: "$20K+",         href: "/inventory?minPrice=20000",               minPrice: 20000, maxPrice: null  },
];

/**
 * Inventory filters — submits as a plain HTML form to /inventory which
 * re-renders the filtered grid client-side via useSearchParams. Works
 * without JavaScript (form GET submission) and means filtered URLs are
 * shareable + indexable.
 */
function InventoryFiltersInner() {
  const searchParams = useSearchParams();
  const current = {
    make: searchParams.get("make") ?? "",
    bodyStyle: searchParams.get("bodyStyle") ?? "",
    minPrice: searchParams.get("minPrice") ?? "",
    maxPrice: searchParams.get("maxPrice") ?? "",
    maxMileage: searchParams.get("maxMileage") ?? "",
    minYear: searchParams.get("minYear") ?? "",
    maxYear: searchParams.get("maxYear") ?? "",
    drivetrain: searchParams.get("drivetrain") ?? "",
    q: searchParams.get("q") ?? "",
  };
  const [mobileOpen, setMobileOpen] = useState(false);
  const hasAnyFilter = Object.values(current).some((v) => !!v);

  // Determine which price tab is active based on current URL params
  const activePriceTab = PRICE_TABS.find((tab) => {
    const urlMin = current.minPrice ? Number(current.minPrice) : null;
    const urlMax = current.maxPrice ? Number(current.maxPrice) : null;
    return tab.minPrice === urlMin && tab.maxPrice === urlMax;
  }) ?? PRICE_TABS[0];

  const sidebarContent = (
    <>
      {/* Browse by Price */}
      <div className="mb-6">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-gray-400 mb-2 px-1">
          Browse by Price
        </h3>
        <nav>
          {PRICE_TABS.map((tab) => {
            const isActive = tab === activePriceTab;
            return (
              <Link
                key={tab.label}
                href={tab.href}
                className={`
                  flex items-center justify-between w-full px-3 py-2 rounded-lg text-sm font-medium transition-colors mb-0.5
                  ${isActive
                    ? "bg-brand-red text-white"
                    : "text-brand-gray-700 hover:bg-brand-gray-100 hover:text-brand-gray-900"
                  }
                `}
              >
                {tab.label}
                {isActive && (
                  <svg className="w-4 h-4 opacity-70" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      <hr className="border-brand-gray-100 mb-6" />

      {/* Detailed filters */}
      <form action="/inventory" method="get" className="space-y-6">
        {/* Preserve active price tab params when submitting the form */}
        {activePriceTab.minPrice !== null && (
          <input type="hidden" name="minPrice" value={activePriceTab.minPrice} />
        )}
        {activePriceTab.maxPrice !== null && (
          <input type="hidden" name="maxPrice" value={activePriceTab.maxPrice} />
        )}

        {/* Make */}
        <div>
          <label htmlFor="filter-make" className="block text-sm font-semibold text-brand-gray-900 mb-2">
            Make
          </label>
          <select
            id="filter-make"
            name="make"
            defaultValue={current.make ?? ""}
            className="w-full border border-brand-gray-200 rounded-lg px-3 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
          >
            <option value="">All Makes</option>
            {MAKES.map((make) => (
              <option key={make} value={make.toLowerCase()}>
                {make}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range — manual min/max (only shown when no price tab is active) */}
        {activePriceTab === PRICE_TABS[0] && (
          <div>
            <label className="block text-sm font-semibold text-brand-gray-900 mb-2">Price Range</label>
            <div className="flex gap-2">
              <input
                type="number"
                name="minPrice"
                defaultValue={current.minPrice ?? ""}
                placeholder="Min"
                aria-label="Minimum price"
                className="w-1/2 border border-brand-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
              <input
                type="number"
                name="maxPrice"
                defaultValue={current.maxPrice ?? ""}
                placeholder="Max"
                aria-label="Maximum price"
                className="w-1/2 border border-brand-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
            </div>
          </div>
        )}

        {/* Mileage */}
        <div>
          <label htmlFor="filter-mileage" className="block text-sm font-semibold text-brand-gray-900 mb-2">
            Max Mileage
          </label>
          <select
            id="filter-mileage"
            name="maxMileage"
            defaultValue={current.maxMileage ?? ""}
            className="w-full border border-brand-gray-200 rounded-lg px-3 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
          >
            <option value="">Any Mileage</option>
            <option value="50000">Under 50,000</option>
            <option value="75000">Under 75,000</option>
            <option value="100000">Under 100,000</option>
            <option value="125000">Under 125,000</option>
            <option value="150000">Under 150,000</option>
          </select>
        </div>

        {/* Year Range */}
        <div>
          <label className="block text-sm font-semibold text-brand-gray-900 mb-2">Year</label>
          <div className="flex gap-2">
            <select
              name="minYear"
              defaultValue={current.minYear ?? ""}
              aria-label="Minimum year"
              className="w-1/2 border border-brand-gray-200 rounded-lg px-3 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            >
              <option value="">Min Year</option>
              {Array.from({ length: 15 }, (_, i) => 2026 - i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
            <select
              name="maxYear"
              defaultValue={current.maxYear ?? ""}
              aria-label="Maximum year"
              className="w-1/2 border border-brand-gray-200 rounded-lg px-3 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
            >
              <option value="">Max Year</option>
              {Array.from({ length: 15 }, (_, i) => 2026 - i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Body Style */}
        <div>
          <label htmlFor="filter-body" className="block text-sm font-semibold text-brand-gray-900 mb-2">
            Body Style
          </label>
          <select
            id="filter-body"
            name="bodyStyle"
            defaultValue={current.bodyStyle ?? ""}
            className="w-full border border-brand-gray-200 rounded-lg px-3 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
          >
            <option value="">All Styles</option>
            {BODY_STYLES.map((style) => (
              <option key={style} value={style.toLowerCase()}>
                {style}
              </option>
            ))}
          </select>
        </div>

        {/* Drivetrain */}
        <div>
          <label htmlFor="filter-drivetrain" className="block text-sm font-semibold text-brand-gray-900 mb-2">
            Drivetrain
          </label>
          <select
            id="filter-drivetrain"
            name="drivetrain"
            defaultValue={current.drivetrain ?? ""}
            className="w-full border border-brand-gray-200 rounded-lg px-3 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
          >
            <option value="">Any Drivetrain</option>
            <option value="AWD">AWD</option>
            <option value="4WD">4WD</option>
            <option value="FWD">FWD</option>
            <option value="RWD">RWD</option>
          </select>
        </div>

        {/* Apply / Reset */}
        <div className="flex gap-2">
          <button
            type="submit"
            className="flex-1 bg-brand-red hover:bg-brand-red-dark text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
          >
            Apply Filters
          </button>
          {hasAnyFilter && (
            <Link
              href="/inventory"
              className="px-4 py-2.5 border border-brand-gray-200 rounded-lg text-sm text-brand-gray-500 hover:text-brand-gray-700 hover:border-brand-gray-300 transition-colors"
            >
              Reset
            </Link>
          )}
        </div>
      </form>
    </>
  );

  return (
    <>
      {/* Mobile filter toggle */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="w-full flex items-center justify-center gap-2 bg-white border border-brand-gray-200 rounded-lg py-3 text-sm font-semibold text-brand-gray-700 hover:bg-brand-gray-50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          {mobileOpen ? "Hide Filters" : "Show Filters"}
        </button>
        {mobileOpen && (
          <div className="mt-4 bg-white rounded-xl border border-brand-gray-200 p-5">{sidebarContent}</div>
        )}
      </div>

      {/* Desktop filter sidebar */}
      <div className="hidden lg:block bg-white rounded-xl border border-brand-gray-200 p-5 sticky top-24">
        <h2 className="font-bold text-brand-gray-900 mb-4">Filter Vehicles</h2>
        {sidebarContent}
      </div>
    </>
  );
}

/** Exported filter with Suspense wrapper for useSearchParams. */
export default function InventoryFilters() {
  return (
    <Suspense fallback={null}>
      <InventoryFiltersInner />
    </Suspense>
  );
}
