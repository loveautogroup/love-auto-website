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
import PromoVideo from "@/components/PromoVideo";
import { VideoObjectSchema } from "@/components/StructuredData";
import { SITE_CONFIG } from "@/lib/constants";
import { TrackedPhoneLink } from "@/components/TrackedLink";
import { getGoogleReviews } from "@/lib/google-reviews";

/**
 * Metadata is derived from the same review fetcher the page body uses,
 * rather than hardcoded. The rating and count were previously frozen
 * literals ("4.7 Stars", "129 reviews") that would keep asserting those
 * numbers in the title, description and search snippet forever, drifting
 * further from the live figures shown on the page itself with every new
 * review. Next memoizes the fetch, so this costs nothing extra.
 */
export async function generateMetadata(): Promise<Metadata> {
  const { rating, reviewCount } = await getGoogleReviews();
  return {
  title: `Customer Reviews, ${rating} Stars on Google | Love Auto Group`,
  description:
    `Read real Google reviews from Love Auto Group customers. ${rating}-star rating across ${reviewCount} reviews from buyers in Villa Park, Lombard, Elmhurst, Oak Brook and the surrounding DuPage County area.`,
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
}

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

      {/* "Our happy customers" video — click-to-play, full ~1:47 cut with
          review slides. Placed at the top of the page's content, right
          below the hero and above the individual review cards. */}
      <VideoObjectSchema
        name="Love Auto Group happy customers"
        description="Love Auto Group customers in Villa Park, IL share their experience buying a used car."
        thumbnailUrl={`${SITE_CONFIG.url}/videos/happy-customers-poster.jpg`}
        contentUrl={`${SITE_CONFIG.url}/videos/happy-customers.mp4`}
        uploadDate="2026-09-26"
        duration="PT1M47S"
      />
      <section className="bg-brand-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-gray-900 mb-2">
            Our happy customers
          </h2>
          <p className="italic text-brand-gray-500 mb-6">
            &ldquo;Enter as strangers, leave as friends.&rdquo;
          </p>
          <PromoVideo
            id="happy-customers-video"
            src="/videos/happy-customers.mp4"
            posterSrc="/videos/happy-customers-poster.jpg"
            mode="click"
            ariaLabel="Love Auto Group customers sharing their experience"
            analyticsVideo="happy_customers"
            analyticsLocation="reviews_page"
          />
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
            {/* The place-ID-anchored link from the Business Profile's own
                Share dialog, owner-clicked and confirmed 2026-08-08. The old
                slug link here (g.page/r/love-auto-group/review) landed on the
                google.com HOMEPAGE — but returned HTTP 200 doing it, because
                g.page answers 200 for unknown slugs. Following the redirect is
                the only honest test for these links. */}
            <a
              href="https://g.page/r/CZ_PEUY7mM9NEAI/review"
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
            <TrackedPhoneLink
              location="reviews_page"
              href={`tel:${SITE_CONFIG.phone.replace(/\D/g, "")}`}
              className="text-brand-red hover:underline"
            >
              {SITE_CONFIG.phone}
            </TrackedPhoneLink>
          </p>
        </div>
      </section>
    </>
  );
}
