"use client";

import { useState } from "react";
import Image from "next/image";
import { Vehicle } from "@/lib/types";
import { SITE_CONFIG } from "@/lib/constants";
import { useResolveOverlay } from "@/data/useMerchandising";
import { applyPhotoOrder } from "@/data/photoOrder";
import {
  CarfaxBadge,
  CarfaxPillStack,
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
 * VDP photo gallery — full-width hero layout.
 *
 * Hero photo spans the full gallery width with the Maxim-style badge
 * overlay (CARFAX, feature pills, warranty, phone CTA, dealer + Google).
 * Below the hero sits a horizontal scrollable thumbnail strip — every
 * photo in the manifest, click any to swap it into the hero. Last tile
 * carries a "+N more photos" badge when total exceeds visible count.
 *
 * Why this layout: hero needs to dominate the page so the vehicle and
 * its overlay get full visual weight; horizontal strip is a single
 * navigator that scales naturally to any photo count.
 */
const COMING_SOON_PLACEHOLDER = "/images/coming-soon.png";

export default function PhotoGallery({ images: rawImages, alt, vehicle }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  // Tracks if the active hero photo errored on load. When true, we
  // swap to the branded "Coming Soon" placeholder so a 404 / dead
  // CDN URL never leaves an empty gray box on the VDP.
  const [erroredSrcs, setErroredSrcs] = useState<Set<string>>(new Set());

  // Jordan-authored manifest reorders photos: exterior front-3/4 first,
  // then remaining exteriors, then interior, then details. Vehicles
  // without a manifest entry fall through unchanged.
  const hasRealPhotos = rawImages.length > 0 && !rawImages[0]?.includes("placeholder");
  const images = hasRealPhotos && vehicle
    ? applyPhotoOrder(vehicle.slug, rawImages)
    : rawImages;
  const photoCount = hasRealPhotos ? images.length : 8;

  // Runtime hook always called (rules of hooks) — vehicle-conditional render
  // happens at the JSX level via showBadges. Empty fallback values mean
  // hook returns harmlessly when no vehicle is in scope.
  const overlayLive = useResolveOverlay(
    vehicle?.vin ?? "",
    vehicle?.daysOnLot ?? 0,
    vehicle?.status ?? "available",
    vehicle?.recentlyReduced ?? false
  );
  const overlay = vehicle ? overlayLive : null;
  const showBadges = vehicle && selectedIndex === 0;
  // Per-vehicle Coming Soon placeholder toggle from the DMS merchandising
  // panel. When true, the hero photo is the branded placeholder regardless
  // of whether real photos exist for the vehicle.
  const forcePlaceholder = overlay?.useComingSoonPlaceholder === true;
  // Warranty is opt-in per vehicle. Vehicles sold as-is have no warranty
  // string set, in which case the warranty badge does not render.
  const warrantyCopy = overlay?.warranty;

  // Last visible thumbnail in the strip carries a "+N more photos"
  // badge when total photos exceed the 5 we treat as visible above the
  // fold. Strip itself is scrollable so all photos are reachable.
  const remaining = Math.max(0, photoCount - 5);

  return (
    <div className="space-y-3">
      {/* Full-width hero photo */}
      <div>
        {/* Primary hero image */}
        <div className="relative aspect-[3/2] bg-brand-gray-100 rounded-xl overflow-hidden">
          {(hasRealPhotos || forcePlaceholder) ? (
            (() => {
              const rawHero = hasRealPhotos ? images[selectedIndex] : COMING_SOON_PLACEHOLDER;
              // forcePlaceholder is computed at the component scope above
              // (mirrors the per-vehicle DMS merchandising toggle).
              const heroSrc = forcePlaceholder
                ? COMING_SOON_PLACEHOLDER
                : erroredSrcs.has(rawHero)
                  ? COMING_SOON_PLACEHOLDER
                  : rawHero;
              return (
                <Image
                  src={heroSrc}
                  alt={`${alt} for sale in Villa Park, IL — Photo ${selectedIndex + 1} of ${photoCount}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 60vw"
                  priority={selectedIndex === 0}
                  unoptimized
                  onError={() => {
                    setErroredSrcs((prev) => {
                      if (prev.has(rawHero)) return prev;
                      const next = new Set(prev);
                      next.add(rawHero);
                      return next;
                    });
                  }}
                />
              );
            })()
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

              {/* Top-left column: every merchandising signal that lives
                  in the left corner — read top-down:
                    1. CARFAX shield (always; every LAG vehicle ships
                       with a free Carfax, no per-vehicle opt-out)
                    2. CarfaxPillStack (1-Owner / No Accidents /
                       Service Records — only active flags render)
                    3. StatusPill (Hot Deal, Just Arrived, etc. — only
                       when Jordan has set one in the merch panel)
                  Inner div wraps the shield because we only scale down
                  the shield on mobile, not the pills below it. */}
              <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex flex-col items-start gap-1.5">
                <div className="[&_>*]:scale-[0.55] sm:[&_>*]:scale-[0.65] [&_>*]:origin-top-left">
                  <CarfaxBadge vin={vehicle.vin} />
                </div>
                <CarfaxPillStack overlay={overlay} />
                {overlay.effectiveStatus && (
                  <StatusPill kind={overlay.effectiveStatus} />
                )}
              </div>

              {/* Top-right column: regular feature pills (1-5 slots) —
                  AWD, Heated Leather, etc. Right-aligned so they hug
                  the photo's right edge, separate visual block from
                  the trust-signal Carfax/status cluster on the left. */}
              <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex flex-col items-end gap-1.5">
                <FeaturePillCluster pills={overlay.featurePills} stack="inline" />
              </div>

              {/* Bottom-left: phone CTA (anchored left so the dealer
                  cluster on the right has room to breathe). Compact on
                  mobile to avoid eating the photo bottom edge. */}
              <div className="absolute bottom-3 left-3 z-10 md:hidden">
                <PhoneCTA
                  phone={SITE_CONFIG.phone}
                  phoneRaw={SITE_CONFIG.phoneRaw}
                  compact
                />
              </div>
              <div className="absolute bottom-4 left-4 z-10 hidden md:block">
                <PhoneCTA
                  phone={SITE_CONFIG.phone}
                  phoneRaw={SITE_CONFIG.phoneRaw}
                />
              </div>

              {/* Bottom-right: warranty (if set) stacked above dealer +
                  Google. Warranty is a VDP-level signal — it shows here
                  on the gallery photo and only when Jordan has set a
                  warranty string for this VIN. Vehicles sold as-is
                  render no warranty pill anywhere. */}
              <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1.5">
                {warrantyCopy && (
                  <WarrantyBadge copy={warrantyCopy} compact />
                )}
                <DealerCluster
                  rating={SITE_CONFIG.reviews.google.rating}
                  reviewCount={SITE_CONFIG.reviews.google.count}
                  reviewsUrl={SITE_CONFIG.reviews.google.readUrl}
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

      </div>

      {/* Horizontal scrollable thumbnail strip — every photo, click to
          swap into the hero. Last tile carries the "+N more" badge when
          remaining > 0. Single navigator replaces the prior split
          (right-side grid + bottom strip) so the hero gets the full
          gallery width. */}
      <div className="flex gap-2 overflow-x-auto pb-2 mt-3">
        {Array.from({ length: photoCount }).map((_, i) => {
          const isLastVisible = i === photoCount - 1;
          const showMoreOverlay = isLastVisible && remaining > 0;
          return (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`relative flex-shrink-0 w-[150px] aspect-[4/3] bg-brand-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                selectedIndex === i
                  ? "border-brand-red ring-1 ring-brand-red"
                  : "border-transparent hover:border-brand-gray-300"
              }`}
              aria-label={
                showMoreOverlay
                  ? `View all ${photoCount} photos`
                  : `View photo ${i + 1}`
              }
            >
              {hasRealPhotos && images[i] ? (
                <Image
                  src={images[i]}
                  alt={`${alt} — view ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes="150px"
                  unoptimized
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
  );
}
