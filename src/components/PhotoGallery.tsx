"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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

const COMING_SOON_PLACEHOLDER = "/images/coming-soon.png";

// ─────────────────────────────────────────────────────────────────────────────
// Lightbox — full-screen photo viewer, mobile-first with swipe support
// ─────────────────────────────────────────────────────────────────────────────

interface LightboxProps {
  images: string[];
  alt: string;
  initialIndex: number;
  onClose: () => void;
}

function Lightbox({ images, alt, initialIndex, onClose }: LightboxProps) {
  const [idx, setIdx] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const count = images.length;

  const prev = useCallback(() => setIdx((i) => (i - 1 + count) % count), [count]);
  const next = useCallback(() => setIdx((i) => (i + 1) % count), [count]);

  // Keyboard nav + body scroll lock
  useEffect(() => {
    const saved = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = saved;
      document.removeEventListener("keydown", handler);
    };
  }, [onClose, prev, next]);

  // Sync index if parent re-opens at a different photo
  useEffect(() => setIdx(initialIndex), [initialIndex]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const delta = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(delta) > 50) delta < 0 ? next() : prev();
    touchStartX.current = null;
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col select-none"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Top bar: counter + close */}
      <div className="flex items-center justify-between px-4 py-3 flex-shrink-0">
        <span className="text-white/70 text-sm font-medium">
          {idx + 1} / {count}
        </span>
        <button
          onClick={onClose}
          aria-label="Close photo viewer"
          className="text-white/80 hover:text-white p-2 -mr-2 rounded-full transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M18.3 5.71a1 1 0 00-1.41 0L12 10.59 7.11 5.7A1 1 0 005.7 7.11L10.59 12 5.7 16.89a1 1 0 001.41 1.41L12 13.41l4.89 4.89a1 1 0 001.41-1.41L13.41 12l4.89-4.89a1 1 0 000-1.4z" />
          </svg>
        </button>
      </div>

      {/* Main image — object-contain so full photo is always visible */}
      <div className="relative flex-1 w-full">
        <Image
          src={images[idx]}
          alt={`${alt} — photo ${idx + 1} of ${count}`}
          fill
          className="object-contain"
          sizes="100vw"
          unoptimized
          priority
        />

        {/* Prev / Next arrows — desktop only; mobile uses swipe */}
        {count > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full p-2.5 transition-colors hidden md:flex items-center justify-center"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
              </svg>
            </button>
            <button
              onClick={next}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/75 text-white rounded-full p-2.5 transition-colors hidden md:flex items-center justify-center"
            >
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current">
                <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Swipe hint — mobile only, fades after a moment via CSS animation */}
      {count > 1 && (
        <div className="absolute bottom-20 inset-x-0 flex justify-center pointer-events-none md:hidden">
          <span className="text-white/40 text-xs animate-pulse">swipe to navigate</span>
        </div>
      )}

      {/* Bottom thumbnail strip */}
      {count > 1 && (
        <div className="flex-shrink-0 flex gap-2 overflow-x-auto px-4 py-3">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`relative flex-shrink-0 w-14 h-14 rounded-md overflow-hidden border-2 transition-all ${
                i === idx
                  ? "border-brand-red"
                  : "border-transparent opacity-50 hover:opacity-80"
              }`}
              aria-label={`View photo ${i + 1}`}
            >
              <Image
                src={src}
                alt={`${alt} thumbnail ${i + 1}`}
                fill
                className="object-cover"
                sizes="56px"
                unoptimized
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PhotoGallery — VDP hero + thumbnail strip
// ─────────────────────────────────────────────────────────────────────────────

/**
 * VDP photo gallery — full-width hero layout.
 *
 * Hero photo spans the full gallery width with the Maxim-style badge
 * overlay (CARFAX, feature pills, warranty, phone CTA, dealer + Google).
 * Below the hero sits a horizontal scrollable thumbnail strip — every
 * photo in the manifest, click any to swap it into the hero.
 *
 * Tapping / clicking the hero opens a full-screen lightbox. On mobile
 * photos are swipeable left/right inside the lightbox. Badge elements
 * (phone CTA, Carfax link, etc.) stopPropagation so they don't trigger
 * the lightbox accidentally.
 */
export default function PhotoGallery({ images: rawImages, alt, vehicle }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [erroredSrcs, setErroredSrcs] = useState<Set<string>>(new Set());
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const hasRealPhotos = rawImages.length > 0 && !rawImages[0]?.includes("placeholder");
  const images = hasRealPhotos && vehicle
    ? applyPhotoOrder(vehicle.slug, rawImages)
    : rawImages;
  const photoCount = hasRealPhotos ? images.length : 8;

  const overlayLive = useResolveOverlay(
    vehicle?.vin ?? "",
    vehicle?.daysOnLot ?? 0,
    vehicle?.status ?? "available",
    vehicle?.recentlyReduced ?? false
  );
  const overlay = vehicle ? overlayLive : null;
  const showBadges = vehicle && selectedIndex === 0;
  const forcePlaceholder = overlay?.useComingSoonPlaceholder === true;
  const warrantyCopy = overlay?.warranty;
  const remaining = Math.max(0, photoCount - 5);

  const openLightbox = (index: number) => {
    if (!hasRealPhotos || forcePlaceholder) return;
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      {/* Full-screen lightbox — rendered outside the gallery flow so
          it layers above everything on the page */}
      {lightboxOpen && hasRealPhotos && (
        <Lightbox
          images={images}
          alt={alt}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />
      )}

      <div className="space-y-3">
        {/* Full-width hero photo */}
        <div>
          {/* Tap / click the hero to open the lightbox */}
          <div
            role={hasRealPhotos && !forcePlaceholder ? "button" : undefined}
            tabIndex={hasRealPhotos && !forcePlaceholder ? 0 : undefined}
            aria-label={hasRealPhotos && !forcePlaceholder ? `View all ${photoCount} photos fullscreen` : undefined}
            onClick={() => openLightbox(selectedIndex)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") openLightbox(selectedIndex);
            }}
            className={`relative aspect-[3/2] bg-brand-gray-100 rounded-xl overflow-hidden ${
              hasRealPhotos && !forcePlaceholder ? "cursor-pointer" : ""
            }`}
          >
            {(hasRealPhotos || forcePlaceholder) ? (
              (() => {
                const rawHero = hasRealPhotos ? images[selectedIndex] : COMING_SOON_PLACEHOLDER;
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

            {/* Badge overlay — wrapped in stopPropagation so badge clicks
                (phone CTA, Carfax link, Google reviews) don't also open
                the lightbox */}
            {showBadges && vehicle && overlay && (
              <div onClick={(e) => e.stopPropagation()}>
                <PhotoScrim />

                <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10 flex flex-col items-start gap-1.5">
                  <div className="[&_>*]:scale-[0.26] sm:[&_>*]:scale-[0.52] [&_>*]:origin-top-left">
                    <CarfaxBadge vin={vehicle.vin} />
                  </div>
                  <div className="scale-[0.7] sm:scale-100 origin-top-left">
                    <CarfaxPillStack overlay={overlay} />
                  </div>
                  {overlay.effectiveStatus && (
                    <StatusPill kind={overlay.effectiveStatus} />
                  )}
                </div>

                <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex flex-col items-end gap-1.5">
                  <FeaturePillCluster pills={overlay.featurePills} stack="inline" />
                </div>

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

                <div className="absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1.5 scale-[0.6] sm:scale-100 origin-bottom-right">
                  {warrantyCopy && (
                    <WarrantyBadge copy={warrantyCopy} compact />
                  )}
                  <DealerCluster
                    rating={SITE_CONFIG.reviews.google.rating}
                    reviewCount={SITE_CONFIG.reviews.google.count}
                    reviewsUrl={SITE_CONFIG.reviews.google.readUrl}
                    showBadge={overlay.showGoogleReviewsBadge !== false}
                  />
                </div>
              </div>
            )}

            {/* Expand icon — bottom-right, shown on all photos when no
                badge overlay is active (non-first photo or no vehicle) */}
            {hasRealPhotos && !forcePlaceholder && !showBadges && (
              <div className="absolute bottom-3 right-3 z-10 pointer-events-none">
                <div className="bg-black/60 text-white rounded-full p-1.5">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M3 3h7v2H5v5H3V3zm11 0h7v7h-2V5h-5V3zM3 14h2v5h5v2H3v-7zm16 5h-5v2h7v-7h-2v5z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Photo counter — bottom-left when no badge overlay */}
            {!showBadges && (
              <span className="absolute bottom-3 left-3 bg-black/70 text-white text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                  <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                {photoCount} photos · Tap to expand
              </span>
            )}
          </div>
        </div>

        {/* Horizontal scrollable thumbnail strip — click to swap hero */}
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
    </>
  );
}
