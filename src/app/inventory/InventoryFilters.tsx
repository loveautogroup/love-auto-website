"use client";

import { useState } from "react";

const MAKES = ["Subaru", "Lexus", "Acura", "Mazda", "Honda", "Toyota"];
const BODY_STYLES = ["SUV", "Sedan", "Wagon", "Truck", "Coupe"];

export default function InventoryFilters() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const filterContent = (
    <div className="space-y-6">
      {/* Make */}
      <div>
        <label
          htmlFor="filter-make"
          className="block text-sm font-semibold text-brand-gray-900 mb-2"
        >
          Make
        </label>
        <select
          id="filter-make"
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

      {/* Price Range */}
      <div>
        <label className="block text-sm font-semibold text-brand-gray-900 mb-2">
          Price Range
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            placeholder="Min"
            aria-label="Minimum price"
            className="w-1/2 border border-brand-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
          />
          <input
            type="number"
            placeholder="Max"
            aria-label="Maximum price"
            className="w-1/2 border border-brand-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
          />
        </div>
      </div>

      {/* Mileage */}
      <div>
        <label
          htmlFor="filter-mileage"
          className="block text-sm font-semibold text-brand-gray-900 mb-2"
        >
          Max Mileage
        </label>
        <select
          id="filter-mileage"
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
        <label className="block text-sm font-semibold text-brand-gray-900 mb-2">
          Year
        </label>
        <div className="flex gap-2">
          <select
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
        <label
          htmlFor="filter-body"
          className="block text-sm font-semibold text-brand-gray-900 mb-2"
        >
          Body Style
        </label>
        <select
          id="filter-body"
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

      {/* Apply / Reset */}
      <div className="flex gap-2">
        <button
          type="button"
          className="flex-1 bg-brand-red hover:bg-brand-red-dark text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
        >
          Apply Filters
        </button>
        <button
          type="button"
          className="px-4 py-2.5 border border-brand-gray-200 rounded-lg text-sm text-brand-gray-500 hover:text-brand-gray-700 hover:border-brand-gray-300 transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
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
          <div className="mt-4 bg-white rounded-xl border border-brand-gray-200 p-5">
            {filterContent}
          </div>
        )}
      </div>

      {/* Desktop filter sidebar */}
      <div className="hidden lg:block bg-white rounded-xl border border-brand-gray-200 p-5 sticky top-24">
        <h2 className="font-bold text-brand-gray-900 mb-4">Filter Vehicles</h2>
        {filterContent}
      </div>
    </>
  );
}
