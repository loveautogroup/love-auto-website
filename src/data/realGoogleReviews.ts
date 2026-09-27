/**
 * Real Google reviews, copied word for word from the Love Auto Group Google
 * Business Profile (spelling and punctuation left exactly as written).
 * Shown only when the build cannot reach the Places API, so a review slot is
 * never empty. Never add a made-up or paraphrased review here: a review we
 * did not receive is a fake review (FTC 16 CFR 465).
 */
import type { GoogleReviewSnippet } from "@/lib/google-reviews";

function review(author: string, date: string, text: string): GoogleReviewSnippet {
  const d = new Date(`${date}T12:00:00Z`);
  return {
    author,
    rating: 5,
    text,
    relativeTime: d.toLocaleDateString("en-US", { month: "short", year: "numeric", timeZone: "America/Chicago" }),
    publishTime: d.toISOString(),
  };
}

export const REAL_GOOGLE_REVIEWS: GoogleReviewSnippet[] = [
  review("Tony S.", "2026-09-26", "Very honest, considerate, knowledgeable on cars, professional, and patient , great dealer , highly recommended"),
  review("Vincent C.", "2026-09-26", "Really great service and the whole process was very smooth as well. Jerimiah was so helpful and i’m glad to say that Love Auto helped me take home my very first car. I would 1000% recommend them to anyone!"),
  review("Abel J.", "2026-09-07", "Great service, owner came through and addressed all problems I had . Don't hesitate. The Lincoln runs great!"),
  review("Todd K.", "2026-08-03", "Jeremiah at Love Auto Group made my car purchase a delightful breeze. He went above and beyond to offer a fair price matched while exceeding my expectations for taking care of important details to finalize the sale. I’m keeping Jeremiah’s number in my phone for future car purchases"),
  review("Eric L.", "2026-07-21", "I had a great experience at Love Auto Group. Jeremiah was honest, friendly, and easy to work with. He explained everything clearly, and there were no surprises. The price was fair, and everything was done on time. I will definitely come back to this dealership again. I highly recommend Love Auto Group. Thank you, Jeremiah!"),
  review("Andy G.", "2025-07-24", "Jeremiah was a great and honest guy throughout the whole process. Would come back next time I’m in the market."),
];
