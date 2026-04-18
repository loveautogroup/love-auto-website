"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { vehicles, formatPrice, formatMileage } from "@/lib/vehicles";

const MAKES = [
  "Honda",
  "Toyota",
  "Ford",
  "Chevrolet",
  "Subaru",
  "Lexus",
  "Acura",
  "Mazda",
  "GMC",
  "Hyundai",
  "Nissan",
  "BMW",
  "Mercedes-Benz",
];

const PRICE_OPTIONS = [
  { label: "No Min", value: 0 },
  { label: "$5,000", value: 5000 },
  { label: "$7,500", value: 7500 },
  { label: "$10,000", value: 10000 },
  { label: "$12,500", value: 12500 },
  { label: "$15,000", value: 15000 },
  { label: "$20,000+", value: 20000 },
];

const BODY_STYLES = ["Sedan", "SUV", "Truck", "Coupe", "Van"];

const SORT_OPTIONS = [
  { label: "Price Low-High", value: "price-asc" },
  { label: "Price High-Low", value: "price-desc" },
  { label: "Mileage Low-High", value: "mileage-asc" },
  { label: "Year Newest", value: "year-desc" },
];

export default function InventoryPage() {
  const [make, setMake] = useState("");
  const [priceMin, setPriceMin] = useState(0);
  const [priceMax, setPriceMax] = useState(0);
  const [bodyStyle, setBodyStyle] = useState("");
  const [sortBy, setSortBy] = useState("price-asc");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filtered = useMemo(() => {
    let result = vehicles.filter((v) => {
      if (make && v.make !== make) return false;
      if (priceMin && v.price < priceMin) return false;
      if (priceMax && v.price > priceMax) return false;
      if (bodyStyle && v.bodyStyle !== bodyStyle) return false;
      return true;
    });

    result.sort((a, b) => {
      switch (sortBy) {
        case "price-asc":
          return a.price - b.price;
        case "price-desc":
          return b.price - a.price;
        case "mileage-asc":
          return a.mileage - b.mileage;
        case "year-desc":
          return b.year - a.year;
        default:
          return 0;
      }
    });

    return result;
  }, [make, priceMin, priceMax, bodyStyle, sortBy]);

  const clearFilters = () => {
    setMake("");
    setPriceMin(0);
    setPriceMax(0);
    setBodyStyle("");
    setSortBy("price-asc");
  };

  const selectClasses =
    "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-[#1B4F72] focus:outline-none focus:ring-1 focus:ring-[#1B4F72]";

  const FilterPanel = () => (
    <div className="space-y-5">
      {/* Make */}
      <div>
        <label
          htmlFor="make"
          className="mb-1 block text-sm font-semibold text-gray-700"
        >
          Make
        </label>
        <select
          id="make"
          value={make}
          onChange={(e) => setMake(e.target.value)}
          className={selectClasses}
        >
          <option value="">All Makes</option>
          {MAKES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      </div>

      {/* Price Range */}
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-700">
          Price Range
        </label>
        <div className="flex gap-2">
          <select
            aria-label="Minimum price"
            value={priceMin}
            onChange={(e) => setPriceMin(Number(e.target.value))}
            className={selectClasses}
          >
            <option value={0}>No Min</option>
            {PRICE_OPTIONS.slice(1).map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
          <span className="self-center text-gray-400">-</span>
          <select
            aria-label="Maximum price"
            value={priceMax}
            onChange={(e) => setPriceMax(Number(e.target.value))}
            className={selectClasses}
          >
            <option value={0}>No Max</option>
            {PRICE_OPTIONS.slice(1).map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Body Style */}
      <div>
        <label
          htmlFor="bodyStyle"
          className="mb-1 block text-sm font-semibold text-gray-700"
        >
          Body Style
        </label>
        <select
          id="bodyStyle"
          value={bodyStyle}
          onChange={(e) => setBodyStyle(e.target.value)}
          className={selectClasses}
        >
          <option value="">All Styles</option>
          {BODY_STYLES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      {/* Sort By */}
      <div>
        <label
          htmlFor="sortBy"
          className="mb-1 block text-sm font-semibold text-gray-700"
        >
          Sort By
        </label>
        <select
          id="sortBy"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className={selectClasses}
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      {/* Clear Filters */}
      <button
        onClick={clearFilters}
        className="w-full rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
      >
        Clear All Filters
      </button>
    </div>
  );

  return (
    <>
      {/* Page head metadata is set via the metadata export below */}
      <title>
        Used Cars, Trucks &amp; SUVs for Sale Villa Park IL | Love Auto Group
      </title>
      <meta
        name="description"
        content="Browse our full inventory of quality used cars, trucks & SUVs at Love Auto Group in Villa Park, IL. Affordable prices, bank and credit union financing available. Find your next vehicle today."
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <h1 className="mb-6 text-3xl font-bold text-[#1B4F72] md:text-4xl">
          Browse Our Used Car Inventory
        </h1>

        <div className="lg:flex lg:gap-8">
          {/* Mobile filter toggle */}
          <button
            onClick={() => setFiltersOpen(!filtersOpen)}
            className="mb-4 flex w-full items-center justify-between rounded-md bg-[#1B4F72] px-4 py-3 text-white lg:hidden"
            aria-expanded={filtersOpen}
          >
            <span className="font-semibold">
              {filtersOpen ? "Hide Filters" : "Show Filters"}
            </span>
            <svg
              className={`h-5 w-5 transition-transform ${filtersOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* Sidebar filters */}
          <aside
            className={`mb-6 rounded-lg border border-gray-200 bg-white p-5 lg:mb-0 lg:block lg:w-64 lg:shrink-0 ${
              filtersOpen ? "block" : "hidden lg:block"
            }`}
          >
            <h2 className="mb-4 text-lg font-bold text-gray-900">
              Filter Vehicles
            </h2>
            <FilterPanel />
          </aside>

          {/* Main content area */}
          <div className="flex-1">
            {/* Results count */}
            <p className="mb-4 text-sm font-medium text-gray-600">
              Showing{" "}
              <span className="font-bold text-[#1B4F72]">
                {filtered.length}
              </span>{" "}
              vehicle{filtered.length !== 1 ? "s" : ""}
            </p>

            {/* Vehicle grid */}
            {filtered.length > 0 ? (
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((vehicle) => (
                  <Link
                    key={vehicle.id}
                    href={`/inventory/${vehicle.slug}`}
                    className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-lg"
                  >
                    {/* Placeholder image */}
                    <div className="flex h-48 items-center justify-center bg-gray-200 text-gray-400 transition group-hover:bg-gray-300">
                      <svg
                        className="h-16 w-16"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>

                    <div className="p-4">
                      <h3 className="text-lg font-bold text-gray-900 group-hover:text-[#1B4F72]">
                        {vehicle.year} {vehicle.make} {vehicle.model}{" "}
                        {vehicle.trim}
                      </h3>
                      <div className="mt-2 flex items-center justify-between">
                        <span className="text-xl font-extrabold text-[#1B4F72]">
                          {formatPrice(vehicle.price)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {formatMileage(vehicle.mileage)}
                        </span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-500">
                        <span className="rounded bg-gray-100 px-2 py-1">
                          {vehicle.drivetrain}
                        </span>
                        <span className="rounded bg-gray-100 px-2 py-1">
                          {vehicle.bodyStyle}
                        </span>
                        <span className="rounded bg-gray-100 px-2 py-1">
                          {vehicle.exteriorColor}
                        </span>
                      </div>
                      <div className="mt-4 text-center text-sm font-semibold text-[#1B4F72] group-hover:underline">
                        View Details
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              /* Empty state */
              <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-16 text-center">
                <svg
                  className="mb-4 h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
                <h3 className="text-lg font-semibold text-gray-700">
                  No vehicles found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try adjusting your filters to see more results.
                </p>
                <button
                  onClick={clearFilters}
                  className="mt-4 rounded-md bg-[#1B4F72] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#153F5B]"
                >
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
