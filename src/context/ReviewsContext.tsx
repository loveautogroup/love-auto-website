"use client";

import { createContext, useContext } from "react";

export interface GoogleReviews {
  rating: number;
  reviewCount: number;
}

const ReviewsContext = createContext<GoogleReviews>({ rating: 4.7, reviewCount: 127 });

export function ReviewsProvider({
  value,
  children,
}: {
  value: GoogleReviews;
  children: React.ReactNode;
}) {
  return (
    <ReviewsContext.Provider value={value}>{children}</ReviewsContext.Provider>
  );
}

export function useReviews(): GoogleReviews {
  return useContext(ReviewsContext);
}
