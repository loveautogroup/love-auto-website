/**
 * Fetches live Google review data (rating, count, latest reviews) from
 * the Places API (New).
 *
 * Required environment variables:
 *   GOOGLE_PLACES_API_KEY — Google Cloud API key with Places API enabled
 *   GOOGLE_PLACE_ID       — Place ID for Love Auto Group
 *
 * On static export (`output: "export"`), fetches run at build time — each
 * Cloudflare rebuild refreshes the embedded reviews, which is fine for a
 * dealership that doesn't accumulate dozens of new reviews per day.
 *
 * Sam's note: the Places API key must be restricted by referrer or IP in
 * Google Cloud Console to prevent abuse. Same key should NOT be checked
 * into the repo — set via Cloudflare Pages environment variables.
 */

export interface GoogleReviewSnippet {
  author: string;
  /** Author profile photo URL, if available */
  authorPhoto?: string;
  /** 1-5 */
  rating: number;
  /** Review body text */
  text: string;
  /** Relative time description ("a week ago") */
  relativeTime: string;
  /** ISO publish time, useful for structured data */
  publishTime: string;
}

export interface GoogleReviewData {
  rating: number;
  reviewCount: number;
  /** Up to 5 recent reviews from the Places API. Empty array on fallback. */
  reviews: GoogleReviewSnippet[];
  updatedAt: string;
}

const FALLBACK: GoogleReviewData = {
  rating: 4.7,
  reviewCount: 125,
  reviews: [],
  updatedAt: new Date().toISOString(),
};

interface PlacesApiResponse {
  rating?: number;
  userRatingCount?: number;
  reviews?: Array<{
    rating?: number;
    text?: { text?: string };
    relativePublishTimeDescription?: string;
    publishTime?: string;
    authorAttribution?: {
      displayName?: string;
      photoUri?: string;
    };
  }>;
}

export async function getGoogleReviews(): Promise<GoogleReviewData> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = process.env.GOOGLE_PLACE_ID;

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
        "X-Goog-FieldMask": "rating,userRatingCount,reviews",
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error(
        `[google-reviews] Places API error ${res.status}: ${errorText}`
      );
      return FALLBACK;
    }

    const data = (await res.json()) as PlacesApiResponse;

    const reviews: GoogleReviewSnippet[] =
      (data.reviews ?? [])
        .filter((r) => r.text?.text && r.authorAttribution?.displayName)
        .map((r) => ({
          author: r.authorAttribution!.displayName!,
          authorPhoto: r.authorAttribution?.photoUri,
          rating: r.rating ?? 5,
          text: r.text!.text!,
          relativeTime: r.relativePublishTimeDescription ?? "",
          publishTime: r.publishTime ?? new Date().toISOString(),
        }));

    return {
      rating: data.rating ?? FALLBACK.rating,
      reviewCount: data.userRatingCount ?? FALLBACK.reviewCount,
      reviews,
      updatedAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error("[google-reviews] Failed to fetch:", error);
    return FALLBACK;
  }
}
