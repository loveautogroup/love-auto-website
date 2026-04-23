import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sampleInventory, getVehicleBySlug } from "@/data/inventory";
import { VehicleSchema, BreadcrumbSchema } from "@/components/StructuredData";
import { SITE_CONFIG } from "@/lib/constants";
import PhotoGallery from "@/components/PhotoGallery";
import VDPTabs from "@/components/VDPTabs";
import VDPTrustStrip from "@/components/VDPTrustStrip";
import VDPPaymentCalculator from "@/components/VDPPaymentCalculator";
import VDPMarketPrice from "@/components/VDPMarketPrice";
import MobileCalculatorButton from "@/components/MobileCalculatorButton";
import VDPFAQ from "@/components/VDPFAQ";
import ShowCarfaxButton from "@/components/ShowCarfaxButton";
import { MERCHANDISING, resolveOverlay } from "@/data/merchandising";

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
  return sampleInventory.map((vehicle) => ({
    slug: vehicle.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = getVehicleBySlug(slug);
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
  const ogImage = vehicle.images?.[0];

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
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };
}

export default async function VehicleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vehicle = getVehicleBySlug(slug);
  if (!vehicle) notFound();

  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(vehicle.price);

  const formattedMileage = new Intl.NumberFormat("en-US").format(
    vehicle.mileage
  );

  const monthlyPayment = estimateMonthlyPayment(vehicle.price);

  // Pull merchandising overlay for market estimate (Jordan-researched).
  const overlay = resolveOverlay(vehicle.vin, vehicle.daysOnLot, vehicle.status);

  // Text Us number — Jordan-configurable in admin, falls back to main shop phone.
  const textPhone = MERCHANDISING.textPhone ?? SITE_CONFIG.phoneRaw;
  const textBody = encodeURIComponent(
    `Hi! I'm interested in the ${vehicle.year} ${vehicle.make} ${vehicle.model} on your website.`
  );
  const smsHref = `sms:+1${textPhone}?&body=${textBody}`;

  const similarVehicles = sampleInventory
    .filter(
      (v) =>
        v.id !== vehicle.id &&
        v.status === "available" &&
        (v.make === vehicle.make || v.bodyStyle === vehicle.bodyStyle)
    )
    .slice(0, 3);

  return (
    <>
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

        <div className="lg:grid lg:grid-cols-[1fr_380px] lg:gap-8">
          {/* Left column — photos + tabbed details.
              min-w-0 keeps the 1fr column from blowing out and pushing the
              sidebar off-screen when the gallery hero photo is full-width. */}
          <div className="min-w-0">
            {/* Photo Gallery */}
            <PhotoGallery
              images={vehicle.images}
              alt={`${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim} ${vehicle.exteriorColor}`}
              vehicle={vehicle}
            />

            {/* Vehicle Title (mobile) */}
            <div className="lg:hidden mt-6 mb-4">
              <h1 className="text-2xl font-bold text-brand-gray-900">
                {vehicle.year} {vehicle.make} {vehicle.model}{" "}
                <span className="text-brand-gray-500 font-normal">
                  {vehicle.trim}
                </span>
              </h1>
              <div className="flex items-baseline gap-3 mt-2">
                <p className="text-3xl font-bold text-brand-red">
                  {formattedPrice}
                </p>
                <p className="text-sm text-brand-gray-500">
                  Est. ${monthlyPayment}/mo*
                </p>
              </div>
              <p className="text-sm text-brand-gray-500 mt-1">
                {formattedMileage} miles · {vehicle.drivetrain} · {vehicle.exteriorColor}
              </p>
              {/* Mobile Show Carfax — inline next to the title so it's
                  impossible to miss. The tiny badge on the photo alone
                  isn't obvious enough to mobile users. */}
              {overlay.carfax && (
                <div className="mt-3">
                  <ShowCarfaxButton vin={vehicle.vin} variant="inline" />
                </div>
              )}
            </div>

            {/* Market price comparison — only renders when Jordan has set
                a marketEstimate in the merchandising overlay. */}
            {overlay.marketEstimate && (
              <div className="mt-4 lg:mt-6">
                <VDPMarketPrice
                  askingPrice={vehicle.price}
                  marketEstimate={overlay.marketEstimate}
                />
              </div>
            )}

            {/* Tabbed Content — Overview, Features, History, Financing */}
            <VDPTabs
              vehicle={vehicle}
              formattedPrice={formattedPrice}
              formattedMileage={formattedMileage}
              monthlyPayment={monthlyPayment}
            />

            {/* Vehicle-specific FAQ — emits FAQPage JSON-LD for rich-result
                eligibility in SERPs. Generated dynamically from the
                vehicle's specs + warranty overlay. */}
            <div className="mt-8">
              <VDPFAQ vehicle={vehicle} warranty={overlay.warranty} />
            </div>
          </div>

          {/* Right column — CTA panel (desktop) */}
          <div className="hidden lg:block">
            <div className="sticky top-24 bg-white rounded-xl border border-brand-gray-200 p-6 space-y-5">
              <div>
                <h1 className="text-xl font-bold text-brand-gray-900">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h1>
                <p className="text-sm text-brand-gray-500">{vehicle.trim}</p>
                <p className="text-3xl font-bold text-brand-red mt-3">
                  {formattedPrice}
                </p>
                <p className="text-sm text-brand-gray-500 mt-1">
                  Est. <span className="font-semibold">${monthlyPayment}/mo</span>*
                </p>
                <p className="text-sm text-brand-gray-500 mt-1">
                  {formattedMileage} miles · {vehicle.drivetrain}
                </p>
              </div>

              {vehicle.status === "available" && (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-green">
                  <span className="w-2 h-2 bg-brand-green rounded-full animate-pulse" />
                  Available
                </span>
              )}

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
                <a
                  href={smsHref}
                  className="flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
                    <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
                  </svg>
                  Text Us
                </a>
                <Link
                  href={`/contact?vehicle=${encodeURIComponent(`${vehicle.year} ${vehicle.make} ${vehicle.model}`)}`}
                  className="flex items-center justify-center w-full border-2 border-brand-gray-200 hover:border-brand-red text-brand-gray-700 hover:text-brand-red py-3 rounded-xl font-semibold transition-colors"
                >
                  Ask a Question
                </Link>
              </div>

              {/* Show Carfax — explicit labeled CTA. The small badge on
                  the photo alone isn't obvious enough to most buyers, per
                  Jeremiah's feedback. */}
              {overlay.carfax && (
                <div className="pt-1">
                  <ShowCarfaxButton vin={vehicle.vin} variant="wide" />
                </div>
              )}

              {/* Interactive payment calculator — replaces the static
                  $/mo line and the standalone "Get Financing" button.
                  Calculator's CTA goes straight to /financing pre-filled. */}
              <VDPPaymentCalculator
                vehiclePrice={vehicle.price}
                vehicleSlug={vehicle.slug}
                vehicleLabel={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
              />

              <div className="pt-4 border-t border-brand-gray-100 text-center">
                <p className="text-xs text-brand-gray-400">
                  Love Auto Group · Villa Park, IL
                </p>
              </div>
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
          <a
            href={smsHref}
            className="flex-1 flex items-center justify-center gap-1.5 bg-blue-600 text-white py-3 rounded-xl font-semibold text-sm"
            aria-label="Text us"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden="true">
              <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" />
            </svg>
            Text
          </a>
          <MobileCalculatorButton
            vehiclePrice={vehicle.price}
            vehicleSlug={vehicle.slug}
            vehicleLabel={`${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          />
        </div>

        {/* Similar Vehicles */}
        {similarVehicles.length > 0 && (
          <section className="mt-16" aria-labelledby="similar-heading">
            <h2
              id="similar-heading"
              className="text-2xl font-bold text-brand-gray-900 mb-6"
            >
              Similar Vehicles
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {similarVehicles.map((v) => (
                <Link
                  key={v.id}
                  href={`/inventory/${v.slug}`}
                  className="bg-white rounded-xl border border-brand-gray-200 p-4 hover:shadow-md hover:border-brand-red/30 transition-all"
                >
                  <div className="aspect-[4/3] bg-brand-gray-100 rounded-lg mb-3" />
                  <h3 className="font-bold text-brand-gray-900">
                    {v.year} {v.make} {v.model}
                  </h3>
                  <p className="text-brand-red font-bold mt-1">
                    {new Intl.NumberFormat("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    }).format(v.price)}
                  </p>
                  <p className="text-sm text-brand-gray-500">
                    {new Intl.NumberFormat().format(v.mileage)} mi ·{" "}
                    {v.drivetrain}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </article>
    </>
  );
}
