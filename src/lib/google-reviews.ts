/**
 * Build-time Google review data fetcher.
 *
 * ⚠️ This runs ONLY at build time. The header used to claim the 1-hour
 * revalidation below meant "the site serves live review data without a
 * full rebuild" — it does not. This site is `output: "export"` (see
 * next.config.ts), so there is no server at runtime: unstable_cache and
 * `next: { revalidate }` are honored during the build and then the result
 * is frozen into static HTML. Review rating and count are therefore as
 * old as the last Cloudflare Pages deploy, however long ago that was.
 *
 * That's acceptable — ratings move slowly — but don't read the caching
 * hints as a freshness guarantee. Making these genuinely live would mean
 * fetching client-side after hydration, the way useMerchandising() already
 * does for overlays; that's a product decision, not a bug fix.
 *
 * Falls back to static values if Railway is unreachable.
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

    if (!summaryRes.ok) {
      console.warn(
        `[google-reviews] reputation summary returned ${summaryRes.status} — ` +
          `building with fallback rating ${FALLBACK.rating}/${FALLBACK.reviewCount} reviews.`
      );
      return FALLBACK;
    }

    const summary = await summaryRes.json() as {
      platforms?: { platform: string; star_avg: number; review_count: number }[];
    };
    const google = summary.platforms?.find((p) => p.platform === "Google");
    if (!google || !google.review_count) {
      console.warn(
        "[google-reviews] no Google platform row (or zero reviews) in the " +
          "reputation summary — building with fallback values."
      );
      return FALLBACK;
    }

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
  } catch (err) {
    // Previously a bare `catch {}`. A build could silently ship stale
    // fallback numbers site-wide with nothing in the log to explain why —
    // the same "nobody ever saw it" failure mode dmsInventory.ts was
    // hardened against.
    console.error("[google-reviews] fetch failed, using fallback values:", err);
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
