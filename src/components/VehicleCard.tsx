"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { Vehicle } from "@/lib/types";
import { SITE_CONFIG } from "@/lib/constants";
import { useInventory } from "@/lib/useInventory";
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
} from "./badges";

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
  // Runtime hook — re-renders when /api/merchandising resolves so DMS-saved
  // overlays (carfax shield, feature pills, status badge, hidden flag) take
  // effect immediately instead of waiting for a Cloudflare Pages rebuild.
  const overlay = useResolveOverlay(
    vehicle.vin,
    vehicle.daysOnLot,
    vehicle.status,
    vehicle.recentlyReduced ?? false
  );

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
    if (
      live &&
      Array.isArray(live.images) &&
      live.images.length > 0 &&
      live.images[0] !== vehicle.images[0]
    ) {
      heroOverride = live.images[0];
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
  // branded Coming Soon placeholder as the hero. Also auto-applies when
  // the vehicle has no photos anywhere so the grid never shows an empty box.
  const forcePlaceholder =
    overlay.useComingSoonPlaceholder === true || noPhotosAnywhere;

  const initialHero = forcePlaceholder
    ? COMING_SOON_PLACEHOLDER
    : (heroOverride ?? orderedImages[0] ?? "");

  // onError fallback — if the chosen hero URL 404s or fails to load
  // (DealerCenter CDN flake, deleted seed asset, etc.), drop to the
  // empty-state SVG by clearing heroSrc. Local state so the swap
  // survives re-render.
  const [heroSrc, setHeroSrc] = useState<string>(initialHero);

  // Sync heroSrc when forcePlaceholder changes after KV hydrates.
  // useState(initialHero) only runs on mount — if the KV config loads
  // after the component mounts, the toggle flip from false → true
  // was previously silently ignored. This effect keeps heroSrc in sync.
  useEffect(() => {
    setHeroSrc(
      forcePlaceholder
        ? COMING_SOON_PLACEHOLDER
        : (heroOverride ?? orderedImages[0] ?? "")
    );
  }, [forcePlaceholder]); // eslint-disable-line react-hooks/exhaustive-deps

  const heroImage = heroSrc;
  // Render the <Image> only when there's a real source. Empty string
  // means "no photo, no placeholder" → fall through to the SVG branch.
  const showImage = (hasRealImage || liveHasImages || forcePlaceholder) && heroSrc !== "";

  return (
    <article
      className="
        group relative
        bg-white rounded-xl border border-brand-gray-200 overflow-hidden
        hover:shadow-lg hover:border-brand-red/30 transition-all duration-200
      "
    >
      {/* Photo + full overlay (compact-scaled) */}
      <div className="relative aspect-[4/3] bg-brand-gray-100 overflow-hidden">
        {showImage ? (
          <Image
            src={heroImage}
            alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            onError={() => {
              // Drop to the empty-state SVG by clearing the source.
              // Previously fell back to the branded Coming Soon image —
              // removed per the "no default image" change.
              if (heroSrc !== "") setHeroSrc("");
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

        {/* Gradient scrim for overlay legibility */}
        <PhotoScrim />

        {/* Top-left column: full Carfax + status cluster — shield,
            active Carfax pills, status pill (in that vertical order).
            Mirrors the VDP hero so the inventory grid feels consistent.
            Shield scaled 32% on mobile / 40% on sm+ (smaller for tighter card overlay); pills + status
            render at compact size. */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 z-10 flex flex-col items-start gap-1">
          <div className="cf [&_.cf]:scale-[0.32] sm:[&_.cf]:scale-[0.40] [&_.cf]:origin-top-left">
            <CarfaxBadge vin={vehicle.vin} />
          </div>
          <CarfaxPillStack overlay={overlay} compact />
          {overlay.effectiveStatus && (
            <StatusPill kind={overlay.effectiveStatus} />
          )}
        </div>

        {/* Top-right column: compact feature pill stack only. Right-
            aligned, mirrors the VDP. */}
        <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-10 flex flex-col items-end gap-1">
          <FeaturePillCluster pills={overlay.featurePills} compact stack="inline" />
        </div>

        {/* Warranty intentionally NOT shown on cards — it's a VDP-level
            signal. Putting it on the card crowds the bottom row at compact
            widths and conflicts with the phone CTA, which is the higher
            priority callout (bypasses third-party spoofed lead numbers). */}

        {/* Bottom-left: compact phone CTA (anchored left so it can't collide
            with the dealer cluster on the right at narrow card widths). */}
        <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 z-10">
          <PhoneCTA
            phone={SITE_CONFIG.phone}
            phoneRaw={SITE_CONFIG.phoneRaw}
            compact
          />
        </div>

        {/* Bottom-right: compact dealer + Google */}
        <div className="absolute bottom-1.5 right-1.5 sm:bottom-2 sm:right-2 z-10">
          <DealerCluster
            rating={SITE_CONFIG.reviews.google.rating}
            reviewCount={SITE_CONFIG.reviews.google.count}
            reviewsUrl={SITE_CONFIG.reviews.google.readUrl}
            compact
          />
        </div>
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

        <div className="flex items-baseline justify-between mt-3">
          <span className="text-xl font-bold text-brand-red">
            {formattedPrice}
          </span>
          <span className="text-sm text-brand-gray-500">
            {formattedMileage} mi
          </span>
        </div>

        <p className="text-sm text-brand-gray-500 mt-1">
          Est.{" "}
          <span className="font-semibold text-brand-gray-700">
            ${monthlyPayment}/mo
          </span>
          <span
            className="text-xs text-brand-gray-400 ml-1"
            title="Based on $1,000 down, 6.99% APR, 60 months"
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
            className="block mt-2"
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

        <div className="mt-4 text-sm text-brand-red font-semibold group-hover:underline">
          View Details →
        </div>
      </div>
    </article>
  );
}
                                                                                    