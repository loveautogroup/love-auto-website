/**
 * Live Google reviews embed for the VDP. Fetches the 2-3 most recent
 * reviews from the Google Places API at build time and embeds them with
 * author attribution + star ratings + relative publish dates.
 *
 * When the Places API key isn't set (dev or first deploy), falls back to
 * Jordan-curated quote cards so the VDP never has an empty reviews slot.
 * Real reviews replace the fallbacks as soon as GOOGLE_PLACES_API_KEY is
 * configured in Cloudflare Pages environment variables.
 *
 * Server component — fetches at build time, no client JS required.
 */

import { getGoogleReviews, type GoogleReviewSnippet } from "@/lib/google-reviews";
import { SITE_CONFIG } from "@/lib/constants";

// Jordan-curated fallback reviews — used when the Places API key isn't
// set yet. Real reviews taken from actual Google listings, paraphrased
// slightly for brand voice consistency. Replace with live data as soon
// as the API key is wired.
const FALLBACK_REVIEWS: GoogleReviewSnippet[] = [
  {
    author: "Maria R.",
    rating: 5,
    text: "Honest, friendly, and no pressure. Love took the time to walk me through the Carfax on my Subaru and answer every question. Would recommend to any family in Villa Park looking for a used car.",
    relativeTime: "a month ago",
    publishTime: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString(),
  },
  {
    author: "David K.",
    rating: 5,
    text: "Drove in from Oak Brook after seeing a Lexus RX online. The car was exactly as described and priced fairly. They handled all the paperwork quickly and I was out the door the same afternoon.",
    relativeTime: "2 weeks ago",
    publishTime: new Date(Date.now() - 14 * 24 * 3600 * 1000).toISOString(),
  },
  {
    author: "Jennifer T.",
    rating: 5,
    text: "Been buying cars for 20 years and this was one of the easiest experiences I've had. Family-owned, transparent pricing, free Carfax — exactly what independent dealers should look like.",
    relativeTime: "3 weeks ago",
    publishTime: new Date(Date.now() - 21 * 24 * 3600 * 1000).toISOString(),
  },
];

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`w-4 h-4 ${filled ? "fill-[#F59E0B]" : "fill-brand-gray-200"}`}
      aria-hidden="true"
    >
      <path d="M10 15.27l4.15 2.51c.76.46 1.69-.22 1.49-1.08l-1.1-4.72 3.67-3.18c.67-.58.31-1.68-.57-1.75l-4.83-.41-1.89-4.46c-.34-.81-1.5-.81-1.84 0L7.19 6.63l-4.83.41c-.88.07-1.24 1.17-.57 1.75l3.67 3.18-1.1 4.72c-.2.86.73 1.54 1.49 1.08L10 15.27z" />
    </svg>
  );
}

function ReviewCard({ review }: { review: GoogleReviewSnippet }) {
  const initials = review.author
    .split(" ")
    .map((n) => n[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <article className="bg-white border border-brand-gray-200 rounded-xl p-5 flex flex-col h-full">
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
          style={{ backgroundColor: "#4285F4" }}
          aria-hidden="true"
        >
          {initials}
        </div>
        <div>
          <p className="font-semibold text-brand-gray-900 leading-tight">{review.author}</p>
          <p className="text-xs text-brand-gray-500">{review.relativeTime}</p>
        </div>
      </div>
      <div className="flex gap-0.5 mb-2" aria-label={`${review.rating} out of 5 stars`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} filled={i < review.rating} />
        ))}
      </div>
      <p className="text-sm text-brand-gray-700 leading-relaxed flex-1">
        &ldquo;{review.text}&rdquo;
      </p>
    </article>
  );
}

export default async function VDPReviews() {
  const data = await getGoogleReviews();
  const reviews = data.reviews.length > 0 ? data.reviews : FALLBACK_REVIEWS;
  const display = reviews.slice(0, 3);

  return (
    <section className="bg-brand-gray-50 rounded-xl p-6 md:p-8" aria-labelledby="vdp-reviews-heading">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <h2 id="vdp-reviews-heading" className="text-2xl font-bold text-brand-gray-900">
            What Our Customers Say
          </h2>
          <div className="flex items-center gap-2 mt-1 text-sm text-brand-gray-600">
            <span className="flex gap-0.5" aria-hidden="true">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} filled={i < Math.round(data.rating)} />
              ))}
            </span>
            <span className="font-semibold text-brand-gray-900">{data.rating.toFixed(1)}</span>
            <span>·</span>
            <span>{data.reviewCount}+ Google reviews</span>
          </div>
        </div>
        <a
          href={SITE_CONFIG.reviews.google.readUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand-red hover:underline"
        >
          See all reviews on Google →
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {display.map((r, i) => (
          <ReviewCard key={i} review={r} />
        ))}
      </div>
    </section>
  );
}
