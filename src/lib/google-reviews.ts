/**
 * Server-side Google review data fetcher.
 *
 * Uses Next.js unstable_cache (1-hour revalidation) so the site serves
 * live review data without a full rebuild. Falls back to static values
 * if Railway is unreachable.
 */
import { unstable_cache } from "next/cache";

const RAILWAY_BASE = "https://web-production-d5f3a.up.railway.app";

export interface GoogleReviewSnippet {
  author: string;
  authorPhoto?: string;
  rating: number;
  text: string;
  relativeTime: string;
  publishTime?: string;
}

export interface GoogleReviewsData {
  rating: number;
  reviewCount: number;
  reviews: GoogleReviewSnippet[];
}

const FALLBACK: GoogleReviewsData = {
  rating: 4.7,
  reviewCount: 129,
  reviews: [],
};

async function _fetchGoogleReviews(): Promise<GoogleReviewsData> {
  try {
    // Fetch aggregate (rating + count) and recent reviews in parallel
    const [summaryRes, reviewsRes] = await Promise.all([
      fetch(`${RAILWAY_BASE}/api/v1/public/reputation/summary`, {
        next: { revalidate: 3600 },
        headers: { Accept: "application/json" },
      }),
      fetch(
        `${RAILWAY_BASE}/api/v1/public/reputation/reviews?platform=Google&limit=5`,
        {
          next: { revalidate: 3600 },
          headers: { Accept: "application/json" },
        }
      ).catch(() => null), // reviews are non-critical
    ]);

    if (!summaryRes.ok) return FALLBACK;

    const summary = await summaryRes.json() as {
      platforms?: { platform: string; star_avg: number; review_count: number }[];
    };
    const google = summary.platforms?.find((p) => p.platform === "Google");
    if (!google || !google.review_count) return FALLBACK;

    const rating = Math.round(google.star_avg * 10) / 10;
    const reviewCount = google.review_count;

    let reviews: GoogleReviewSnippet[] = [];
    if (reviewsRes?.ok) {
      const rawReviews = await reviewsRes.json() as {
        author: string;
        stars: number;
        body: string;
        review_date: string;
      }[];
      reviews = rawReviews.map((r) => ({
        author: r.author,
        rating: r.stars,
        text: r.body,
        relativeTime: _relativeTime(r.review_date),
      }));
    }

    return { rating, reviewCount, reviews };
  } catch {
    return FALLBACK;
  }
}

function _relativeTime(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
    }
    const months = Math.floor(diffDays / 30);
    if (months < 12) return `${months} month${months !== 1 ? "s" : ""} ago`;
    const years = Math.floor(months / 12);
    return `${years} year${years !== 1 ? "s" : ""} ago`;
  } catch {
    return "";
  }
}

export const getGoogleReviews = unstable_cache(
  _fetchGoogleReviews,
  ["google-reviews"],
  { revalidate: 3600, tags: ["google-reviews"] }
);
