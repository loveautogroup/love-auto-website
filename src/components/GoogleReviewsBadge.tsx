import { getGoogleReviews } from "@/lib/google-reviews";
import { SITE_CONFIG } from "@/lib/constants";

interface Props {
  /** "full" = large homepage badge, "compact" = small footer link */
  variant?: "full" | "compact";
}

function GoogleIcon({ size = 40 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function Stars({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalf = rating - fullStars >= 0.25;

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          className={`w-5 h-5 ${
            i < fullStars
              ? "text-yellow-400"
              : i === fullStars && hasHalf
                ? "text-yellow-400"
                : "text-gray-300"
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

export default async function GoogleReviewsBadge({
  variant = "full",
}: Props) {
  const reviews = await getGoogleReviews();

  if (variant === "compact") {
    return (
      <a
        href={SITE_CONFIG.reviews.google.readUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 text-brand-gray-200 hover:text-white transition-colors mt-4 pt-4 border-t border-white/10"
      >
        <GoogleIcon size={16} />
        <span className="flex items-center gap-1">
          <span className="text-yellow-400">&#9733;&#9733;&#9733;&#9733;&#9733;</span>
          <span className="text-xs">
            {reviews.rating} ({reviews.reviewCount} reviews)
          </span>
        </span>
      </a>
    );
  }

  // Full badge (homepage)
  return (
    <section
      className="bg-brand-gray-50 py-12"
      aria-labelledby="reviews-heading"
    >
      <div className="max-w-3xl mx-auto px-4 text-center">
        <a
          href={SITE_CONFIG.reviews.google.readUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex flex-col sm:flex-row items-center gap-4 sm:gap-6 bg-white rounded-2xl border border-brand-gray-200 px-8 py-6 shadow-sm hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center gap-3">
            <GoogleIcon size={40} />
            <div className="text-left">
              <p
                id="reviews-heading"
                className="text-sm font-semibold text-brand-gray-900"
              >
                Google Reviews
              </p>
              <div className="flex items-center gap-1 mt-0.5">
                <Stars rating={reviews.rating} />
                <span className="ml-1 text-sm font-bold text-brand-gray-900">
                  {reviews.rating}
                </span>
              </div>
            </div>
          </div>

          <div className="hidden sm:block w-px h-12 bg-brand-gray-200" />

          <p className="text-sm text-brand-gray-500 group-hover:text-brand-red transition-colors">
            Read our {reviews.reviewCount} reviews on Google
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="inline w-4 h-4 ml-1"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
              />
            </svg>
          </p>
        </a>
        <p className="mt-3 text-xs text-brand-gray-400">
          Rated {reviews.rating} out of 5 stars based on{" "}
          {reviews.reviewCount} reviews
        </p>
      </div>
    </section>
  );
}
