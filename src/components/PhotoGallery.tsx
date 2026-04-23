"use client";

import { useState } from "react";
import { Vehicle } from "@/lib/types";
import { SITE_CONFIG } from "@/lib/constants";
import { MERCHANDISING, resolveOverlay } from "@/data/merchandising";
import {
  CarfaxBadge,
  DealerCluster,
  FeaturePillCluster,
  PhoneCTA,
  PhotoScrim,
  StatusPill,
  WarrantyBadge,
} from "./badges";

interface PhotoGalleryProps {
  images: string[];
  alt: string;
  /** Optional — when provided, the main hero photo gets the full overlay system. */
  vehicle?: Vehicle;
}

/**
 * VDP photo gallery — Maxim-style layout.
 *
 * Big hero photo on the left (60% width) with the full Maxim-style badge
 * overlay (CARFAX, feature pills, warranty, phone CTA, dealer + Google).
 * 2x2 thumbnail grid on the right (40% width). The 4th thumbnail in the
 * grid carries a "+N more photos" overlay when the vehicle has more than
 * 5 photos. Below the gallery, a horizontal strip for full navigation.
 *
 * Why this layout: hero photo is large enough to showcase the vehicle and
 * carry the dense overlay; right-side grid gives shoppers a multi-angle
 * preview without making them click through every photo.
 */
export default function PhotoGallery({ images, alt, vehicle }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const hasRealPhotos = images.length > 0 && !images[0]?.includes("placeholder");
  const photoCount = hasRealPhotos ? images.length : 8;

  // Resolve overlay only if vehicle is supplied AND we're on the first photo.
  const overlay = vehicle
    ? resolveOverlay(vehicle.vin, vehicle.daysOnLot, vehicle.status)
    : null;
  const showBadges = vehicle && selectedIndex === 0;
  const showCarfax = overlay?.carfax === true;
  const warrantyCopy = overlay?.warrantyOverride ?? MERCHANDISING.defaultWarranty;

  // Right-side grid shows photos at indexes 1, 2, 3, 4 (the 4 right after
  // the hero). The 4th tile gets a "+N more photos" overlay if there are
  // more than 5 total.
  const gridIndexes = [1, 2, 3, 4];
  const remaining = Math.max(0, photoCount - 5);

  return (
    <div className="space-y-3">
      {/* Big hero on left + 2x2 thumb grid on right */}
      <div className="grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-2">
        {/* Primary hero image */}
        <div className="relative aspect-[3/2] bg-brand-gray-100 rounded-xl overflow-hidden">
          {hasRealPhotos ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={images[selectedIndex]}
              alt={`${alt} — Photo ${selectedIndex + 1}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-brand-gray-300">
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-16 h-16 mx-auto mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="font-medium text-sm">Vehicle Photos</p>
                <p className="text-xs">Synced from Dealer Center</p>
              </div>
            </div>
          )}

          {/* Full Maxim-style badge overlay — VDP main photo only */}
          {showBadges && vehicle && overlay && (
            <>
              <PhotoScrim />

              {/* Top-left: CARFAX or status */}
              <div className="absolute top-3 left-3 z-10">
                {showCarfax ? (
                  <CarfaxBadge vin={vehicle.vin} />
                ) : overlay.effectiveStatus ? (
                  <StatusPill kind={overlay.effectiveStatus} />
                ) : null}
              </div>

              {/* Top-center: feature pills */}
              <FeaturePillCluster pills={overlay.featurePills} />

              {/* Bottom-left: warranty (compact so the phone CTA in the
                  bottom-center doesn't get squeezed off-screen) */}
              <div className="absolute bottom-3 left-3 z-10">
                <WarrantyBadge copy={warrantyCopy} compact />
              </div>

              {/* Bottom-center: phone CTA */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10">
                <PhoneCTA
                  phone={SITE_CONFIG.phone}
                  phoneRaw={SITE_CONFIG.phoneRaw}
                />
              </div>

              {/* Bottom-right: dealer + Google (compact so the phone CTA
                  in bottom-center doesn't get squeezed off-screen) */}
              <div className="absolute bottom-3 right-3 z-10">
                <DealerCluster
                  rating={SITE_CONFIG.reviews.google.rating}
                  reviewCount={SITE_CONFIG.reviews.google.count}
                  compact
                />
              </div>
            </>
          )}

          {/* Photo counter — bottom-left when no overlay, top-right otherwise */}
          {!showBadges && (
            <span className="absolute bottom-3 left-3 bg-black/70 text-white text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1">
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                <circle cx="12" cy="13" r="3" />
              </svg>
              {photoCount} photos · Click to view all
            </span>
          )}
        </div>

        {/* Right-side 2x2 thumbnail grid */}
        <div className="hidden md:grid grid-cols-2 grid-rows-2 gap-2">
          {gridIndexes.map((thumbIndex, gridPos) => {
            const isLastTile = gridPos === 3;
            const showMoreOverlay = isLastTile && remaining > 0;
            return (
              <button
                key={thumbIndex}
                onClick={() => setSelectedIndex(thumbIndex)}
                className={`relative aspect-[4/3] bg-brand-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedIndex === thumbIndex
                    ? "border-brand-red ring-1 ring-brand-red"
                    : "border-transparent hover:border-brand-gray-300"
                }`}
                aria-label={
                  showMoreOverlay
                    ? `View all ${photoCount} photos`
                    : `View photo ${thumbIndex + 1}`
                }
              >
                {hasRealPhotos && images[thumbIndex] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={images[thumbIndex]}
                    alt={`${alt} — Thumbnail ${thumbIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-brand-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
                {showMoreOverlay && (
                  <div className="absolute inset-0 bg-black/65 flex items-center justify-center text-white">
                    <div className="text-center">
                      <div className="text-2xl font-extrabold leading-none">+{remaining}</div>
                      <div className="text-[11px] font-semibold mt-0.5">more photos</div>
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Horizontal thumbnail strip — full navigation, all viewports */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {Array.from({ length: photoCount }).map((_, i) => (
          <button
            key={i}
            onClick={() => setSelectedIndex(i)}
            className={`relative aspect-[4/3] w-20 md:w-24 bg-brand-gray-100 rounded-lg shrink-0 overflow-hidden border-2 transition-all ${
              selectedIndex === i
                ? "border-brand-red ring-1 ring-brand-red"
                : "border-transparent hover:border-brand-gray-300"
            }`}
            aria-label={`View photo ${i + 1}`}
          >
            {hasRealPhotos && images[i] ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={images[i]}
                alt={`${alt} — Thumbnail ${i + 1}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-brand-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
