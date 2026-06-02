"use client";

import { useLanguage } from "@/context/LanguageContext";
import { GoogleReviewsLockup } from "@/components/badges/DealerCluster";
import { SITE_CONFIG } from "@/lib/constants";
import { useReviews } from "@/context/ReviewsContext";

export default function InventoryHero() {
  const googleReviews = useReviews();
  const { t } = useLanguage();
  const inv = t.inventory;
  return (
    <section className="bg-brand-navy text-white py-10">
      <div className="max-w-7xl mx-auto px-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold">{inv.heading}</h1>
          <p className="mt-2 text-brand-gray-300">{inv.subheading}</p>
        </div>
        <GoogleReviewsLockup
          rating={googleReviews.rating}
          reviewCount={googleReviews.reviewCount}
          reviewsUrl={SITE_CONFIG.reviews.google.readUrl}
        />
      </div>
    </section>
  );
}
