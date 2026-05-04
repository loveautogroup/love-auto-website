import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants";
import HomeFeaturedGrid, { HomeOnTheLot } from "@/components/HomeFeaturedGrid";
import GoogleReviewsBadge from "@/components/GoogleReviewsBadge";
import PaymentCalculator from "@/components/PaymentCalculator";
import CarfaxAdvantageBadge from "@/components/CarfaxAdvantageBadge";

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-brand-navy text-white overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-brand-navy to-[#1a1a2e]" />
        <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-12 lg:py-16">
          <div className="max-w-2xl">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
              Find Your Next Ride
              <span className="block text-brand-red mt-2">
                at Love Auto Group
              </span>
            </h1>
            <p className="mt-3 text-sm md:text-base text-brand-gray-300 leading-relaxed">
              Quality used vehicles, inspected, reconditioned and ready to
              drive. Family owned in Villa Park, IL since 2014.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <Link
                href="/inventory"
                className="inline-flex items-center justify-center bg-brand-red hover:bg-brand-red-dark text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                Browse Inventory
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="ml-2 w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
              <Link
                href="/financing"
                className="inline-flex items-center justify-center border-2 border-white/30 hover:bg-white/10 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
              >
                Get Pre-Approved
              </Link>
            </div>
          </div>

          {/* Quick Search */}
          <div className="mt-4 bg-white/10 backdrop-blur-sm rounded-xl p-3 max-w-4xl">
            <form
              action="/inventory"
              className="grid grid-cols-1 sm:grid-cols-4 gap-4"
            >
              <div>
                <label
                  htmlFor="hero-make"
                  className="block text-sm font-medium text-brand-gray-300 mb-1"
                >
                  Make
                </label>
                <select
                  id="hero-make"
                  name="make"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-brand-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-red"
                >
                  <option value="">All Makes</option>
                  <option value="subaru">Subaru</option>
                  <option value="lexus">Lexus</option>
                  <option value="acura">Acura</option>
                  <option value="mazda">Mazda</option>
                  <option value="honda">Honda</option>
                  <option value="toyota">Toyota</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="hero-price"
                  className="block text-sm font-medium text-brand-gray-300 mb-1"
                >
                  Max Price
                </label>
                <select
                  id="hero-price"
                  name="maxPrice"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-red"
                >
                  <option value="">Any Price</option>
                  <option value="8000">Under $8,000</option>
                  <option value="10000">Under $10,000</option>
                  <option value="12000">Under $12,000</option>
                  <option value="15000">Under $15,000</option>
                  <option value="18000">Under $18,000</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="hero-type"
                  className="block text-sm font-medium text-brand-gray-300 mb-1"
                >
                  Body Style
                </label>
                <select
                  id="hero-type"
                  name="bodyStyle"
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-red"
                >
                  <option value="">All Types</option>
                  <option value="suv">SUV</option>
                  <option value="sedan">Sedan</option>
                  <option value="wagon">Wagon</option>
                  <option value="truck">Truck</option>
                  <option value="coupe">Coupe</option>
                </select>
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-brand-gold hover:bg-brand-gold-light text-brand-navy font-bold px-6 py-2.5 rounded-lg transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </div>

          {/* Quick-Filter Pills â€” CarMax-inspired one-tap shortcuts */}
          <div className="mt-6 flex flex-wrap gap-2">
            {[
              { label: "Under $10K", href: "/inventory?maxPrice=10000" },
              { label: "Under $15K", href: "/inventory?maxPrice=15000" },
              { label: "AWD", href: "/inventory?drivetrain=AWD" },
              { label: "SUVs", href: "/inventory?bodyStyle=suv" },
              { label: "Sedans", href: "/inventory?bodyStyle=sedan" },
              { label: "Low Mileage", href: "/inventory?maxMileage=60000" },
              { label: "Just Arrived", href: "/inventory?sortBy=recent" },
            ].map((pill) => (
              <Link
                key={pill.label}
                href={pill.href}
                className="inline-flex items-center bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white text-sm font-medium px-4 py-2 rounded-full transition-all"
              >
                {pill.label}
              </Link>
            ))}
          </div>

          {/* Trust strip — Carfax Advantage Dealer + family-owned signal.
              Anchors the hero with a third-party accreditation right above
              the fold, before the visitor scrolls into inventory. */}
          <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-brand-gray-300">
            <CarfaxAdvantageBadge size="md" />
            <div className="h-10 w-px bg-white/15 hidden sm:block" />
            <div>
              <p className="text-white font-semibold">
                Family Owned · Villa Park, IL
              </p>
              <p className="text-xs text-brand-gray-400">
                Free Carfax on every vehicle. No exceptions.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Vehicles — self-hides when nothing is featured in KV */}
      <HomeFeaturedGrid />

      {/* On the Lot Now â€” horizontal scroll carousel */}
      <section className="bg-brand-navy py-12" aria-labelledby="lot-heading">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <h2 id="lot-heading" className="text-2xl font-bold text-white">
                On the Lot Now
              </h2>
              <p className="text-brand-gray-300 text-sm mt-1">
                Available today in Villa Park
              </p>
            </div>
            <Link
              href="/inventory"
              className="text-brand-red-light hover:text-white text-sm font-semibold transition-colors"
            >
              View All â†’
            </Link>
          </div>
          <HomeOnTheLot />
        </div>
      </section>

      {/* Trust Pillars */}
      <section className="bg-white py-16" aria-labelledby="why-heading">
        <div className="max-w-7xl mx-auto px-4">
          <h2 id="why-heading" className="text-3xl font-bold text-center text-brand-gray-900 mb-12">
            Why Love Auto Group?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-brand-red"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-brand-gray-900 mb-2">
                Every Vehicle Inspected
              </h3>
              <p className="text-brand-gray-500 leading-relaxed">
                Every vehicle is thoroughly inspected and reconditioned
                before it hits the lot. No surprises, just quality you can
                trust.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-brand-red"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-brand-gray-900 mb-2">
                Transparent Pricing
              </h3>
              <p className="text-brand-gray-500 leading-relaxed">
                Our prices are competitive and clearly listed. No hidden fees, no
                pressure tactics. Just deals that respect your
                time and budget.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-brand-red"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-brand-gray-900 mb-2">
                Family Owned Since 2014
              </h3>
              <p className="text-brand-gray-500 leading-relaxed">
                We&apos;re not a big corporate dealer group. We know our
                customers by name, and our reputation is everything. That&apos;s
                why we do it right.
              </p>
            </div>
          </div>

          {/* Accreditations row — third-party trust marks. Reinforces the
              three pillars with externally-verifiable proof points. */}
          <div className="mt-12 pt-10 border-t border-brand-gray-200">
            <p className="text-center text-xs uppercase tracking-[0.18em] text-brand-gray-500 mb-5">
              Accredited & Recognized
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              <CarfaxAdvantageBadge size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* Google Reviews Badge â€” live data from Places API, refreshed hourly */}
      <GoogleReviewsBadge variant="full" />

      {/* Interactive Payment Calculator â€” CarMax-inspired */}
      <PaymentCalculator />

      {/* Location & Hours */}
      <section className="max-w-7xl mx-auto px-4 py-16" aria-labelledby="visit-heading">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 id="visit-heading" className="text-3xl font-bold text-brand-gray-900 mb-6">
              Visit Us in Villa Park
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-brand-red mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-brand-gray-900">
                    {SITE_CONFIG.address.full}
                  </p>
                  <p className="text-sm text-brand-gray-500">
                    Conveniently located off North Avenue in DuPage County
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-brand-red mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                <div>
                  <a
                    href={`tel:${SITE_CONFIG.phoneRaw}`}
                    className="font-semibold text-brand-red hover:text-brand-red-dark"
                  >
                    {SITE_CONFIG.phone}
                  </a>
                  <p className="text-sm text-brand-gray-500">
                    Call or text, we respond fast
                  </p>
                </div>
              </div>
            </div>

            {/* Hours table */}
            <div className="mt-6 bg-white rounded-xl border border-brand-gray-200 p-5">
              <h3 className="font-semibold text-brand-gray-900 mb-3">
                Business Hours
              </h3>
              <ul className="space-y-1.5 text-sm">
                {SITE_CONFIG.hours.map((h) => (
                  <li key={h.day} className="flex justify-between">
                    <span className="text-brand-gray-500">{h.day}</span>
                    <span
                      className={`font-medium ${h.hours === "Closed" ? "text-brand-red" : "text-brand-gray-900"}`}
                    >
                      {h.hours}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Map */}
          <div className="rounded-2xl overflow-hidden border border-brand-gray-200">
            <iframe
              title={`Map of ${SITE_CONFIG.name} at ${SITE_CONFIG.address.full}`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(SITE_CONFIG.address.full)}&output=embed`}
              className="w-full aspect-[4/3] block border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>
    </>
  );
}

