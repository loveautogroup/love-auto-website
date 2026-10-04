"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Vehicle } from "@/lib/types";
import { SITE_CONFIG } from "@/lib/constants";
import type { GlobalBadgeConfig } from "@/lib/dmsInventory";
import { useResolveOverlay } from "@/data/useMerchandising";
import { applyPhotoOrder } from "@/data/photoOrder";
import { useReviews } from "@/context/ReviewsContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  DealerCluster,
  UrlBadge,
  PhotoScrim,
} from "./badges";
import HeroBadgeOverlay, { heroBadgeStatus } from "./badges/HeroBadgeOverlay";

interface PhotoGalleryProps {
  images: string[];
  alt: string;
  /** Optional — when provided, the main hero photo gets the full overlay system. */
  vehicle?: Vehicle;
  /**
   * Global badge config fetched from Railway at SSR time.
   * Controls which overlay badges are visible and positions them using
   * the same %-based coordinates as the baked photo layer.
   */
  badgeConfig?: GlobalBadgeConfig;
}

const COMING_SOON_PLACEHOLDER = "/images/coming-soon.png";

// ─────────────────────────────────────────────────────────────────────────────
// useIsMobile — true when viewport < 768 px (Tailwind md breakpoint).
// Gates the lightbox to mobile only; desktop keeps thumbnail-swap behaviour.
// ─────────────────────────────────────────────────────────────────────────────

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);
  return isMobile;
}

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
  const { t } = useLanguage();
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
          aria-label={t.gallery.close}
          className="text-white/80 hover:text-white p-2 -mr-2 transition-colors"
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
        {/* Desktop mouse navigation — hidden on touch viewports where
            swipe handles it. Keyboard arrows work everywhere. */}
        <button
          onClick={prev}
          aria-label={t.gallery.previous}
          className="hidden md:flex absolute left-3 top-1/2 -translate-y-1/2 items-center justify-center w-11 h-11 rounded-full bg-black/50 text-white/80 hover:bg-black/75 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>
        <button
          onClick={next}
          aria-label={t.gallery.next}
          className="hidden md:flex absolute right-3 top-1/2 -translate-y-1/2 items-center justify-center w-11 h-11 rounded-full bg-black/50 text-white/80 hover:bg-black/75 hover:text-white transition-colors"
        >
          <svg viewBox="0 0 24 24" className="w-6 h-6 fill-current">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
          </svg>
        </button>
      </div>

      {/* Swipe hint */}
      {count > 1 && (
        <div className="absolute bottom-20 inset-x-0 flex justify-center pointer-events-none">
          <span className="text-white/40 text-xs animate-pulse">{t.gallery.swipe}</span>
        </div>
      )}

      {/* Bottom thumbnail strip */}
      {count > 1 && (
        <div className="flex-shrink-0 flex gap-2 overflow-x-auto px-4 py-3">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              className={`relative flex-shrink-0 w-14 h-14 overflow-hidden border-2 transition-all ${
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
 * On mobile: tapping the hero opens a full-screen lightbox with swipe
 * navigation. On desktop the lightbox is not triggered — clicking a
 * thumbnail still swaps the hero as before.
 */
export default function PhotoGallery({ images: rawImages, alt, vehicle, badgeConfig }: PhotoGalleryProps) {
  const { t } = useLanguage();
  const googleReviews = useReviews();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [erroredSrcs, setErroredSrcs] = useState<Set<string>>(new Set());
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const isMobile = useIsMobile();

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
  // "Coming Soon" state — no hero badges (the free-CARFAX card left the photo 2026-10-04).
  const isComingSoon = forcePlaceholder || !hasRealPhotos;
  // Gallery photos (index > 0): show minimal dealer logo + URL badge only.
  // Mirrors the DealerCenter gallery bake so every photo carries branding.
  const showMinimalBadges = Boolean(vehicle && overlay && selectedIndex > 0 && hasRealPhotos && !forcePlaceholder);
  const remaining = Math.max(0, photoCount - 5);

  // Badge config derived values — fall back to "show everything" when absent.
  const MARGIN_PCT = badgeConfig?.margin_pct ?? 2.2;

  // Only open on mobile; desktop keeps thumbnail-swap-only behaviour
  const openLightbox = (index: number) => {
    if (!hasRealPhotos || forcePlaceholder || !isMobile) return;
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  return (
    <>
      {/* Full-screen lightbox — mobile only */}
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
          {/* On mobile: tapping opens lightbox. On desktop: no-op (thumbnails swap hero). */}
          <div
            role={hasRealPhotos && !forcePlaceholder && isMobile ? "button" : undefined}
            tabIndex={hasRealPhotos && !forcePlaceholder && isMobile ? 0 : undefined}
            aria-label={hasRealPhotos && !forcePlaceholder && isMobile ? `View all ${photoCount} photos fullscreen` : undefined}
            onClick={() => openLightbox(selectedIndex)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") openLightbox(selectedIndex);
            }}
            className={`@container relative aspect-[4/3] bg-brand-gray-100 overflow-hidden ${
              hasRealPhotos && !forcePlaceholder && isMobile ? "cursor-pointer" : ""
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
                    className={heroSrc === COMING_SOON_PLACEHOLDER ? "object-contain" : "object-cover"}
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
                  <p className="font-medium text-sm">{t.gallery.placeholderTitle}</p>
                  <p className="text-xs">{t.gallery.placeholderSub}</p>
                </div>
              </div>
            )}

            {/* Hero badges — the owner-approved FINAL design (2026-10-04),
                the HTML twin of the baked hero (BAKE RULES: photo_overlay.py
                composite_hero_v3 + the DMS replica). Sized in cqw against this
                @container box, so it is the same picture at every width. The
                old cluster (CARFAX card, centred logo, phone/URL text, Google
                lockup, no-fee mark, top-right pills, the old SOLD stamp) is
                retired from the hero; "Show me the CARFAX" stays on the VDP. */}
            {showBadges && vehicle && overlay && !isComingSoon && (
              <HeroBadgeOverlay
                status={heroBadgeStatus(overlay.effectiveStatus === "sold" ? "sold" : vehicle.status)}
                pills={vehicle.badgePills ?? []}
                rating={googleReviews.rating}
                phone={SITE_CONFIG.phone.replace(/[()]/g, "").replace(/\s+/g, "-")}
                phoneHref={`tel:${SITE_CONFIG.phoneRaw}`}
                reviewsUrl={SITE_CONFIG.reviews.google.readUrl}
              />
            )}

            {/* Gallery minimal badges — dealer logo (top-center) + URL badge
                (bottom-center) on every non-hero photo. Keeps every gallery
                slot branded without the full CARFAX/Google/phone overlay
                that would crowd the image. Mirrors the DealerCenter bake
                produced by composite_gallery_badges in photo_overlay.py. */}
            {showMinimalBadges && (
              <div onClick={(e) => e.stopPropagation()}>
                <PhotoScrim />
                <div
                  className="absolute z-10 left-0 right-0 flex justify-center pointer-events-none"
                  style={{ top: `${MARGIN_PCT}%` }}
                >
                  <div className="pointer-events-auto scale-[0.329] @min-[400px]:scale-[0.418] @min-[500px]:scale-[0.529] @min-[620px]:scale-[0.663] @min-[760px]:scale-[0.82] @min-[920px]:scale-[0.997] @min-[1100px]:scale-[1.198] @min-[1220px]:scale-[1.323] origin-top">
                    <DealerCluster
                      showBadge={false}
                      hideDealerPill={false}
                      rating={googleReviews.rating}
                      reviewCount={googleReviews.reviewCount}
                      reviewsUrl={SITE_CONFIG.reviews.google.readUrl}
                    />
                  </div>
                </div>
                <div
                  className="absolute z-10 left-0 right-0 flex justify-center pointer-events-none"
                  style={{ bottom: `${MARGIN_PCT}%` }}
                >
                  <span className="md:hidden inline-block scale-[0.64] @min-[500px]:scale-[0.85] @min-[620px]:scale-[1.05] @min-[720px]:scale-[1.25] origin-bottom"><UrlBadge compact /></span>
                  <span className="hidden md:inline"><UrlBadge /></span>
                </div>
              </div>
            )}

            {/* Expand icon — mobile only, non-first photos (first photo has badge overlay) */}
            {hasRealPhotos && !forcePlaceholder && !showBadges && (
              <div className="absolute bottom-3 right-3 z-10 pointer-events-none md:hidden">
                <div className="bg-black/60 text-white p-1.5">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M3 3h7v2H5v5H3V3zm11 0h7v7h-2V5h-5V3zM3 14h2v5h5v2H3v-7zm16 5h-5v2h7v-7h-2v5z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Photo counter — shown when no badge overlay */}
            {!showBadges && !showMinimalBadges && (
              <span className="absolute bottom-3 left-3 bg-black/70 text-white text-xs font-medium px-2.5 py-1 inline-flex items-center gap-1">
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                  <path d="M20 5h-3.17L15 3H9L7.17 5H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm-8 13c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
                {photoCount} photos
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
                onClick={() => {
                  // The "+N more" tile opens the full-screen gallery —
                  // previously it just swapped the hero, so the promised
                  // "more photos" never appeared (Jeremiah 2026-06-05).
                  // Desktop included: the Lightbox works on any viewport.
                  if (showMoreOverlay && hasRealPhotos && !forcePlaceholder) {
                    setLightboxIndex(i);
                    setLightboxOpen(true);
                    return;
                  }
                  setSelectedIndex(i);
                }}
                className={`relative flex-shrink-0 w-[150px] aspect-[4/3] bg-brand-gray-100 overflow-hidden border-2 transition-all ${
                  selectedIndex === i
                    ? "border-brand-red"
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
