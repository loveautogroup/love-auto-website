"use client";

/**
 * Homepage "Our happy customers" section.
 *
 * Muted, looping short cut (faces and cars only, no review-slide text) that
 * plays only while scrolled into view — see PromoVideo's "auto-in-view" mode
 * for the IntersectionObserver + prefers-reduced-motion handling. Links out
 * to the full ~1:47 video on /reviews, anchored to that page's own copy of
 * it (id="happy-customers-video").
 *
 * The heading is translated via <T> like the rest of the homepage, so it
 * reads correctly on both / and /es/ (same component tree, different
 * LanguageContext locale, see src/app/es/page.tsx).
 */

import Link from "next/link";
import T from "@/components/T";
import PromoVideo from "@/components/PromoVideo";

export default function HomeHappyCustomers() {
  return (
    <section className="bg-white py-16" aria-labelledby="happy-customers-heading">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h2
          id="happy-customers-heading"
          className="text-3xl font-bold text-brand-gray-900 mb-2"
        >
          <T path={["homePage", "happyCustomersHeading"]} />
        </h2>
        <div className="mt-6 max-w-2xl mx-auto">
          <PromoVideo
            src="/videos/happy-customers-short.mp4"
            posterSrc="/videos/happy-customers-short-poster.jpg"
            mode="auto-in-view"
            ariaLabel="Love Auto Group customers and their cars"
            analyticsVideo="happy_customers_short"
            analyticsLocation="homepage"
          />
        </div>
        <Link
          href="/reviews/#happy-customers-video"
          className="inline-block mt-6 text-brand-red font-semibold hover:text-brand-red-dark"
        >
          <T path={["homePage", "watchFullVideo"]} />
        </Link>
      </div>
    </section>
  );
}
