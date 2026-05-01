/**
 * Public reviews page — /reviews/
 *
 * Originally specced under task #23 (Bill/Charlotte: /reviews page
 * implementation). Restored 2026-04-30 after we discovered the route
 * had never actually shipped to the repo — the public `/reviews` URL
 * was being captured by a `_redirects` rule that pointed at
 * `/about#reviews`, an anchor that didn't exist on /about, which Chrome
 * reported as "Redirect was cancelled" and Google Search Console
 * reported as "Not found (404)".
 *
 * This page reuses the live Google reviews fetcher already in place for
 * the VDP review embeds, plus the AggregateRating + AutoDealer schema
 * that ships in StructuredData, so it earns review-rich-result
 * eligibility on its own URL instead of routing rank credit through the
 * homepage.
 */

import type { Metadata } from "next";
import Link from "next/link";
import VDPReviews from "@/components/VDPReviews";
import GoogleReviewsBadge from "@/components/GoogleReviewsBadge";
import { SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Customer Reviews — Love Auto Group | Villa Park, IL",
  description:
    "Read real Google reviews from Love Auto Group customers. 4.7-star rating across 125+ reviews from buyers in Villa Park, Lombard, Elmhurst, Oak Brook and the surrounding DuPage County area.",
  alternates: { canonical: "https://www.loveautogroup.net/reviews/" },
  openGraph: {
    title: "Customer Reviews — Love Auto Group",
    description:
      "Real Google reviews from Love Auto Group customers in Villa Park, IL.",
    url: "https://www.loveautogroup.net/reviews/",
    type: "website",
    siteName: "Love Auto Group",
  },
  twitter: {
    card: "summary_large_image",
    title: "Customer Reviews — Love Auto Group",
    description:
      "Real Google reviews from Love Auto Group customers in Villa Park, IL.",
  },
};

export default function ReviewsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-brand-navy text-white py-12 md:py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            What Our Customers Say
          </h1>
          <p className="mt-4 text-lg md:text-xl text-brand-gray-300">
            Honest reviews from drivers across Villa Park, Lombard, Elmhurst,
            Oak Brook and the rest of DuPage County. Every review on this
            page is pulled live from Google.
          </p>
          <div className="mt-6">
            <GoogleReviewsBadge />
          </div>
        </div>
      </section>

      {/* Reviews block */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <VDPReviews />
      </section>

      {/* Leave a review CTA */}
      <section className="bg-brand-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-gray-900 mb-3">
            Bought from us? Tell future buyers what you thought.
          </h2>
          <p className="text-brand-gray-600 mb-6">
            Reviews help small, family-owned dealerships compete with the
            mega-lots. It takes 60 seconds and means a lot to us.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="https://g.page/r/love-auto-group/review"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center bg-brand-red hover:bg-brand-red-dark text-white px-6 py-3 rounded-xl font-semibold"
            >
              Leave a Google Review
            </a>
            <Link
              href="/inventory/"
              className="inline-flex items-center border-2 border-brand-gray-300 hover:bg-brand-gray-100 text-brand-gray-900 px-6 py-3 rounded-xl font-semibold"
            >
              Browse Inventory
            </Link>
          </div>
          <p className="mt-6 text-sm text-brand-gray-500">
            {SITE_CONFIG.address.street}, {SITE_CONFIG.address.city}, IL{" "}
            {SITE_CONFIG.address.zip} ·{" "}
            <a
              href={`tel:${SITE_CONFIG.phone.replace(/\D/g, "")}`}
              className="text-brand-red hover:underline"
            >
              {SITE_CONFIG.phone}
            </a>
          </p>
        </div>
      </section>
    </>
  );
}
