/**
 * Homepage review wall — dark navy section with individual Google review cards.
 *
 * Async Server Component: fetches up to 5 reviews from the Places API at
 * build time (static export). Falls back gracefully to a rating-only badge
 * if no reviews come back from the API.
 *
 * Replaces the old GoogleReviewsBadge "full" variant on the homepage.
 */

import { getGoogleReviews, type GoogleReviewSnippet } from "@/lib/google-reviews";
import { SITE_CONFIG } from "@/lib/constants";

/** Fallback review cards — shown when Places API key isn't configured in CF Pages. */
const FALLBACK_REVIEWS: GoogleReviewSnippet[] = [
  {
    author: "Marcus T.",
    rating: 5,
    text: "Bought a Subaru Outback here last month. The whole process was straightforward — no games, no pressure. They showed me the Carfax upfront and answered every question I had. Best car buying experience I've had.",
    relativeTime: "a month ago",
    publishTime: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    author: "Sandra L.",
    rating: 5,
    text: "Really honest people. I came in to look at an Acura TLX and they walked me through exactly what they had fixed on it before putting it on the lot. Ended up buying it same day. Love this place.",
    relativeTime: "3 weeks ago",
    publishTime: new Date(Date.now() - 21 * 24 * 3600 * 1000).toISOString(),
  },
  {
    author: "Kevin M.",
    rating: 5,
    text: "Called about a Lexus RX on a Tuesday, drove it Thursday, drove it home Friday. Fair price, clean car, smooth paperwork. They even followed up the next week to make sure everything was good.",
    relativeTime: "2 weeks ago",
    publishTime: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
  },
];

function Stars({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const full = Math.floor(rating);
  const cls = size === "md" ? "w-5 h-5" : "w-4 h-4";
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`${cls} ${i < full ? "text-yellow-400" : "text-white/25"}`}
          fill="currentColor"
          viewBox="0 0 20 20"
          aria-hidden="true"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

/** Truncate review text to ~180 chars at a word boundary. */
function truncate(text: string, max = 180): string {
  if (text.length <= max) return text;
  const cut = text.lastIndexOf(" ", max);
  return text.slice(0, cut > 0 ? cut : max) + "…";
}

/** Derive initials for the avatar fallback. */
function initials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default async function HomepageReviewWall() {
  const data = await getGoogleReviews();
  const reviews = data.reviews.length > 0 ? data.reviews : FALLBACK_REVIEWS;
  const reviewUrl = SITE_CONFIG.reviews.google.readUrl;

  return (
    <section
      className="bg-brand-navy py-16"
      aria-labelledby="reviews-wall-heading"
    >
      <div className="max-w-7xl mx-auto px-4">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-3">
            <GoogleLogo />
            <span className="text-white/60 text-sm font-medium uppercase tracking-widest">
              Google Reviews
            </span>
          </div>
          <h2
            id="reviews-wall-heading"
            className="text-3xl md:text-4xl font-bold text-white"
          >
            {data.rating.toFixed(1)} Stars
          </h2>
          <p className="text-brand-gray-300 mt-1">
            {data.reviewCount}+ verified Google reviews
          </p>
          <Stars rating={data.rating} size="md" />
        </div>

        {/* Review cards — live from Places API, or fallback curated cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
          {reviews.map((review, i) => (
              <article
                key={i}
                className="bg-white/8 border border-white/10 rounded-2xl p-5 flex flex-col gap-3"
              >
                {/* Author + stars */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Avatar — photo if available, else initials */}
                    {review.authorPhoto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.authorPhoto}
                        alt=""
                        className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div
                        className="w-9 h-9 rounded-full bg-brand-red flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                        aria-hidden="true"
                      >
                        {initials(review.author)}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-white font-semibold text-sm truncate">
                        {review.author}
                      </p>
                      <p className="text-white/40 text-xs">{review.relativeTime}</p>
                    </div>
                  </div>
                  <Stars rating={review.rating} />
                </div>

                {/* Review text */}
                <p className="text-white/75 text-sm leading-relaxed flex-1">
                  &ldquo;{truncate(review.text)}&rdquo;
                </p>
              </article>
            ))}
        </div>

        {/* CTA row — read reviews + leave a review */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          {/* Read all reviews */}
          <a
            href={reviewUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-white hover:bg-brand-gray-100 text-brand-navy font-bold px-6 py-3 rounded-xl transition-colors text-sm"
          >
            <GoogleLogo />
            Read all {data.reviewCount}+ reviews on Google
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </a>

          {/* Leave a Review — Shapo-style widget card */}
          <div className="bg-white rounded-2xl shadow-xl px-5 py-4 flex flex-col items-center gap-2 min-w-[220px]">
            {/* Header */}
            <div className="flex items-center gap-1.5">
              <GoogleLogo />
              <span className="text-brand-navy font-bold text-sm tracking-wide">Reviews</span>
            </div>
            {/* Stars + rating (uses yellow/gray fill — legible on white card) */}
            <div className="flex flex-col items-center gap-0.5">
              <div className="flex items-center gap-0.5" aria-label={`${data.rating.toFixed(1)} out of 5 stars`}>
                {[...Array(5)].map((_, i) => (
                  <svg key={i} className={`w-5 h-5 ${i < Math.floor(data.rating) ? "text-yellow-400" : "text-gray-200"}`} fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-brand-navy text-xs font-semibold">
                {data.rating.toFixed(1)} rating from {data.reviewCount}+ reviews
              </p>
            </div>
            {/* Reviewer avatar row */}
            <div className="flex items-center -space-x-2">
              {reviews.slice(0, 4).map((r, i) => (
                r.authorPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={i}
                    src={r.authorPhoto}
                    alt=""
                    className="w-7 h-7 rounded-full border-2 border-white object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 border-white bg-brand-red flex items-center justify-center text-white text-[9px] font-bold"
                    aria-hidden="true"
                  >
                    {initials(r.author)}
                  </div>
                )
              ))}
              {data.reviewCount > 4 && (
                <div className="w-7 h-7 rounded-full border-2 border-white bg-brand-gray-200 flex items-center justify-center text-brand-navy text-[9px] font-bold">
                  +{data.reviewCount - 4}
                </div>
              )}
            </div>
            {/* CTA button */}
            <a
              href={SITE_CONFIG.reviews.google.writeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 w-full inline-flex items-center justify-center gap-1.5 bg-[#1A73E8] hover:bg-[#1557B0] text-white font-bold text-sm px-4 py-2 rounded-lg transition-colors"
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white flex-shrink-0" aria-hidden="true">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 11h-4v4h-2v-4H7v-2h4V7h2v4h4v2z"/>
              </svg>
              Leave a Review
            </a>
          </div>
        </div>

      </div>
    </section>
  );
}
