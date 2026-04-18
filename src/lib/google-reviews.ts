/**
 * Fetches live Google review data (rating + count) from the Places API (New).
 *
 * Required environment variables:
 *   GOOGLE_PLACES_API_KEY  — Your Google Cloud API key with Places API enabled
 *   GOOGLE_PLACE_ID        — The Place ID for Love Auto Group
 *
 * The result is cached via Next.js ISR and revalidated every hour so the
 * numbers stay current without burning API quota on every page view.
 */

export interface GoogleReviewData {
  rating: number;
  reviewCount: number;
  updatedAt: string; // ISO timestamp of last successful fetch
}

// Fallback values shown when the API key isn't configured yet
const FALLBACK: GoogleReviewData = {
  rating: 4.7,
  reviewCount: 125,
  updatedAt: new Date().toISOString(),
};

export async function getGoogleReviews(): Promise<GoogleReviewData> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

  // If env vars aren't set, return fallback silently (dev / first deploy)
  if (!apiKey || !placeId) {
    console.warn(
      "[google-reviews] GOOGLE_PLACES_API_KEY or GOOGLE_PLACE_ID not set. Using fallback values."
    );
    return FALLBACK;
  }

  try {
    const url = `https://places.googleapis.com/v1/places/${placeId}`;

    const res = await fetch(url, {
      headers: {
        "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask": "rating,userRatingCount",
      },
      // Revalidate every hour — keeps the count fresh without excessive API calls
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        `[google-reviews] Places API error ${res.status}: ${errorText}`
      );
      return FALLBACK;
    }

    const data = await res.json();

    return {
      rating: data.rating ?? FALLBACK.rating,
      reviewCount: data.userRatingCount ?? FALLBACK.reviewCount,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[google-reviews] Failed to fetch:", error);
    return FALLBACK;
  }
}
