"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { NAV_LINKS, SITE_CONFIG } from "@/lib/constants";
import CarfaxAdvantageBadge from "@/components/CarfaxAdvantageBadge";
import { useLanguage } from "@/context/LanguageContext";
import { useReviews } from "@/context/ReviewsContext";

// Maps NAV_LINKS href → translation key so we can look up the right label.
const NAV_KEY_MAP: Record<string, keyof ReturnType<typeof useLanguage>["t"]["nav"]> = {
  "/": "home",
  "/inventory": "inventory",
  "/financing": "financing",
  "/sell-your-car": "sellYourCar",
  "/about": "about",
  "/faq": "faq",
  "/contact": "contact",
};

// Simple Carfax wordmark for the mobile-only banner.
function CarfaxWordmark() {
  return (
    <span
      className="inline-flex items-center bg-white border border-[#1A1919] rounded-sm px-1.5 py-0.5"
      role="img"
      aria-label="Free Carfax report on every vehicle"
    >
      <Image
        src="/brand/carfax-logo.svg"
        alt="Carfax"
        width={56}
        height={12}
        className="h-3 w-auto"
        unoptimized
      />
    </span>
  );
}

/** Language toggle pill — full language names, accessible. */
function LangToggle() {
  const { locale, setLocale } = useLanguage();
  return (
    <button
      onClick={() => setLocale(locale === "en" ? "es" : "en")}
      className="flex items-center gap-1 text-sm font-semibold rounded-full border border-white/30 overflow-hidden"
      aria-label={locale === "en" ? "Switch to Spanish" : "Cambiar a inglés"}
    >
      <span
        className={`px-4 py-1 transition-colors ${
          locale === "en"
            ? "bg-brand-red text-white"
            : "text-brand-gray-400 hover:text-white"
        }`}
      >
        English
      </span>
      <span
        className={`px-4 py-1 transition-colors ${
          locale === "es"
            ? "bg-brand-red text-white"
            : "text-brand-gray-400 hover:text-white"
        }`}
      >
        Español
      </span>
    </button>
  );
}

export default function Header() {
  const googleReviews = useReviews();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useLanguage();

  return (
    <header className="bg-brand-navy text-white sticky top-0 z-50">
      {/* Top bar — phone + hours + lang toggle */}
      <div className="bg-brand-gray-900 text-sm py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="text-brand-gray-300">
              735 N Yale Ave, Unit A, Villa Park, IL 60181
            </span>
            <span className="text-brand-gray-700" aria-hidden="true">|</span>
            <CarfaxAdvantageBadge size="xs" />
          </div>
          <div className="flex items-center gap-4">
            {/* Google Reviews badge */}
            <a
              href={SITE_CONFIG.reviews.google.readUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-brand-gray-200 hover:text-white transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              <span className="text-yellow-400 text-xs leading-none">★★★★★</span>
              <span className="font-semibold text-white">{googleReviews.rating}</span>
              <span className="text-brand-gray-400">({googleReviews.reviewCount} reviews)</span>
            </a>
            <span className="text-brand-gray-300">{t.header.hours}</span>
            <a
              href={`tel:${SITE_CONFIG.phoneRaw}`}
              className="text-brand-red-light hover:text-white font-semibold"
            >
              {SITE_CONFIG.phone}
            </a>
            <LangToggle />
          </div>
        </div>
      </div>

      {/* Mobile-only credibility strip */}
      <div className="md:hidden bg-brand-gray-900 px-4 py-1.5 flex items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-2">
          <CarfaxWordmark />
          <span className="text-brand-gray-400">·</span>
          <span className="text-brand-gray-300 font-medium">{t.header.freeCarfax}</span>
        </div>
        <LangToggle />
      </div>

      {/* Main nav */}
      <nav
        className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between"
        aria-label="Main navigation"
      >
        {/* Logo */}
        <Link href="/" className="flex items-center group">
          <Image
            src="/images/logo-primary.svg"
            alt="Love Auto Group — Since 2014"
            width={440}
            height={160}
            className="h-28 md:h-32 w-auto object-contain"
            priority
          />
        </Link>

        {/* Desktop nav links */}
        <div className="hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const key = NAV_KEY_MAP[link.href];
            const label = key ? t.nav[key] : link.label;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 rounded-md text-sm font-medium text-brand-gray-200 hover:text-white hover:bg-white/10 transition-colors"
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* CTA + Phone (desktop) */}
        <div className="hidden lg:flex items-center gap-3">
          <a
            href={`tel:${SITE_CONFIG.phoneRaw}`}
            className="text-brand-red-light hover:text-white font-semibold text-sm"
          >
            {SITE_CONFIG.phone}
          </a>
          <Link
            href="/inventory"
            className="bg-brand-red hover:bg-brand-red-dark text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            {t.header.browseInventory}
          </Link>
        </div>

        {/* Mobile: phone + hamburger */}
        <div className="flex lg:hidden items-center gap-3">
          <a
            href={`tel:${SITE_CONFIG.phoneRaw}`}
            className="bg-brand-green text-white p-2 rounded-lg"
            aria-label="Call Love Auto Group"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
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
          </a>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-white/10"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-brand-navy border-t border-white/10 pb-4">
          <div className="px-4 pt-2 space-y-1">
            {NAV_LINKS.map((link) => {
              const key = NAV_KEY_MAP[link.href];
              const label = key ? t.nav[key] : link.label;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-md text-base font-medium text-brand-gray-200 hover:text-white hover:bg-white/10"
                >
                  {label}
                </Link>
              );
            })}
          </div>
          <div className="px-4 mt-3">
            <Link
              href="/inventory"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center bg-brand-red hover:bg-brand-red-dark text-white px-4 py-3 rounded-lg font-semibold transition-colors"
            >
              {t.header.browseInventory}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
 