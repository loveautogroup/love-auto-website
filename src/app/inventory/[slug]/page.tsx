import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sampleInventory, getVehicleBySlug } from "@/data/inventory";
import { fetchDmsInventory, syncedToVehicle, fetchGlobalBadgeConfig } from "@/lib/dmsInventory";
import { VehicleSchema, BreadcrumbSchema } from "@/components/StructuredData";
import { applyPhotoOrder } from "@/data/photoOrder";
import { SITE_CONFIG } from "@/lib/constants";
import PhotoGallery from "@/components/PhotoGallery";
import VDPTabs from "@/components/VDPTabs";
import VDPTrustStrip from "@/components/VDPTrustStrip";
import VDPPaymentCalculator from "@/components/VDPPaymentCalculator";
import VDPMarketPrice from "@/components/VDPMarketPrice";
import MobileCalculatorButton from "@/components/MobileCalculatorButton";
import VDPFAQ from "@/components/VDPFAQ";
import ShowCarfaxButton from "@/components/ShowCarfaxButton";
import VDPReviews from "@/components/VDPReviews";
import VDPInquireButton from "@/components/VDPInquireButton";
import VDPTextUsLink from "@/components/VDPTextUsLink";
import VDPVinSignal from "@/components/VDPVinSignal";
import VDPTracker from "@/components/VDPTracker";
import {
  VDPLivePrice,
  VDPLiveMileage,
  VDPLiveStatus,
} from "@/components/VDPLivePrice";
import {
  VDPCarfaxButton,
  VDPMarketPriceWrap,
} from "@/components/VDPMerchandisingWrappers";
import VDPWalkaround from "@/components/VDPWalkaround";
import VDPReconHighlights from "@/components/VDPReconHighlights";
import { MERCHANDISING, resolveOverlay } from "@/data/merchandising";
import SimilarVehiclesCarousel from "@/components/SimilarVehiclesCarousel";

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

export async function generateStaticParams() {
  // Build-time fetch of the live DMS inventory so VDPs for vehicles that
  // exist only in DealerCenter (i.e. not yet hand-added to the seed file)
  // get pre-rendered. On DMS failure, fall back to seed-only — the build
  // never breaks because of an upstream outage.
  const live = await fetchDmsInventory();
  const slugs = new Set<string>();
  for (const v of sampleInventory) slugs.add(v.slug);
  for (const v of live) slugs.add(v.slug);
  return Array.from(slugs).map((slug) => ({ slug }));
}


