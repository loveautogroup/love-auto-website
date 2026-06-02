"use client";

import Link from "next/link";
import Image from "next/image";
import { SITE_CONFIG, NAV_LINKS } from "@/lib/constants";
import CarfaxAdvantageBadge from "@/components/CarfaxAdvantageBadge";
import { useLanguage } from "@/context/LanguageContext";
import { useReviews } from "@/context/ReviewsContext";

// Maps NAV_LINKS href → translation key
const NAV_KEY_MAP: Record<string, string> = {
  "/": "home",
  "/inventory": "inventory",
  "/financing": "financing",
  "/sell-your-car": "sellYourCar",
  "/about": "about",
  "/faq": "faq",
  "/contact": "contact",
};

export default function Footer() {
  const googleReviews = useReviews();
  const currentYear = new Date().getFullYear();
  const { t } = useLanguage();

  return (
    <footer className="bg-brand-navy text-white" role="contentinfo">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: About */}
          <div>
            <div className="mb-4">
              <Image
                src="/images/logo.png"
                alt="Love Auto Group — Since 2014"
                width={180}
                height={66}
                className="h-14 w-auto object-contain"
              />
            </div>
            <p className="text-brand-gray-300 text-sm leading-relaxed">
              {t.footer.about}
            </p>

            {/* Carfax Advantage Dealer accreditation */}
            <div className="mt-5">
              <CarfaxAdvantageBadge size="sm" />
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-brand-gray-300 mb-4">
              {t.footer.quickLinks}
            </h3>
            <ul className="space-y-2">
              {NAV_LINKS.map((link) => {
                const key = NAV_KEY_MAP[link.href] as keyof typeof t.nav | undefined;
                const label = key ? t.nav[key] : link.label;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-brand-gray-200 hover:text-white text-sm transition-colors"
                    >
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Column 3: Hours */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-brand-gray-300 mb-4">
              {t.footer.businessHours}
            </h3>
            <ul className="space-y-1.5 text-sm">
              {SITE_CONFIG.hours.map((h) => (
                <li key={h.day} className="flex justify-between">
                  <span className="text-brand-gray-300">{h.day}</span>
                  <span
                    className={
                      h.hours === "Closed"
                        ? "text-brand-red"
                        : "text-brand-gray-200"
                    }
                  >
                    {h.hours}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-brand-gray-300 mb-4">
              {t.footer.contactUs}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={`tel:${SITE_CONFIG.phoneRaw}`}
                  className="flex items-center gap-2 text-brand-gold hover:text-brand-gold-light font-semibold transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  {SITE_CONFIG.phone}
                </a>
              </li>
              <li className="flex items-start gap-2 text-brand-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span>
                  {SITE_CONFIG.address.street}
                  <br />
                  {SITE_CONFIG.address.city}, {SITE_CONFIG.address.state}{" "}
                  {SITE_CONFIG.address.zip}
                </span>
              </li>
              <li>
                <a
                  href={`mailto:${SITE_CONFIG.email}`}
                  className="flex items-center gap-2 text-brand-gray-200 hover:text-white transition-colors"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {SITE_CONFIG.email}
                </a>
              </li>
              <li>
                <a
                  href={SITE_CONFIG.reviews.google.readUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-brand-gray-200 hover:text-white transition-colors mt-4 pt-4 border-t border-white/10"
                >
                  <svg viewBox="0 0 24 24" width={16} height={16} xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                  </svg>
                  <span className="flex items-center gap-1">
                    <span className="text-yellow-400 text-xs">★★★★★</span>
                    <span className="text-xs">
                      {googleReviews.rating} ({googleReviews.reviewCount} reviews)
                    </span>
                  </span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-brand-gray-500">
          <p>
            &copy; {currentYear} {SITE_CONFIG.name}. {t.footer.rights}
          </p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-brand-gray-300">
              {t.footer.privacy}
            </Link>
            <Link href="/terms" className="hover:text-brand-gray-300">
              {t.footer.terms}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
