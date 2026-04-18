import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  vehicles,
  getVehicleBySlug,
  getAllSlugs,
  formatPrice,
  formatMileage,
  Vehicle,
} from "@/lib/vehicles";
import {
  BUSINESS_NAME,
  ADDRESS,
  PHONE,
  EMAIL,
  SITE_URL,
} from "@/lib/constants";

// ---------------------------------------------------------------------------
// Static params
// ---------------------------------------------------------------------------
export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

// ---------------------------------------------------------------------------
// Dynamic metadata
// ---------------------------------------------------------------------------
type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const vehicle = getVehicleBySlug(slug);
  if (!vehicle) return { title: "Vehicle Not Found" };

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} for Sale Villa Park IL | ${BUSINESS_NAME}`;
  const description = vehicle.description;

  return {
    title,
    description,
    openGraph: { title, description },
  };
}

// ---------------------------------------------------------------------------
// JSON-LD Structured Data
// ---------------------------------------------------------------------------
function VehicleJsonLd({ vehicle }: { vehicle: Vehicle }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`,
    brand: { "@type": "Brand", name: vehicle.make },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: vehicle.mileage,
      unitCode: "SMI",
    },
    color: vehicle.exteriorColor,
    driveWheelConfiguration: vehicle.drivetrain,
    vehicleTransmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    vehicleIdentificationNumber: vehicle.vin,
    bodyType: vehicle.bodyStyle,
    vehicleEngine: {
      "@type": "EngineSpecification",
      name: vehicle.engine,
    },
    offers: {
      "@type": "Offer",
      price: vehicle.price,
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/UsedCondition",
      seller: {
        "@type": "AutoDealer",
        name: BUSINESS_NAME,
        telephone: PHONE.display,
        email: EMAIL,
        address: {
          "@type": "PostalAddress",
          streetAddress: ADDRESS.street,
          addressLocality: ADDRESS.city,
          addressRegion: ADDRESS.state,
          postalCode: ADDRESS.zip,
          addressCountry: "US",
        },
        url: SITE_URL,
      },
    },
    url: `${SITE_URL}/inventory/${vehicle.slug}`,
    image: `${SITE_URL}/images/vehicles/${vehicle.slug}.jpg`,
    description: vehicle.description,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// ---------------------------------------------------------------------------
