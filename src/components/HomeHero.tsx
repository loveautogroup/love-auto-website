"use client";

/**
 * HomeHero — homepage hero section as a client component.
 *
 * Extracted from app/page.tsx so it can consume useLanguage() for EN/ES
 * translations. All other page sections stay as server-rendered RSC.
 */

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import CarfaxAdvantageBadge from "@/components/CarfaxAdvantageBadge";
import { GoogleReviewsLockup } from "@/components/badges/DealerCluster";
import { SITE_CONFIG } from "@/lib/constants";

export default function HomeHero() {
  const { t } = useLanguage();

  const pills = [
    { key: "under10" as const, href: "/inventory?maxPrice=10000" },
    { key: "under15" as const, href: "/inventory?maxPrice=15000" },
    { key: "awd" as const, href: "/inventory?drivetrain=AWD" },
    { key: "suvs" as const, href: "/inventory?bodyStyle=suv" },
    { key: "sedans" as const, href: "/inventory?bodyStyle=sedan" },
    { key: "lowMiles" as const, href: "/inventory?maxMileage=60000" },
  ];

  return (
    <section className="relative bg-brand-navy text-white overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-black via-brand-navy to-[#1a1a2e]" />
      <div className="relative max-w-7xl mx-auto px-4 py-8 md:py-12 lg:py-16">
        <div className="max-w-2xl">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold leading-tight">
            {t.hero.headline}
            <span className="block text-brand-red mt-2">
              {t.hero.headlineSub}
            </span>
          </h1>
          <p className="mt-3 text-sm md:text-base text-brand-gray-300 leading-relaxed">
            {t.hero.subtext}
          </p>
          <div className="mt-4 flex flex-col sm:flex-row gap-3">
            <Link
              href="/inventory"
              className="inline-flex items-center justify-center bg-brand-red hover:bg-brand-red-dark text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              {t.hero.cta}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="ml-2 w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
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
              {t.hero.ctaFinancing}
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
                {t.hero.makeLabel}
              </label>
              <select
                id="hero-make"
                name="make"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white placeholder-brand-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-red"
              >
                <option value="">{t.hero.makeAll}</option>
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
                {t.hero.priceLabel}
              </label>
              <select
                id="hero-price"
                name="maxPrice"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-red"
              >
                <option value="">{t.hero.priceAny}</option>
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
                {t.hero.bodyLabel}
              </label>
              <select
                id="hero-type"
                name="bodyStyle"
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-brand-red"
              >
                <option value="">{t.hero.bodyAll}</option>
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
                {t.hero.searchLabel}
              </button>
            </div>
          </form>
        </div>

        {/* Quick-Filter Pills */}
        <div className="mt-6 flex flex-wrap gap-2">
          {pills.map((pill) => (
            <Link
              key={pill.key}
              href={pill.href}
              className="inline-flex items-center bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 text-white text-sm font-medium px-4 py-2 rounded-full transition-all"
            >
              {t.hero.pills[pill.key]}
            </Link>
          ))}
        </div>

        {/* Trust strip */}
        <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap items-center gap-4">
          <CarfaxAdvantageBadge size="sm" />
          <GoogleReviewsLockup
            rating={SITE_CONFIG.reviews.google.rating}
            reviewCount={SITE_CONFIG.reviews.google.count}
            reviewsUrl={SITE_CONFIG.reviews.google.readUrl}
          />
          <span className="text-brand-gray-300 text-sm">
            Family owned since 2014
          </span>
        </div>
      </div>
    </section>
  );
}
