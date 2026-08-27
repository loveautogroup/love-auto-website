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
  CarfaxBadge,
  CarfaxPillStack,
  DealerCluster,
  GoogleReviewsLockup,
  FeaturePillCluster,
  PhoneCTA,
  UrlBadge,
  PhotoScrim,
  StatusPill,
  WarrantyBadge,
  NoDealerFeesBadge,
} from "./badges";

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
  // "Coming Soon" state — only CARFAX badge shows (Jeremiah, 2026-06-10).
  const isComingSoon = forcePlaceholder || !hasRealPhotos;
  // Gallery photos (index > 0): show minimal dealer logo + URL badge only.
  // Mirrors the DealerCenter gallery bake so every photo carries branding.
  const showMinimalBadges = Boolean(vehicle && overlay && selectedIndex > 0 && hasRealPhotos && !forcePlaceholder);
  const warrantyCopy = overlay?.warranty;
  const remaining = Math.max(0, photoCount - 5);

  // Badge config derived values — fall back to "show everything" when absent.
  const MARGIN_PCT = badgeConfig?.margin_pct ?? 2.2;
  // Hero is baked when Railway has composited the dealer logo into the photo pixels.
  // Detected by the "hero-baked" prefix in the R2 object key embedded in the URL.
  const hasBakedHero = Boolean(images[0]?.includes("hero-baked"));
  // Hide the HTML "LOVE AUTO GROUP" text pill when the logo is already baked.
  const hideDealerPill = hasBakedHero && (badgeConfig?.dealer_badge_enabled !== false);
  // When a badge is baked into the hero pixels, suppress its HTML twin —
  // the baked badges are pixel replicas of these components (Session 17),
  // so rendering both double-stamps the photo. Non-baked heroes keep the
  // interactive HTML overlays.
  const showGoogleBadge =
    !hasBakedHero &&
    !isComingSoon &&
    (badgeConfig?.google_badge_enabled !== false) &&
    (overlay?.showGoogleReviewsBadge !== false);
  const showPhoneBadge = !hasBakedHero && !isComingSoon && badgeConfig?.phone_badge_enabled !== false;
  // URL badge mirrors the phone gating — bottom-center, same Montserrat
  // treatment, baked into the hero pixels when the hero is baked.
  const showUrlBadge = !hasBakedHero && hasRealPhotos && !forcePlaceholder;
  // ALSO honours the per-vehicle opt-out, not just the global flag. The badge
  // links straight to carfax.com/.../Report.cfx?vin=..., which renders an OFFER
  // / purchase page rather than a report when the VIN is not in our CARFAX
  // Advantage inventory yet. Opting a vehicle out (overlay.carfax === false) is
  // exactly the documented case "while waiting for a fresh report" — it used to
  // hide only the SHOW ME THE CARFAX button and leave this badge pointing at
  // the offer page.
  const showCarfaxBadge =
    !hasBakedHero &&
    badgeConfig?.carfax_badge_enabled !== false &&
    overlay?.carfax !== false;
  // Same !hasBakedHero gate as its siblings: when the hero is baked the mark
  // is already in the pixels, so rendering the HTML copy would double-stamp.
  // Opt-in rather than opt-out, mirroring no_fee_badge_enabled's default.
  const showNoFeeBadge =
    !hasBakedHero && !isComingSoon && badgeConfig?.no_fee_badge_enabled === true;

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
            className={`@container relative aspect-[3/2] bg-brand-gray-100 rounded-xl overflow-hidden ${
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

            {/* Badge overlay — stopPropagation so badge clicks don't open lightbox.
                Positions use %-based inline styles (matching badge_spec.json from Railway)
                so the HTML overlay layer aligns exactly with the baked pixel layer. */}
            {showBadges && vehicle && overlay && (
              <div onClick={(e) => e.stopPropagation()}>
                {/* Scrim exists for HTML badge legibility. On baked heroes the
                    badges live INSIDE the photo pixels — the scrim would sit on
                    top of them and wash them out (Session 18 finding). */}
                {!hasBakedHero && <PhotoScrim />}

                {/* SOLD stamp across the hero (Jeremiah, 2026-08-25: "put the
                    stamp across the vdp image that says sold").
                    
                    Rejected for the inventory GRID — at 8-sold-of-15 a wall of
                    stamps reads "clearance sale". On a single VDP there is no
                    density problem and it is the clearest possible signal that
                    the car in the photo is gone.

                    pointer-events-none so it never blocks the gallery controls
                    underneath, and aria-hidden because the page already says
                    SOLD in text — a screen reader should not hear it twice. */}
                {overlay.effectiveStatus === "sold" && (
                  <div
                    className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center overflow-hidden"
                    aria-hidden="true"
                  >
                    <span className="-rotate-[18deg] select-none rounded-xl border-[6px] border-white/90 bg-[#dc2626]/85 px-[6%] py-[1.5%] text-[13vw] font-black uppercase leading-none tracking-[0.12em] text-white shadow-[0_8px_30px_rgba(0,0,0,0.45)] @min-[760px]:text-[9vw] @min-[1100px]:text-[7rem]">
                      Sold
                    </span>
                  </div>
                )}

                {/* Top-left: CARFAX logo + feature pills (1-Owner, No Accidents…) + status.
                    The CARFAX card hides when baked into the hero pixels; the
                    feature/status pills are never baked so they always render.

                    ⚠ These three use `zoom`, NOT `transform: scale`, and that is
                    deliberate. They are the only scaled elements that are
                    siblings in a flow layout, and transforms do not affect
                    layout — the column reserves each badge's PRE-transform
                    height, so scaling up makes them render on top of each
                    other while the layout still thinks they fit. At the old
                    1.15 the overflow was ~11px and the gap hid it; at 1.725 the
                    CARFAX card laid out at ~83px, rendered at 144px, and
                    covered the pill stack by 54px. `zoom` scales the layout box
                    too, so the flex gap just works. Do not "tidy" these back
                    to scale-[...].

                    And the tiers are @container, not sm:. The hero is 380px on
                    a phone and 1233px on this monitor, and `sm:` keys off the
                    VIEWPORT — so below 640px the marks were sized for a much
                    wider box (logo 197px = 52% of the hero against 39.9% on
                    desktop; CARFAX 145px = 38% against 26%), which is the
                    61x64px CARFAX-through-the-logo collision on a real phone.
                    Worse, sm: also flipped to the DESKTOP values at a 640px
                    viewport while the hero was still only ~600px, so there was
                    a second broken band from 640-1000px that nobody had looked
                    at. Container tiers track the box itself.

                    Four tiers, not three: at a 728px hero the first attempt's
                    mid tier still put CARFAX at 28.6% and the logo at 43.9%
                    (targets 26% / 39.9%) and they collided by 20x93px. Each
                    tier is sized so a mark holds roughly the same FRACTION of
                    the hero it holds on desktop -- that fraction is the thing
                    being conserved, not any single px value. */}
                <div
                  className="absolute z-10 flex flex-col items-start gap-1 sm:gap-1.5"
                  style={{
                    top: `${MARGIN_PCT}%`,
                    left: `${MARGIN_PCT}%`,
                    paddingTop:
                      hasBakedHero && badgeConfig?.carfax_badge_enabled !== false
                        ? "5.5%"
                        : undefined,
                  }}
                >
                  {showCarfaxBadge && (
                    /* Natural size like GoogleReviewsLockup — uniform badge
                       spec (Jeremiah 2026-06-05): carfax/dealer/google all
                       186px wide on the desktop VDP. Mobile gets the same
                       0.6 treatment as the lockup wrapper below. */
                    <div className="[zoom:0.43] @min-[400px]:[zoom:0.545] @min-[500px]:[zoom:0.69] @min-[620px]:[zoom:0.864] @min-[760px]:[zoom:1.07] @min-[920px]:[zoom:1.301] @min-[1100px]:[zoom:1.563] @min-[1220px]:[zoom:1.725]">
                      <CarfaxBadge vin={vehicle.vin} />
                    </div>
                  )}
                  {!isComingSoon && (
                    <div className="[zoom:0.321] @min-[400px]:[zoom:0.408] @min-[500px]:[zoom:0.516] @min-[620px]:[zoom:0.646] @min-[760px]:[zoom:0.8] @min-[920px]:[zoom:0.973] @min-[1100px]:[zoom:1.169] @min-[1220px]:[zoom:1.29]">
                      <CarfaxPillStack overlay={overlay} />
                    </div>
                  )}
                  {!isComingSoon && overlay.effectiveStatus && (
                    <div className="[zoom:0.321] @min-[400px]:[zoom:0.408] @min-[500px]:[zoom:0.516] @min-[620px]:[zoom:0.646] @min-[760px]:[zoom:0.8] @min-[920px]:[zoom:0.973] @min-[1100px]:[zoom:1.169] @min-[1220px]:[zoom:1.29]">
                      <StatusPill kind={overlay.effectiveStatus} />
                    </div>
                  )}
                </div>

                {/* Top-center: dealer logo pill — hidden when baked into hero pixels
                    or when the photo is the coming-soon placeholder.

                    Scale is 1.15 x 1.15 = 1.3225 (owner, 2026-08-22: "increase
                    our dealership logo by 15%"). The logo was deliberately held
                    OUT of the earlier +50% badge bump because a uniform
                    increase put it at 51% of the hero width and it competed
                    with the car; 15% is the deliberate, smaller correction.
                    Mobile keeps the same ratio (0.46 x 1.15 = 0.529).

                    KEEP IN SYNC: photo_overlay.py _LOGO_UPSCALE_COMPENSATION
                    and the DMS VdpHeroReplica. */}
                {!hideDealerPill && !isComingSoon && (
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
                )}

                {/* Top-right: merchandising feature pills */}
                {!isComingSoon && (
                  <div
                    className="absolute z-10 flex flex-col items-end gap-1 sm:gap-1.5 scale-[0.321] @min-[400px]:scale-[0.408] @min-[500px]:scale-[0.516] @min-[620px]:scale-[0.646] @min-[760px]:scale-[0.8] @min-[920px]:scale-[0.973] @min-[1100px]:scale-[1.169] @min-[1220px]:scale-[1.29] origin-top-right"
                    style={{ top: `${MARGIN_PCT}%`, right: `${MARGIN_PCT}%` }}
                  >
                    <FeaturePillCluster pills={overlay.featurePills} stack="inline" />
                  </div>
                )}

                {/* Bottom-left: phone number (mobile compact / desktop full) */}
                {showPhoneBadge && (
                  <>
                    <div
                      className="absolute z-10 md:hidden scale-[0.6] @min-[500px]:scale-[0.78] @min-[620px]:scale-[0.96] @min-[720px]:scale-[1.14] origin-bottom-left"
                      style={{ bottom: `${MARGIN_PCT}%`, left: `${MARGIN_PCT}%` }}
                    >
                      <PhoneCTA
                        phone={SITE_CONFIG.phone}
                        phoneRaw={SITE_CONFIG.phoneRaw}
                        compact
                      />
                    </div>
                    <div
                      className="absolute z-10 hidden md:block"
                      style={{ bottom: `${MARGIN_PCT}%`, left: `${MARGIN_PCT}%` }}
                    >
                      <PhoneCTA
                        phone={SITE_CONFIG.phone}
                        phoneRaw={SITE_CONFIG.phoneRaw}
                      />
                    </div>
                  </>
                )}

                {/* Bottom-center: dealership URL — matches phone treatment */}
                {showUrlBadge && (
                  <div
                    className="absolute z-10 left-0 right-0 flex justify-center pointer-events-none"
                    style={{ bottom: `${MARGIN_PCT}%` }}
                  >
                    <span className="md:hidden inline-block scale-[0.64] @min-[500px]:scale-[0.85] @min-[620px]:scale-[1.05] @min-[720px]:scale-[1.25] origin-bottom"><UrlBadge compact /></span>
                    <span className="hidden md:inline"><UrlBadge /></span>
                  </div>
                )}

                {/* Bottom-right: no-dealer-fees mark + Google Reviews lockup.
                    Stacked in that order so the mark sits ABOVE the lockup,
                    matching composite_all_badges in photo_overlay.py, which
                    lifts the baked mark clear of the Google pill. */}
                <div
                  className="absolute z-10 flex flex-col items-end gap-1 sm:gap-1.5 scale-[0.321] @min-[400px]:scale-[0.408] @min-[500px]:scale-[0.516] @min-[620px]:scale-[0.646] @min-[760px]:scale-[0.8] @min-[920px]:scale-[0.973] @min-[1100px]:scale-[1.169] @min-[1220px]:scale-[1.29] origin-bottom-right"
                  style={{ bottom: `${MARGIN_PCT}%`, right: `${MARGIN_PCT}%` }}
                >
                  {!isComingSoon && warrantyCopy && (
                    <WarrantyBadge copy={warrantyCopy} compact />
                  )}
                  {!isComingSoon && showNoFeeBadge && (
                    <NoDealerFeesBadge
                      copy={badgeConfig?.no_fee_badge_copy}
                      compact
                    />
                  )}
                  {showGoogleBadge && (
                    <GoogleReviewsLockup
                      rating={googleReviews.rating}
                      reviewCount={googleReviews.reviewCount}
                      reviewsUrl={SITE_CONFIG.reviews.google.readUrl}
                    />
                  )}
                </div>
              </div>
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
                <div className="bg-black/60 text-white rounded-full p-1.5">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M3 3h7v2H5v5H3V3zm11 0h7v7h-2V5h-5V3zM3 14h2v5h5v2H3v-7zm16 5h-5v2h7v-7h-2v5z" />
                  </svg>
                </div>
              </div>
            )}

            {/* Photo counter — shown when no badge overlay */}
            {!showBadges && !showMinimalBadges && (
              <span className="absolute bottom-3 left-3 bg-black/70 text-white text-xs font-medium px-2.5 py-1 rounded-full inline-flex items-center gap-1">
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