// CTA Button Component
// ---------------------------------------------------------------------------
function CtaButton({
  href,
  label,
  variant = "primary",
}: {
  href: string;
  label: string;
  variant?: "primary" | "secondary" | "outline";
}) {
  const base = "inline-flex items-center justify-center rounded-md px-5 py-3 text-sm font-semibold transition w-full sm:w-auto";
  const styles = {
    primary: `${base} bg-[#1B4F72] text-white hover:bg-[#153F5B]`,
    secondary: `${base} bg-green-600 text-white hover:bg-green-700`,
    outline: `${base} border-2 border-[#1B4F72] text-[#1B4F72] hover:bg-[#1B4F72] hover:text-white`,
  };

  return (
    <a href={href} className={styles[variant]}>
      {label}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------
export default async function VehicleDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const vehicle = getVehicleBySlug(slug);
  if (!vehicle) notFound();

  const title = `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`;

  // Pick 3 similar vehicles (same body style or random)
  const similar = vehicles
    .filter((v) => v.id !== vehicle.id)
    .sort((a, b) => {
      if (a.bodyStyle === vehicle.bodyStyle && b.bodyStyle !== vehicle.bodyStyle) return -1;
      if (b.bodyStyle === vehicle.bodyStyle && a.bodyStyle !== vehicle.bodyStyle) return 1;
      return 0;
    })
    .slice(0, 3);

  return (
    <>
      <VehicleJsonLd vehicle={vehicle} />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-gray-500" aria-label="Breadcrumb">
          <ol className="flex items-center gap-1">
            <li>
              <Link href="/" className="hover:text-[#1B4F72]">
                Home
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link href="/inventory" className="hover:text-[#1B4F72]">
                Inventory
              </Link>
            </li>
            <li>/</li>
            <li className="font-medium text-gray-900">{title}</li>
          </ol>
        </nav>

        <h1 className="mb-6 text-3xl font-bold text-[#1B4F72] md:text-4xl">
          {title}
        </h1>

        <div className="lg:flex lg:gap-8">
          {/* Left column: gallery + description */}
          <div className="lg:w-2/3">
            {/* Main image placeholder */}
            <div className="mb-4 flex h-64 items-center justify-center rounded-lg bg-gray-200 text-gray-400 sm:h-80 lg:h-96">
              <svg
                className="h-24 w-24"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>

            {/* Thumbnail row */}
            <div className="mb-8 grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex h-20 items-center justify-center rounded bg-gray-200 text-gray-400"
                >
                  <svg
                    className="h-8 w-8"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
              ))}
            </div>

            {/* Description */}
            <section className="mb-8">
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                Vehicle Description
              </h2>
              <p className="leading-relaxed text-gray-700">
                {vehicle.description}
              </p>
            </section>

            {/* Key Features */}
            <section className="mb-8">
              <h2 className="mb-3 text-xl font-bold text-gray-900">
                Key Features
              </h2>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {vehicle.features.map((feature) => (
                  <li key={feature} className="flex items-center text-gray-700">
                    <svg
                      className="mr-2 h-5 w-5 shrink-0 text-green-500"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Right column: info panel + CTAs */}
          <div className="lg:w-1/3">
            <div className="sticky top-8 rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
              {/* Price */}
              <div className="mb-6 text-center">
                <span className="text-3xl font-extrabold text-[#1B4F72]">
                  {formatPrice(vehicle.price)}
                </span>
                <span className="ml-2 rounded bg-green-100 px-2 py-1 text-xs font-semibold text-green-700">
                  {vehicle.status}
                </span>
              </div>

              {/* Vehicle specs */}
              <dl className="mb-6 space-y-3 text-sm">
                {[
                  ["Mileage", formatMileage(vehicle.mileage)],
                  ["Exterior Color", vehicle.exteriorColor],
                  ["Interior Color", vehicle.interiorColor],
                  ["Drivetrain", vehicle.drivetrain],
                  ["Transmission", vehicle.transmission],
                  ["Engine", vehicle.engine],
                  ["Body Style", vehicle.bodyStyle],
                  ["Fuel Type", vehicle.fuelType],
                  ["VIN", vehicle.vin],
                  ["Stock #", vehicle.stockNumber],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between border-b border-gray-100 pb-2"
                  >
                    <dt className="font-medium text-gray-500">{label}</dt>
                    <dd className="font-semibold text-gray-900">{value}</dd>
                  </div>
                ))}
              </dl>

              {/* CTAs */}
              <div className="space-y-3">
                <CtaButton
                  href="/contact?subject=test-drive&vehicle=${vehicle.slug}"
                  label="Schedule Test Drive"
                  variant="primary"
                />
                <CtaButton
                  href="/financing"
                  label="Get Financing"
                  variant="secondary"
                />
                <CtaButton
                  href={PHONE.href}
                  label={`Call ${PHONE.display}`}
                  variant="outline"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* Similar Vehicles                                                    */}
        {/* ----------------------------------------------------------------- */}
        <section className="mt-16">
          <h2 className="mb-6 text-2xl font-bold text-gray-900">
            Similar Vehicles
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {similar.map((v) => (
              <Link
                key={v.id}
                href={`/inventory/${v.slug}`}
                className="group overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm transition hover:shadow-lg"
              >
                <div className="flex h-40 items-center justify-center bg-gray-200 text-gray-400 transition group-hover:bg-gray-300">
                  <svg
                    className="h-12 w-12"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-gray-900 group-hover:text-[#1B4F72]">
                    {v.year} {v.make} {v.model} {v.trim}
                  </h3>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-extrabold text-[#1B4F72]">
                      {formatPrice(v.price)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatMileage(v.mileage)}
                    </span>
                  </div>
                  <div className="mt-3 text-center text-sm font-semibold text-[#1B4F72] group-hover:underline">
                    View Details
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
