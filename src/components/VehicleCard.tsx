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
import HeroBadgeOverlay, { heroBadgeStatus } from "./badges/HeroBadgeOverlay";
import { useReviews } from "@/context/ReviewsContext";

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
  const { t } = useLanguage();
  const c = t.card;

  // Sold-vehicle history (Jeremiah, 2026-09-15). Only cars with a real photo
  // of ours ever reach this card in the "sold" state at all (see
  // shared/ownPhoto.ts + InventoryGrid/page.tsx) — the price is already null
  // on the wire (Railway hides it), so this is purely presentational: a
  // clear SOLD mark where the price was, no "$X/mo" estimate, no CarGurus
  // deal-rating badge (that's already gated on price > 0 below).
  const isSold = vehicle.status === "sold";

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
  // Never true for a sold card: only vehicles with a real photo of ours
  // ever reach this component in the "sold" state (see hasOwnPhoto gating
  // upstream), so "no photos anywhere" cannot legitimately fire here, and a
  // SOLD car is never "coming soon" regardless.
  const isComingSoon = !isSold && (noPhotosAnywhere || forcePlaceholder);

  const initialHero = (forcePlaceholder || noPhotosAnywhere)
    ? COMING_SOON_PLACEHOLDER
    : (heroOverride ?? orderedImages[0] ?? "");

  // onError fallback — if the chosen hero URL 404s or fails to load
  // (DealerCenter CDN flake, deleted seed asset, etc.), fall back to
  // the branded Coming Soon placeholder. Local state so the swap
  // survives re-render.
  const [heroSrc, setHeroSrc] = useState<string>(initialHero);
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
        bg-white overflow-hidden
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
      <div className="@container relative aspect-[4/3] bg-brand-gray-100 overflow-hidden">
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

        {/* Hero badges — the owner-approved FINAL design (2026-10-04), the
            same component as the VDP hero and the HTML twin of the baked
            picture (BAKE RULES). cqw-sized against this @container card, so a
            298px card is the 300px-thumbnail check the owner approved. Sold
            cards get the Sold picture too (grey photo + SOLD stamp). */}
        {!isComingSoon && (
          <HeroBadgeOverlay
            status={heroBadgeStatus(isSold ? "sold" : vehicle.status)}
            pills={vehicle.badgePills ?? []}
            rating={googleReviews.rating}
            phone={SITE_CONFIG.phone.replace(/[()]/g, "").replace(/\s+/g, "-")}
            phoneHref={`tel:${SITE_CONFIG.phoneRaw}`}
            reviewsUrl={SITE_CONFIG.reviews.google.readUrl}
          />
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

      {/* Info area — "spec row": title + price on one line, a hairline,
          then a meta row (mileage / drivetrain / features) in micro-label
          uppercase, VIN in a small tabular treatment, "View details" as a
          text link with a sliding arrow. Card drops the shadow/radius; a
          red 2px left rule appears on hover instead. */}
      <div className="pt-4 pb-1 border-l-0 group-hover:border-l-[3px] border-brand-red pl-0 group-hover:pl-3.5 transition-[padding,border-color] duration-150">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="font-heading font-bold text-brand-gray-900 text-[1.02rem] leading-tight group-hover:text-brand-red transition-colors">
            <Link
              href={`/inventory/${vehicle.slug}`}
              className="before:absolute before:inset-0 before:z-[2] before:content-['']"
            >
              {vehicle.year} {vehicle.make} {vehicle.model}
            </Link>
          </h3>
          {/* Jeremiah, 2026-09-15: a sold car's price never shows again —
              SOLD renders where the price was. The red top-left StatusPill
              (kind="sold", see merchandising.ts pickStatusPill) already
              marks the card; this is the second, unmissable place the same
              fact belongs — the line a shopper reads for the number. */}
          {isSold ? (
            <span className="text-lg font-heading font-extrabold text-brand-gray-400 uppercase tracking-wide whitespace-nowrap">
              {c.sold}
            </span>
          ) : (
            <span className="text-lg font-heading font-extrabold text-brand-red whitespace-nowrap">
              {formattedPrice}
            </span>
          )}
        </div>
        <p className="text-sm text-brand-gray-500 mt-0.5">{vehicle.trim}</p>

        <hr className="border-t border-ink-200 my-3" />

        <div className="flex flex-wrap gap-x-3.5 gap-y-1">
          <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-gray-500">
            {formattedMileage} {c.mi}
          </span>
          {vehicle.drivetrain !== "FWD" && (
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-gray-500">
              {vehicle.drivetrain}
            </span>
          )}
          {vehicle.features.slice(0, 2).map((feature) => (
            <span
              key={feature}
              className="text-[11px] font-semibold uppercase tracking-[0.08em] text-brand-gray-500"
            >
              {feature.length > 20 ? feature.slice(0, 18) + "..." : feature}
            </span>
          ))}
        </div>

        {vehicle.vin && (
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.1em] text-brand-gray-400">
              {c.vin}
            </span>
            <span className="text-[11px] font-mono tabular-nums tracking-[0.03em] text-brand-gray-400">
              {vehicle.vin}
            </span>
          </div>
        )}

        {/* E1-r (2026-07-21, Jeremiah): AS-IS chip removed — the blanket
            default-true flag was labeling vehicles as-is that are not.
            As-is terms are handled at signing, not in listing chrome. */}
        {isComingSoon && (
          <div className="flex items-center gap-1.5 mt-2">
            <span className="w-1.5 h-1.5 bg-brand-red flex-shrink-0" aria-hidden="true" />
            <span className="text-xs text-brand-red font-medium tracking-[0.04em]">
              Photos coming soon
            </span>
          </div>
        )}

        {/* No monthly-payment estimate on a sold card — there is nothing
            left to finance. */}
        {!isSold && (
          <p className="text-sm text-brand-gray-500 mt-2">
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
        )}

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

        <div className="mt-3 inline-flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-[0.08em] text-brand-red border-b border-current pb-0.5">
          {c.viewDetails}
          <svg className="w-3 h-3 transition-transform duration-150 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </article>
  );
}
     