async function resolveVehicle(slug: string) {
  // Prefer live DMS — has current photos, price, and status.
  // Fall back to seed only for vehicles absent from the DMS feed.
  const live = await fetchDmsInventory();
  const dmsMatch = live.find((v) => v.slug === slug);
  if (dmsMatch) return syncedToVehicle(dmsMatch);

  return getVehicleBySlug(slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = await resolveVehicle(slug);
  if (!vehicle) return {};

  // Mark's approved VDP title template with fallback for trim overflow.
  // Full form: "{Year} {Make} {Model} {Trim} for Sale | Love Auto Group"
  // If over 60 chars, drop the trim to keep Google SERP clean.
  const base = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const withTrim = `${base} ${vehicle.trim} for Sale | Love Auto Group`;
  const withoutTrim = `${base} for Sale | Love Auto Group`;
  const title = withTrim.length <= 60 ? withTrim : withoutTrim;

  const formattedMileage = new Intl.NumberFormat().format(vehicle.mileage);
  const description = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim} for sale in Villa Park, IL. ${formattedMileage} miles, ${vehicle.drivetrain}. Carefully selected and fully reconditioned at Love Auto Group.`;

  const url = `https://www.loveautogroup.net/inventory/${slug}/`;
  // Hero photo for social-share preview reflects Jordan's manifest, so
  // the Facebook/iMessage preview is the front 3/4 — not whatever
  // Dealer Center happened to export as image #1.
  const orderedImages = applyPhotoOrder(vehicle.slug, vehicle.images ?? []);
  // Fall back to site-wide OG image for vehicles with no photos yet so
  // Facebook/iMessage always renders *something* instead of a blank card.
  // Prefer the branded baked hero for social-share previews (Facebook,
  // iMessage) — it carries the dealer badges in the pixels. On-page hero
  // display still uses the raw photo + interactive HTML overlays.
  const ogImageUrl =
    vehicle.bakedHeroUrl ??
    orderedImages[0] ??
    "https://www.loveautogroup.net/og-image.png";
  const ogImageAlt = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim} — Love Auto Group`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Love Auto Group",
      // width/height are required for Facebook crawler to reliably render
      // the preview card without timing out on a dimension-detection fetch.
      images: [{ url: ogImageUrl, width: 1200, height: 900, alt: ogImageAlt }],
    },
  };
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [vehicle, badgeConfig] = await Promise.all([
    resolveVehicle(slug),
    fetchGlobalBadgeConfig(),
  ]);
  if (!vehicle) notFound();

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

  // Nationwide-shipping badge — rendered under the CARFAX button (desktop + mobile).
  const shippingBanner = (
    <div className="flex items-center gap-2.5">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6 text-brand-red shrink-0"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1" />
      </svg>
      <div className="leading-tight">
        <div className="text-sm font-semibold text-brand-gray-900">
          Ships anywhere in the U.S.
        </div>
        <div className="text-[11px] text-brand-gray-500">
          Nationwide delivery available
        </div>
      </div>
    </div>
  );

  // Pull merchandising overlay for market estimate (Jordan-researched).
  // Pass `recentlyReduced` so the build-time hero status pill auto-flips to
  // "Price Reduced" when the DMS public feed reports a price drop in the
  // last 14 days (PhotoGallery's runtime hook also receives the same flag,
  // so the SSR + hydrated states agree).
  const overlay = resolveOverlay(
    vehicle.vin,
    vehicle.daysOnLot,
    vehicle.status,
    vehicle.recentlyReduced ?? false
  );

  // Default Text Us number for the build-time render. The VDPTextUsLink
  // client component will fetch /api/merchandising on mount and override
  // with overlay.textPhone if Jordan/Jeremiah set one in the DMS — that's
  // the runtime path. Server-rendered HTML uses this default so users
  // without JS still get a working link.
  const textPhoneDefault =
    overlay.textPhone ?? MERCHANDISING.textPhone ?? SITE_CONFIG.phoneRaw;
  const textBodyRaw = `Hi! I'm interested in the ${vehicle.year} ${vehicle.make} ${vehicle.model} on your website.`;

  return (
    <>
      {/* Tells the floating TextUsButton in the root layout which vehicle
          we're on, so it can pick up overlay.textPhone from the merchandising
          config. Renders nothing. */}
      <VDPVinSignal vin={vehicle.vin} />
      <VDPTracker
        vehicle={{
          vin: vehicle.vin,
          year: vehicle.year,
          make: vehicle.make,
          model: vehicle.model,
          trim: vehicle.trim,
          price: vehicle.price,
          stockNumber: vehicle.stockNumber,
        }}
      />
      <VehicleSchema vehicle={vehicle} />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.loveautogroup.net/" },
          { name: "Inventory", url: "https://www.loveautogroup.net/inventory/" },
          {
            name: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
            url: `https://www.loveautogroup.net/inventory/${vehicle.slug}/`,
          },
        ]}
      />

      {/* Breadcrumb */}
      <nav
        className="max-w-7xl mx-auto px-4 py-4 text-sm"
        aria-label="Breadcrumb"
      >
        <ol className="flex items-center gap-2 text-brand-gray-500">
          <li>
            <Link href="/" className="hover:text-brand-red">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/inventory" className="hover:text-brand-red">
              Inventory
            </Link>
          </li>
          <li>/</li>
          <li className="text-brand-gray-900 font-medium">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </li>
        </ol>
      </nav>

      {/* pb-32 on mobile gives clearance for the fixed Call/Text/Calc bar
          (~76px tall). lg+ drops back to pb-16 since the sticky bar is hidden. */}
      <article className="max-w-7xl mx-auto px-4 pb-32 lg:pb-16">
        {/* Trust strip — quick brand signal above the gallery */}
        <VDPTrustStrip />

        <div className="flex flex-col gap-8">
          {/* Above-the-fold summary (compact). Google vehicle-ads review
              needs name/price/VIN/mileage/availability visible on load; IL law
              needs the doc + e-filing fees itemized. Left = vehicle + price +
              fees; right = nationwide shipping. Internet Price === feed price. */}
          <div className="bg-white rounded-xl border border-brand-gray-200 px-4 py-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              {/* Left — vehicle, price, fees */}
              <div className="min-w-0">
                <div className="flex items-baseline flex-wrap gap-x-3 gap-y-1">
                  <span className="text-base sm:text-lg font-bold text-brand-gray-900">
                    {vehicle.year} {vehicle.make} {vehicle.model}
                  </span>
                  {vehicle.price > 0 && (
                    <span className="text-2xl font-bold text-brand-red leading-none">
                      <VDPLivePrice vin={vehicle.vin} fallback={formattedPrice} />
                    </span>
                  )}
                </div>
                <div className="flex items-center flex-wrap gap-x-2.5 gap-y-1 mt-1 text-xs text-brand-gray-600">
                  <span>
                    <VDPLiveMileage vin={vehicle.vin} fallback={formattedMileage} /> miles
                  </span>
                  {vehicle.exteriorColor && (
                    <>
                      <span className="text-brand-gray-300">·</span>
                      <span>{vehicle.exteriorColor}</span>
                    </>
                  )}
                  <span className="text-brand-gray-300">·</span>
                  <VDPLiveStatus vin={vehicle.vin} fallback={vehicle.status} />
                  {vehicle.vin && (
                    <>
                      <span className="text-brand-gray-300">·</span>
                      <span className="font-mono text-brand-gray-400">
                        VIN {vehicle.vin}
                      </span>
                    </>
                  )}
                </div>
                <div className="inline-flex items-center gap-1.5 mt-2 rounded-md border border-green-200 bg-green-50 px-2.5 py-1">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-3.5 w-3.5 shrink-0 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs font-semibold text-green-800">
                    No dealer fees
                  </span>
                  <span className="text-xs text-green-700">
                    — just tax, title &amp; license
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Hero block — photos + tabbed details now span the full content
              width on every breakpoint. The right-side sidebar has been
              moved BELOW the hero (rendered later in this file) so the
              gallery dominates the page. */}
          <div className="min-w-0">
            {/* Photo Gallery */}
            <PhotoGallery
              images={vehicle.images}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim} ${vehicle.exteriorColor}`}
              vehicle={vehicle}
              badgeConfig={badgeConfig}
            />

            {/* Desktop price + CTAs + Carfax + payment calculator —
                lives directly under the gallery (per Jeremiah, 2026-04-30).
                Previously sat at the bottom of the page below FAQ/Reviews;
                moving it up keeps the buying decision stack adjacent to
                the photos without burying it. Hidden on mobile — the
                existing lg:hidden title block + sticky CTA bar already
                cover that case. */}
            <div className="hidden lg:block mt-6 mb-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-white rounded-xl border border-brand-gray-200 p-6 space-y-5">
                  <div>
                    <h1 className="text-xl font-bold text-brand-gray-900">
                      {vehicle.year} {vehicle.make} {vehicle.model}
                    </h1>
                    <p className="text-sm text-brand-gray-500">{vehicle.trim}</p>
                    {vehicle.vin && (
                      <p className="text-xs text-brand-gray-400 mt-1 font-mono tracking-wide">
                        VIN: {vehicle.vin}
                      </p>
                    )}
                    <p className="text-3xl font-bold text-brand-red mt-3">
                      <VDPLivePrice vin={vehicle.vin} fallback={formattedPrice} />
                    </p>
                    <p className="text-sm text-brand-gray-500 mt-1">
                      Est. <span className="font-semibold">${monthlyPayment}/mo</span>*
                    </p>
                    <p className="text-sm text-brand-gray-500 mt-1">
                      <VDPLiveMileage vin={vehicle.vin} fallback={formattedMileage} /> miles · {vehicle.drivetrain}
                    </p>
                    {/* CarGurus Deal Rating Badge (STYLE1) - next to the price */}
                    {vehicle.vin && vehicle.price > 0 && (
                      <span
                        data-cg-vin={vehicle.vin}
                        data-cg-price={String(Math.round(vehicle.price))}
                        className="block mt-3 empty:hidden [&_img]:inline-block [&_img]:max-w-full"
                      />
                    )}
                  </div>

                  <VDPLiveStatus vin={vehicle.vin} fallback={vehicle.status} />

                  <div className="space-y-3">
                    <a
                      href={`tel:${SITE_CONFIG.phoneRaw}`}
                      className="flex items-center justify-center gap-2 w-full bg-brand-green hover:bg-green-700 text-white py-3 rounded-xl font-semibold transition-colors"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                        />
                      </svg>
                      Call {SITE_CONFIG.phone}
                    </a>
                    <VDPTextUsLink
                      vin={vehicle.vin}
                      defaultPhone={textPhoneDefault}
                      bodyText={textBodyRaw}
                      className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                        <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                      </svg>
                      Text Us
                    </VDPTextUsLink>
                    {/* Credit application / financing CTA - every VDP */}
                    <a
                      href="/financing"
                      className="flex items-center justify-center gap-2 w-full bg-brand-red hover:bg-brand-red-dark text-white py-3 rounded-xl font-semibold transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Get Pre-Approved
                    </a>
                    <VDPInquireButton
                      vehicleLabel={`${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? " " + vehicle.trim : ""}`}
                      vehicleVin={vehicle.vin}
                      className="w-full"
                    />
                  </div>
                </div>

                {/* Card 2 — Carfax shield CTA */}
                <div className="bg-white rounded-xl border border-brand-gray-200 p-6 flex flex-col justify-center">
                  <VDPCarfaxButton
                    vin={vehicle.vin}
                    daysOnLot={vehicle.daysOnLot}
                    vehicleStatus={vehicle.status}
                    variant="wide"
                  />
                  <div className="mt-4 pt-4 border-t border-brand-gray-100">
                    {shippingBanner}
                  </div>
                </div>

                {/* Card 3 — payment calculator */}
                <div className="bg-white rounded-xl border border-brand-gray-200 p-6">
                  <VDPPaymentCalculator
                    vehiclePrice={vehicle.price}
                    vehicleSlug={vehicle.slug}
                    vehicleLabel={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
                  />
                </div>

                {/* Card 4 — nationwide delivery callout */}
                <div className="bg-brand-navy rounded-xl p-5 flex items-start gap-3">
                  <div className="shrink-0 mt-0.5 w-9 h-9 rounded-full bg-white/10 flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white leading-tight">Ships Anywhere in the US</p>
                    <p className="text-xs text-white/70 mt-1 leading-snug">
                      Can&rsquo;t make it to Villa Park? We can arrange nationwide delivery. Buyer pays transport — call us for a quote.
                    </p>
                    <a
                      href={`tel:${SITE_CONFIG.phoneRaw}`}
                      className="inline-block mt-2 text-xs font-semibold text-brand-red bg-white rounded-full px-3 py-1 hover:bg-brand-red hover:text-white transition-colors"
                    >
                      {SITE_CONFIG.phone} — Ask about delivery
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Vehicle Title (mobile) */}
            <div className="lg:hidden mt-6 mb-4">
              <h1 className="text-2xl font-bold text-brand-gray-900">
                {vehicle.year} {vehicle.make} {vehicle.model}{" "}
                <span className="text-brand-gray-500 font-normal">
                  {vehicle.trim}
                </span>
              </h1>
              {vehicle.vin && (
                <p className="text-xs text-brand-gray-400 mt-1 font-mono tracking-wide">
                  VIN: {vehicle.vin}
                </p>
              )}
              <div className="flex items-baseline gap-3 mt-2">
                <p className="text-3xl font-bold text-brand-red">
                  <VDPLivePrice vin={vehicle.vin} fallback={formattedPrice} />
                </p>
                <p className="text-sm text-brand-gray-500">
                  Est. ${monthlyPayment}/mo*
                </p>
              </div>
              <p className="text-sm text-brand-gray-500 mt-1">
                <VDPLiveMileage vin={vehicle.vin} fallback={formattedMileage} /> miles · {vehicle.drivetrain} · {vehicle.exteriorColor}
              </p>
              {/* CarGurus Deal Rating Badge (STYLE1) - mobile, next to the price */}
              {vehicle.vin && vehicle.price > 0 && (
                <span
                  data-cg-vin={vehicle.vin}
                  data-cg-price={String(Math.round(vehicle.price))}
                  className="block mt-3 empty:hidden [&_img]:inline-block [&_img]:max-w-full"
                />
              )}
              {/* Mobile Show Carfax — inline next to the title so it's
                  impossible to miss. Client wrapper picks up runtime overlay
                  changes from the DMS panel without a site rebuild. */}
              <VDPCarfaxButton
                vin={vehicle.vin}
                daysOnLot={vehicle.daysOnLot}
                vehicleStatus={vehicle.status}
                variant="inline"
              />
              <div className="mt-3">{shippingBanner}</div>
              {/* Credit application / financing CTA (mobile) - every VDP */}
              <a
                href="/financing"
                className="mt-3 flex items-center justify-center gap-2 w-full bg-brand-red hover:bg-brand-red-dark text-white py-3 rounded-xl font-semibold transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Get Pre-Approved
              </a>
            </div>

            {/* Market price comparison — only renders when Jordan has set
                a marketEstimate in the merchandising overlay. Client wrapper
                picks up runtime KV updates without rebuilding. */}
            <VDPMarketPriceWrap
              vin={vehicle.vin}
              daysOnLot={vehicle.daysOnLot}
              vehicleStatus={vehicle.status}
              askingPrice={vehicle.price}
            />

            {/* Ivan's recon checklist — builds trust by showing every step
                of the pre-sale inspection process. Static: same process for
                every vehicle. */}
            <div className="mt-4 lg:mt-6">
              <VDPReconHighlights />
            </div>

            {/* Tabbed Content — Overview, Features, History, Financing */}
            <VDPTabs
              vehicle={vehicle}
              formattedPrice={formattedPrice}
              formattedMileage={formattedMileage}
              monthlyPayment={monthlyPayment}
            />

            {/* Walkaround video — Phase 2 photo pipeline. Renders nothing
                when walkaroundUrl is null (all of Phase 1). Once
                WalkAroundScreen uploads to R2, the DMS public detail
                endpoint populates walkaround_url and this slot activates
                automatically without a code change. */}
            {vehicle.walkaroundUrl && (
              <VDPWalkaround
                walkaroundUrl={vehicle.walkaroundUrl}
                posterUrl={vehicle.walkaroundPosterUrl ?? vehicle.images?.[0]}
                vehicleLabel={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              />
            )}

            {/* Vehicle-specific FAQ — emits FAQPage JSON-LD for rich-result
                eligibility in SERPs. Generated dynamically from the
                vehicle's specs + warranty overlay. */}
            <div className="mt-8">
              <VDPFAQ vehicle={vehicle} />
            </div>

            {/* Customer reviews — live data from Google Places API, with
                Jordan-curated fallback when the API key isn't set. Server-
                fetched at build time; refreshes on every Cloudflare deploy. */}
            <div className="mt-8">
              <VDPReviews />
            </div>
          </div>

        </div>

        {/* Mobile sticky CTA bar — Call + Text + Calculate */}
        <div className="fixed bottom-0 left-0 right-0 lg:hidden bg-white border-t border-brand-gray-200 p-3 flex gap-2 z-40">
          <a
            href={`tel:${SITE_CONFIG.phoneRaw}`}
            className="flex-1 flex items-center justify-center gap-1.5 bg-brand-green text-white py-3 rounded-xl font-semibold text-sm"
            aria-label="Call us"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
              />
            </svg>
            Call
          </a>
          <VDPTextUsLink
            vin={vehicle.vin}
            defaultPhone={textPhoneDefault}
            bodyText={textBodyRaw}
            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm"
            ariaLabel="Text us"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
            </svg>
            Text
          </VDPTextUsLink>
          <MobileCalculatorButton
            vehiclePrice={vehicle.price}
            vehicleSlug={vehicle.slug}
            vehicleLabel={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          />
        </div>

        {/* Similar Vehicles — client component backed by CF KV via useInventory().
            Immune to Railway build-time hibernation because it reads from KV,
            not from the FastAPI backend. Renders nothing while loading or when
            no matches exist. */}
        <SimilarVehiclesCarousel
          currentId={vehicle.id}
          make={vehicle.make}
          bodyStyle={vehicle.bodyStyle ?? ""}
        />
      </article>
    </>
  );
}
