import Link from "next/link";
import Image from "next/image";
import { SITE_CONFIG, NAV_LINKS } from "@/lib/constants";
import GoogleReviewsBadge from "@/components/GoogleReviewsBadge";
import CarfaxAdvantageBadge from "@/components/CarfaxAdvantageBadge";

export default async function Footer() {
  const currentYear = new Date().getFullYear();

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
              Family owned since {SITE_CONFIG.established}. We specialize in
              quality Japanese vehicles, carefully selected and fully
              reconditioned in Villa Park, IL.
            </p>

            {/* Carfax Advantage Dealer accreditation — persistent footer
                trust mark, visible on every page. */}
            <div className="mt-5">
              <CarfaxAdvantageBadge size="sm" />
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-brand-gray-300 mb-4">
              Quick Links
            </h3>
            <ul className="space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-brand-gray-200 hover:text-white text-sm transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Hours */}
          <div>
            <h3 className="font-semibold text-sm uppercase tracking-wider text-brand-gray-300 mb-4">
              Business Hours
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
              Contact Us
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <a
                  href={`tel:${SITE_CONFIG.phoneRaw}`}
                  className="flex items-center gap-2 text-brand-gold hover:text-brand-gold-light font-semibold transition-colors"
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
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                  {SITE_CONFIG.phone}
                </a>
              </li>
              <li className="flex items-start gap-2 text-brand-gray-200">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 mt-0.5 shrink-0"
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
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                  {SITE_CONFIG.email}
                </a>
              </li>
              <li>
                <GoogleReviewsBadge variant="compact" />
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-brand-gray-500">
          <p>
            &copy; {currentYear} {SITE_CONFIG.name}. All rights reserved.
          </p>
          <div className="flex gap-4">
            <Link href="/privacy-policy" className="hover:text-brand-gray-300">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-brand-gray-300">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
