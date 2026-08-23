"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Vehicle } from "@/lib/types";
import { SITE_CONFIG } from "@/lib/constants";
import { useInventory } from "@/lib/useInventory";
import { useLanguage } from "@/context/LanguageContext";
import { useResolveOverlay } from "@/data/useMerchandising";
import { applyPhotoOrder } from "@/data/photoOrder";
import {
  CarfaxBadge,
  CarfaxPillStack,
  DealerCluster,
  GoogleReviewsLockup,
  FeaturePillCluster,
  NoDealerFeesBadge,
  PhoneCTA,
  PhotoScrim,
  StatusPill,
  UrlBadge,
} from "./badges";
import { useReviews } from "@/context/ReviewsContext";
import { useBadgeConfig } from "@/context/BadgeConfigContext";

interface VehicleCardProps {
  vehicle: Vehicle;
}

function estimateMonthlyPayment(
  price: number,
  downPayment = 1000,
  apr = 0.0699,
  termMonths = 60
): number {
  const principal = price - downPayment;
  if (principal <= 0) return 0;
  const monthlyRate = apr / 12;
  return Math.round(
    (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
      (Math.pow(1 + monthlyRate, termMonths) - 1)
  );
}

/**
 * Vehicle card for the inventory grid and homepage Featured section.
 *
 * Cards carry the FULL Maxim-style overlay in compact mode (CARFAX top-left,
 * up to 2 short feature pills top-center, compact warranty bottom-left,
 * phone CTA bottom-center, dealer + Google compact bottom-right).
 *
 * Why dense overlay on cards: Jeremiah's call. The pills are attention
 * grabbers in third-party syndicated feeds (CarGurus, Cars.com, Marketplace),
 * and the burned-in phone number lets customers bypass third-party spoofed
 * lead-capture numbers — saving per-lead billing AND letting customers text
 * the dealer directly (which many prefer over the third-party form).
 *
 * Each badge has a `compact` variant scaled for the ~360px card width.
 * The VDP gallery uses the full-size badges (PhotoGallery component).
 */
export default function VehicleCard({ vehicle }: VehicleCardProps) {
  const googleReviews = useReviews();
  const badgeConfig = useBadgeConfig();
  const { t } = useLanguage();
  const c = t.card;

  // Runtime hook — re-renders when /api/merchandising resolves so DMS-saved
  // overlays (carfax shield, feature pills, status badge, hidden flag) take
  // effect immediately instead of waiting for a Cloudflare Pages rebuild.
  const overlay = useResolveOverlay(
    vehicle.vin,
    vehicle.daysOnLot,
    vehicle.status,
    vehicle.recentlyReduced ?? false
  );

  // E3: sticker prices display as whole dollars — FLOOR, never round.
  // Dealers price $13,999.99 deliberately under the next round number,
  // so it must render "$13,999", not "$14,000".
  const priceHasCents = Math.round(vehicle.price * 100) % 100 !== 0;
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: priceHasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(vehicle.price);

  const formattedMileage = new Intl.NumberFormat("en-US").format(
    vehicle.mileage
  );

  const monthlyPayment = estimateMonthlyPayment(vehicle.price);

  // Live photo hydration — mirrors VDPLivePhotos pattern. Seed images
  // are local /public/images/inventory/... paths captured when the
  // vehicle was added to the seed file. DMS holds the canonical
  // DealerCenter URLs that Jeremiah edited via the merchandising
  // panel. Render seed first (SSR/SEO safe), then once useInventory()
  // hydrates, swap ONLY the hero (first image) if the live snapshot
  // has its own non-empty images array AND the live first image is
  // different from the seed's first image. Keeps the swap minimal —
  // the rest of the card layout is unchanged.
  const { vehicles: liveVehicles, source: liveSource } = useInventory();
  let heroOverride: string | null = null;
  if (liveSource !== "fallback") {
    const live = liveVehicles.find((v) => v.vin === vehicle.vin);
    if (live) {
      // Use the RAW photo and let the HTML badges render, the same way the VDP
      // does. This used to prefer live.bakedHeroUrl, reasoning that baked
      // badges "scale naturally as a thumbnail". They do not. They are
      // composited against a 1600px hero, so on a 244px card every gap shrinks
      // by the same factor — the 24px separation the bake is checked for
      // becomes 3.7px and the marks read as merged. That is the overlap
      // reported on the homepage thumbnails.
      //
      // It also contradicts the standing rule (CLAUDE.md, BAKE RULES): the
      // WEBSITE always shows interactive HTML badges; baked photos are for
      // external surfaces — feeds, DealerCenter, og:image. The VDP already
      // follows that rule, which is exactly why cards "didn't reflect their
      // VDP images". Those consumers read bakedHeroUrl directly and are
      // unaffected by this.
      //
      // With raw photos the HTML overlay runs, and its @container scales size
      // each badge against the actual card width. That code was dead while
      // every card served a baked hero.
      if (
        Array.isArray(live.images) &&
        live.images.length > 0 &&
        live.images[0] !== vehicle.images[0]
      ) {
        heroOverride = live.images[0];
      }
    }
  }

  const COMING_SOON_PLACEHOLDER = "/images/coming-soon.png";

  const hasRealImage =
    vehicle.images.length > 0 && !vehicle.images[0].includes("placeholder");
  // Apply Jordan's manifest so the card hero = the best exterior shot,
  // not whatever Dealer Center happened to export as image #1.
  const orderedImages = hasRealImage
    ? applyPhotoOrder(vehicle.slug, vehicle.images)
    : vehicle.images;

  // Live-snapshot may also be empty. If neither seed nor live has any
  // photos, fall back to the branded "Coming Soon" placeholder so the
  // card never paints an empty gray box on the inventory grid.
  const liveForVin = liveSource !== "fallback"
    ? liveVehicles.find((v) => v.vin === vehicle.vin)
    : undefined;
  const liveHasImages =
    liveForVin && Array.isArray(liveForVin.images) && liveForVin.images.length > 0;
  const noPhotosAnywhere = !hasRealImage && !liveHasImages;

  // Per-vehicle toggle (DMS merchandising panel) — when on, force the
  // branded Coming Soon placeholder as the hero. This is an explicit
  // opt-in per vehicle. The previous AUTO-fallback for "no photos
  // anywhere" was removed: cars without pictures now render the
  // empty-state SVG instead of the branded placeholder.
  const forcePlaceholder = overlay.useComingSoonPlaceholder === true;
  // "Coming Soon" state — only CARFAX badge shows (Jeremiah, 2026-06-10).
  const isComingSoon = noPhotosAnywhere || forcePlaceholder;

  const initialHero = (forcePlaceholder || noPhotosAnywhere)
    ? COMING_SOON_PLACEHOLDER
    : (heroOverride ?? orderedImages[0] ?? "");

  // onError fallback — if the chosen hero URL 404s or fails to load
  // (DealerCenter CDN flake, deleted seed asset, etc.), fall back to
  // the branded Coming Soon placeholder. Local state so the swap
  // survives re-render.
  const [heroSrc, setHeroSrc] = useState<string>(initialHero);
  // Baked-hero detection: Railway bakes pixel replicas of the badge
  // components into hero photos (Session 17). When the displayed image is
  // baked, suppress the HTML twins below to avoid double-stamping.
  const cardHasBakedHero = heroSrc.includes("hero-baked");
  // Opt-IN, exactly as PhotoGallery gates it — `=== true`, not a truthiness
  // check, so a missing config does not silently switch the mark on.
  const showNoFeeBadge =
    !cardHasBakedHero && badgeConfig?.no_fee_badge_enabled === true;
  // The CARFAX badge honors the DMS merchandising opt-out, exactly as the
  // VDP's PhotoGallery does. It previously checked only the baked-hero
  // flag, so turning the badge OFF in the DMS hid it on vehicle detail
  // pages while every inventory card kept showing it.
  // NOTE: deliberately NOT gated on isComingSoon — per Jeremiah's
  // 2026-06-10 ruling the CARFAX badge is the ONE badge that still shows
  // on a Coming Soon card (that's why its siblings below are suppressed).
  const showCarfaxBadge =
    !cardHasBakedHero && badgeConfig.carfax_badge_enabled !== false;
  // Track the specific URL that 404'd so we can prevent retrying it while
  // still allowing a *different* (live) URL to replace it. A boolean latch
  // would block the upgrade from a failed seed path to a working R2/DC URL.
  const [erroredUrl, setErroredUrl] = useState<string | null>(null);

  // Reactive hydration — two paths:
  // 1. heroOverride: useInventory() resolved and the live first image differs
  //    from the seed image (only happens when InventoryGrid passes the *seed*
  //    vehicle and the hook fetches a different live URL separately).
  // 2. vehicle.images[0] changed: InventoryGrid passed a *live* vehicle as
  //    the prop directly (both live.images[0] and vehicle.images[0] are the
  //    same URL, so heroOverride stays null — we must watch the prop itself).
  // Skip if the candidate is the same URL that already errored (loop guard).
  useEffect(() => {
    const candidate =
      heroOverride ??
      (!forcePlaceholder && hasRealImage ? orderedImages[0] : null);
    if (candidate && candidate !== heroSrc && candidate !== erroredUrl) {
      setHeroSrc(candidate);
    }
  }, [heroOverride, vehicle.images[0]]); // eslint-disable-line react-hooks/exhaustive-deps

  // The Coming Soon toggle lives in live KV, not the baked config, so
  // forcePlaceholder flips true only AFTER the merch fetch resolves
  // post-hydration. heroSrc was locked to the real photo at init and the
  // upgrade effect above never downgrades, so without this the toggle never
  // registers on the card. Watch forcePlaceholder and swap to the placeholder.
  useEffect(() => {
    if (forcePlaceholder && heroSrc !== COMING_SOON_PLACEHOLDER) {
      setHeroSrc(COMING_SOON_PLACEHOLDER);
    }
  }, [forcePlaceholder]); // eslint-disable-line react-hooks/exhaustive-deps

  const heroImage = heroSrc;
  // Render the <Image> only when there's a real source. Empty string
  // means "no photo, no placeholder" → fall through to the SVG branch.
  const showImage = (hasRealImage || liveHasImages || forcePlaceholder || noPhotosAnywhere) && heroSrc !== "";

  return (
    <article
      className="
        group relative
        bg-white rounded-xl border border-brand-gray-200 overflow-hidden
        hover:shadow-lg hover:border-brand-red/30 transition-all duration-200
      "
    >
      {/* Photo + full overlay (compact-scaled) */}
      {/* 3:2 box — matches the VDP hero so the baked badge layer crops
          identically on cards and detail pages (Session 17). */}
      {/* @container: the badge scales below key off the CARD width, not the
          viewport. They have to — this grid renders cards at 298px (3-up),
          341px (mobile) and 398px, and a viewport breakpoint cannot tell those
          apart. A single scale cannot satisfy all three: at 298px the top row
          has to fit CARFAX + a centred logo + the pill column, and the centred
          logo's left edge closes on the left column as the card narrows. */}
      <div className="@container relative aspect-[3/2] bg-brand-gray-100 overflow-hidden">
        {showImage ? (
          <Image
            src={heroImage}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`}
            fill
            className={`${heroSrc === COMING_SOON_PLACEHOLDER ? "object-contain" : "object-cover"} group-hover:scale-105 transition-transform duration-300`}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => {
              // Fall back to branded Coming Soon placeholder. Remember the
              // specific URL that failed so the reactive effect can still
              // upgrade heroSrc if a *different* (live) URL arrives later —
              // only the exact errored URL is blocked from retrying.
              if (heroSrc !== COMING_SOON_PLACEHOLDER) {
                setErroredUrl(heroSrc);
                setHeroSrc(COMING_SOON_PLACEHOLDER);
              }
            }}
            unoptimized={heroSrc.endsWith(".svg") || heroSrc.endsWith("/coming-soon.png")}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-brand-gray-300">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-16 h-16"
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
          </div>
        )}

        {/* Gradient scrim for overlay legibility — skipped on baked heroes
            so it doesn't dim the badges baked into the photo pixels. */}
        {!cardHasBakedHero && <PhotoScrim />}

        {/* Top-left column: full Carfax + status cluster — shield,
            active Carfax pills, status pill (in that vertical order).
            Mirrors the VDP hero so the inventory grid feels consistent.
            Shield scaled 26% on mobile / 32% on sm+ (kept tight on cards).
            NOTE: target the descendant <a> directly — the prior [&_.cf]
            selector matched nothing (no descendant carried the `cf` class)
            so the badge had been rendering at full 140px on cards. */}
        <div
          className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 flex flex-col items-start gap-1"
          style={{ paddingTop: cardHasBakedHero ? "5.5%" : undefined }}
        >
          {showCarfaxBadge && (
            <div className="[zoom:0.38] @min-[330px]:[zoom:0.45] @min-[380px]:[zoom:0.51]">
              <CarfaxBadge vin={vehicle.vin} />
            </div>
          )}
          {/* Container scales below, not sm:. These were the last two marks
              still keyed to the VIEWPORT, so a 298px card at a 1312px viewport
              rendered them at 0.86 and the left column ran 147px down a 199px
              card — far enough to collide with the phone+URL stack in the
              corner below it.

              The narrow tier is 0.52 rather than 0.6: at 0.6 the column still
              ended at y151 against a stack starting at y146 on a 199px-tall
              card. Measured, not estimated — the pill stack is the tallest
              thing on a card and it is what has to give.

              And these are `zoom`, not scale-[...], for the same reason the
              VDP's top-left stack is: transform:scale shrinks a child
              VISUALLY but leaves its layout box full size, so the flex column
              below keeps stacking at unscaled offsets and the column never
              actually gets shorter. Dropping 0.6 -> 0.52 under scale changed
              the overlap by exactly 0px. zoom scales the box, so the column
              shortens. Do not "tidy" these back to scale-[...]. */}
          {!isComingSoon && (
            <div className="[zoom:0.52] @min-[330px]:[zoom:0.72] @min-[380px]:[zoom:0.86]">
              <CarfaxPillStack overlay={overlay} compact />
            </div>
          )}
          {!isComingSoon && overlay.effectiveStatus && (
            <div className="[zoom:0.52] @min-[330px]:[zoom:0.72] @min-[380px]:[zoom:0.86]">
              <StatusPill kind={overlay.effectiveStatus} compact />
            </div>
          )}
        </div>

        {/* Top-center: dealer logo pill — not shown on coming-soon placeholder
            or when already baked into the hero pixels. */}
        {!isComingSoon && !cardHasBakedHero && (
          <div className="absolute top-1.5 left-0 right-0 flex justify-center z-10 pointer-events-none">
            {/* Clearance either side of the centred logo is
                  (cardW - logoW) / 2 - inset - sideClusterW
                and it must stay positive at EVERY card width. Worked through,
                with the logo 252.2px natural and CARFAX 186.3px natural:

                  card  logo   half-gap   CARFAX needs   pills need
                  298   105.9    96.0          88.8          89.5
                  341   131.1   105.0          99.8          97.8
                  398   158.8   119.6         113.0         113.5

                Every row clears. At a single fixed scale it cannot: 0.63
                everywhere overlaps CARFAX by 10px at 341px and by far more at
                298px, which is the mobile overlap this fixes.

                NO sm: bump. The 1.15 that used to be here was copied from the VDP hero, which
                is ~1233px wide; a card is ~398px, so the same multiplier made
                the logo 72.8% of the card against 39.9% of the hero and drove
                it straight through the CARFAX badge on the left and the
                feature pills on the right. At 0.63 it is 158.8px = 39.9% of
                the card — the same fraction the VDP shows. Measured, not
                guessed. */}
            <div className="pointer-events-auto scale-[0.42] @min-[330px]:scale-[0.52] @min-[380px]:scale-[0.63] origin-top">
              <DealerCluster
                compact
                rating={googleReviews.rating}
                reviewCount={googleReviews.reviewCount}
                reviewsUrl={SITE_CONFIG.reviews.google.readUrl}
              />
            </div>
          </div>
        )}

        {/* Top-right column: compact feature pill stack only. Right-
            aligned, mirrors the VDP. */}
        {/* w-[32%] gives the pill column an actual layout width so max-w
            inside the cluster resolves correctly and long pill labels
            truncate instead of spanning to the card center.

            32%, was 40%: with the logo corrected to 158.8px the pill column
            still ran 7.5px into it. 32% -> 95.5px visible, starting at 294.5
            against the logo's right edge at 278.5 — 16px of daylight. */}
        {!isComingSoon && (
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 flex flex-col items-end gap-1 w-[32%] scale-75 origin-top-right">
            <FeaturePillCluster pills={overlay.featurePills} compact stack="inline" />
          </div>
        )}

        {/* Warranty intentionally NOT shown on cards — it's a VDP-level
            signal. Putting it on the card crowds the bottom row at compact
            widths and conflicts with the phone CTA, which is the higher
            priority callout (bypasses third-party spoofed lead numbers). */}

        {/* Bottom-left: phone CTA with the site URL stacked under it.
            (Anchored left so it can't collide with the dealer cluster on the
            right at narrow card widths.)

            The VDP puts the URL bottom-CENTRE. That is impossible on a card:
            the phone is 119px and the Google lockup 121px, so on a 298px card
            they already take 240px and leave a 31.7px centre gap. Measured max
            width for a centred URL — 398px card 96px, 341px card 63px, 298px
            card nothing — works out at a 4-7px font, i.e. present but
            unreadable. Stacking it under the phone keeps the mark, keeps it
            legible, and keeps the corner it belongs to.

            0.72 puts it at ~120px, matching the phone above it. */}
        {!cardHasBakedHero && !isComingSoon && (
          <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 z-10 flex flex-col items-start gap-0.5">
            <PhoneCTA
              phone={SITE_CONFIG.phone}
              phoneRaw={SITE_CONFIG.phoneRaw}
              compact
            />
            <div className="scale-[0.72] origin-bottom-left">
              <UrlBadge compact />
            </div>
          </div>
        )}

        {/* Bottom-right column: NO DEALER FEES over the Google lockup, the same
            order and stacking the VDP hero uses. Both sit in ONE scaled
            wrapper, which is what keeps them the same width — the two badges
            have near-identical natural widths (184.3 vs 185.9), so any shared
            scale lands them matched, exactly as on the VDP.

            Scale stays 0.76 rather than dropping to the VDP's proportion: the
            lockup carries real text and "132+ reviews" is unreadable smaller.
            Nothing collides bottom-right, so legibility wins over proportion.

            Hidden when baked into the hero pixels. */}
        {!cardHasBakedHero && !isComingSoon && (
          <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 z-10">
            <div className="flex flex-col items-end gap-1 scale-[0.76] origin-bottom-right">
              {showNoFeeBadge && (
                <NoDealerFeesBadge copy={badgeConfig?.no_fee_badge_copy} compact />
              )}
              <GoogleReviewsLockup
                rating={googleReviews.rating}
                reviewCount={googleReviews.reviewCount}
                reviewsUrl={SITE_CONFIG.reviews.google.readUrl}
              />
            </div>
          </div>
        )}

        {/* Coming Soon diagonal ribbon — top-left corner of the photo area.
            Parent has overflow-hidden so the corners clip automatically.
            Only shown when the vehicle has no photos yet (isComingSoon). */}
        {isComingSoon && (
          <div
            className="absolute bg-brand-red text-white font-bold text-center z-20 pointer-events-none"
            style={{
              top: '24px',
              right: '-38px',
              width: '148px',
              padding: '6px 0',
              fontSize: '10px',
              letterSpacing: '0.08em',
              transform: 'rotate(45deg)',
            }}
            aria-hidden="true"
          >
            COMING SOON
          </div>
        )}
      </div>

      {/* Info area */}
      <div className="p-4">
        <h3 className="font-bold text-brand-gray-900 group-hover:text-brand-red transition-colors">
          <Link
            href={`/inventory/${vehicle.slug}`}
            className="before:absolute before:inset-0 before:z-[2] before:content-['']"
          >
            {vehicle.year} {vehicle.make} {vehicle.model}
          </Link>
        </h3>
        <p className="text-sm text-brand-gray-500 mt-0.5">{vehicle.trim}</p>
        {vehicle.vin && (
          <p className="text-xs text-brand-gray-400 mt-0.5 font-mono tracking-wide">
            {c.vin}: {vehicle.vin}
          </p>
        )}

        <div className="flex items-baseline justify-between mt-3">
          <span className="text-xl font-bold text-brand-red">
            {formattedPrice}
          </span>
          <span className="text-sm text-brand-gray-500">
            {formattedMileage} {c.mi}
          </span>
        </div>

        {/* E1-r (2026-07-21, Jeremiah): AS-IS chip removed — the blanket
            default-true flag was labeling vehicles as-is that are not.
            As-is terms are handled at signing, not in listing chrome. */}
        {isComingSoon && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-red flex-shrink-0" aria-hidden="true" />
            <span className="text-xs text-brand-red font-medium tracking-[0.04em]">
              Photos coming soon
            </span>
          </div>
        )}

        <p className="text-sm text-brand-gray-500 mt-1">
          {c.est}{" "}
          <span className="font-semibold text-brand-gray-700">
            ${monthlyPayment}{c.perMo}
          </span>
          <span
            className="text-xs text-brand-gray-400 ml-1"
            title={c.disclaimer}
          >
            *
          </span>
        </p>

        {/* CarGurus Deal Rating Badge — replaced in-place by the async SDK.
            Renders nothing until hydrated so there is zero layout shift. */}
        {vehicle.vin && vehicle.price > 0 && (
          <span
            data-cg-vin={vehicle.vin}
            data-cg-price={String(Math.round(vehicle.price))}
            data-cg-height="40"
            className="block mt-2 empty:hidden [&_img]:inline-block [&_img]:max-w-full"
          />
        )}

        {/* Spec chips — drivetrain + first 2 features */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          {vehicle.drivetrain !== "FWD" && (
            <span className="text-xs bg-brand-gray-100 text-brand-gray-700 px-2 py-0.5 rounded-full">
              {vehicle.drivetrain}
            </span>
          )}
          {vehicle.features.slice(0, 2).map((feature) => (
            <span
              key={feature}
              className="text-xs bg-brand-gray-100 text-brand-gray-700 px-2 py-0.5 rounded-full"
            >
              {feature.length > 20 ? feature.slice(0, 18) + "..." : feature}
            </span>
          ))}
        </div>

        <div className="mt-3 text-sm text-brand-red font-semibold group-hover:underline">
          {c.viewDetails}
        </div>
      </div>
    </article>
  );
}
     