import type { Metadata } from "next";
import Link from "next/link";
import { BRANDS } from "@/data/brands";
import { BreadcrumbSchema } from "@/components/StructuredData";

/**
 * Brands index — /brands/
 *
 * Parent page for the five brand landing pages at /brands/{slug}/.
 * Exists primarily so the BreadcrumbList JSON-LD on each brand page
 * (Home > Brands > Used <Brand>) resolves to a real URL instead of
 * a 404. Also serves as a hub crawlers can use to discover the five
 * brand sub-pages from a single anchor location.
 *
 * Voice-rule clean per Mark:
 *   - No em dashes
 *   - No "auction" / "technician" alt for the m-word / "pre-owned"
 *   - "Family owned" no hyphen
 */

const BASE = "https://www.loveautogroup.net";
const PAGE_URL = `${BASE}/brands/`;

export const metadata: Metadata = {
  title: "Browse Used Cars by Brand | Love Auto Group",
  description:
    "Browse used Honda, Subaru, Lexus, Acura, and Mazda inventory at Love Auto Group in Villa Park, IL. Japanese-makes specialist since 2014. Free Carfax on every vehicle.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Browse Used Cars by Brand | Love Auto Group",
    description:
      "Browse used Honda, Subaru, Lexus, Acura, and Mazda inventory at Love Auto Group in Villa Park, IL.",
    url: PAGE_URL,
    type: "website",
    siteName: "Love Auto Group",
  },
};

export default function BrandsIndexPage() {
  // CollectionPage with hasPart linking the 5 brand sub-pages.
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": PAGE_URL,
    url: PAGE_URL,
    name: "Browse Used Cars by Brand",
    description:
      "Brand index for Love Auto Group's Japanese-makes inventory: Honda, Subaru, Lexus, Acura, and Mazda.",
    inLanguage: "en-US",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE}/#website`,
      name: "Love Auto Group",
      url: `${BASE}/`,
    },
    hasPart: BRANDS.map((b) => ({
      "@type": "CollectionPage",
      "@id": `${BASE}/brands/${b.slug}/`,
      url: `${BASE}/brands/${b.slug}/`,
      name: b.metaTitle,
      description: b.metaDescription,
      about: {
        "@type": "Brand",
        name: b.displayName,
      },
    })),
  };

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${BASE}/` },
          { name: "Brands", url: PAGE_URL },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
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
          <li className="text-brand-gray-900 font-medium">Brands</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="bg-brand-navy text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Browse Used Cars by Brand
            <span className="block text-brand-red mt-2">
              Villa Park, IL
            </span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-brand-gray-300 max-w-3xl">
            Japanese-makes specialist since 2014. Honda, Subaru, Lexus, Acura,
            and Mazda in steady rotation on our Villa Park lot.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-lg text-brand-gray-700 leading-relaxed mb-4">
          Love Auto Group is a family owned independent dealership in Villa
          Park, IL focused on Japanese makes. Honda, Subaru, Lexus, Acura,
          and Mazda are the five brands you will see in regular rotation on
          our lot, because they are the brands with the longest service lives,
          the strongest resale curves, and the lowest cost of ownership in
          the used market.
        </p>
        <p className="text-lg text-brand-gray-700 leading-relaxed">
          Pick a brand below to see the editorial overview, the model years
          and price ranges we typically stock, and the live inventory we have
          on the lot right now.
        </p>
      </section>

      {/* Brand cards */}
      <section className="max-w-7xl mx-auto px-4 pb-16">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {BRANDS.map((b) => (
            <li
              key={b.slug}
              className="border border-brand-gray-200 rounded-xl bg-white hover:shadow-lg transition-shadow flex flex-col"
            >
              <Link
                href={`/brands/${b.slug}/`}
                className="flex flex-col p-6 h-full"
              >
                <h2 className="text-2xl font-bold text-brand-gray-900 mb-2">
                  Used {b.displayName}
                </h2>
                <p className="text-base text-brand-gray-700 leading-relaxed mb-4 flex-grow">
                  {b.hero}
                </p>
                <span className="inline-flex items-center text-brand-red font-semibold mt-auto">
                  View {b.displayName} inventory
                  <span aria-hidden="true" className="ml-2">
                    &rarr;
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-brand-gray-900 mb-2">
            Looking for a different make?
          </h2>
          <p className="text-brand-gray-600 mb-6">
            Call (630) 359-3643 and we will let you know when one lands.
            735 N Yale Ave, Villa Park, IL 60181.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="tel:6303593643"
              className="inline-flex items-center bg-brand-red hover:bg-brand-red-dark text-white px-6 py-3 rounded-xl font-semibold"
            >
              Call (630) 359-3643
            </a>
            <Link
              href="/inventory"
              className="inline-flex items-center border-2 border-brand-gray-300 hover:bg-brand-gray-100 text-brand-gray-900 px-6 py-3 rounded-xl font-semibold"
            >
              View Full Inventory
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
