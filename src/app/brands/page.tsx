import type { Metadata } from "next";
import Link from "next/link";
import { BRANDS } from "@/data/brands";
import { BreadcrumbSchema } from "@/components/StructuredData";
import SiteBreadcrumb from "@/components/SiteBreadcrumb";
import { TrackedPhoneLink } from "@/components/TrackedLink";

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
    "Browse used Honda, Subaru, Lexus, Acura, and Mazda inventory at Love Auto Group in Villa Park, IL. Family-owned independent dealer since 2014. Free Carfax on vehicles that show the badge.",
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
      "Brand index for Love Auto Group's inventory: Honda, Subaru, Lexus, Acura, and Mazda.",
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
      <SiteBreadcrumb trail={[{ label: "Brands" }]} />

      {/* Hero */}
      <section className="bg-brand-navy text-white py-12 md:py-16 border-b border-white/[.14]">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="font-heading font-extrabold leading-[0.98] text-[clamp(1.9rem,5vw,3.5rem)]">
            Browse Used Cars by Brand
            <span className="block text-brand-red mt-2">
              Villa Park, IL
            </span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-ink-300 max-w-3xl">
            family-owned independent dealer since 2014. Honda, Subaru, Lexus, Acura,
            and Mazda in steady rotation on our Villa Park lot.
          </p>
        </div>
      </section>

      {/* Intro */}
      <section className="max-w-4xl mx-auto px-4 py-10">
        <p className="text-lg text-brand-gray-700 leading-relaxed mb-4">
          Love Auto Group is a family owned independent dealership in Villa
          Park, IL focused on makes. Honda, Subaru, Lexus, Acura,
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
              className="group border border-ink-200 bg-white hover:border-brand-red transition-colors flex flex-col"
            >
              <Link
                href={`/brands/${b.slug}/`}
                className="flex flex-col p-6 h-full"
              >
                <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-2">
                  Used {b.displayName}
                </h2>
                <p className="text-base text-brand-gray-700 leading-relaxed mb-4 flex-grow">
                  {b.hero}
                </p>
                <span className="inline-flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-[0.08em] text-brand-red border-b border-current pb-0.5 mt-auto self-start">
                  View {b.displayName} inventory
                  <svg className="w-3 h-3 transition-transform duration-150 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Final CTA */}
      <section className="bg-ink-100 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-2">
            Looking for a different make?
          </h2>
          <p className="text-brand-gray-600 mb-6">
            Call (630) 359-3643 and we will let you know when one lands.
            735 N Yale Ave, Unit A, Villa Park, IL 60181.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <TrackedPhoneLink
              location="brands_cta"
              href="tel:6303593643"
              className="inline-flex items-center bg-brand-red hover:bg-brand-red-dark text-white px-6 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em]"
            >
              Call (630) 359-3643
            </TrackedPhoneLink>
            <Link
              href="/inventory"
              className="inline-flex items-center border border-brand-gray-300 hover:border-brand-gray-900 text-brand-gray-900 px-6 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em]"
            >
              View Full Inventory
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
