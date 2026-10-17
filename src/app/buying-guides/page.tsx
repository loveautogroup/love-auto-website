import type { Metadata } from "next";
import Link from "next/link";
import { BreadcrumbSchema } from "@/components/StructuredData";
import SiteBreadcrumb from "@/components/SiteBreadcrumb";
import { TrackedPhoneLink } from "@/components/TrackedLink";

/**
 * Buying guides index: /buying-guides/
 *
 * Parent page for the long-form guides at /buying-guides/{slug}/. The
 * BreadcrumbList on each guide already points at this URL, so it must
 * resolve. Add new guides to GUIDES below and to sitemap.ts.
 */

const BASE = "https://www.loveautogroup.net";
const PAGE_URL = `${BASE}/buying-guides/`;

const GUIDES = [
  {
    slug: "used-subaru-near-chicago",
    title: "Where to Buy a Used Subaru Near Chicago",
    summary:
      "Used Subaru Forester, Outback and Crosstrek for the western Chicago suburbs, from our Villa Park, IL lot.",
  },
  {
    slug: "used-lexus-dupage-county",
    title: "Where to Buy a Used Lexus in DuPage County",
    summary:
      "Used Lexus RX 350, ES, IS and GX in DuPage County, from a family owned dealer in Villa Park, IL.",
  },
];

export const metadata: Metadata = {
  title: "Used Car Buying Guides | Love Auto Group",
  description:
    "Plain-English used car buying guides for the Chicago suburbs. Subaru and Lexus guides from Love Auto Group, a family owned dealer in Villa Park, IL.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Used Car Buying Guides | Love Auto Group",
    description:
      "Plain-English used car buying guides for the Chicago suburbs from Love Auto Group in Villa Park, IL.",
    url: PAGE_URL,
    type: "website",
    siteName: "Love Auto Group",
  },
};

export default function BuyingGuidesIndexPage() {
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": PAGE_URL,
    url: PAGE_URL,
    name: "Used Car Buying Guides",
    inLanguage: "en-US",
    isPartOf: { "@type": "WebSite", "@id": `${BASE}/#website`, url: `${BASE}/` },
    mainEntity: {
      "@type": "ItemList",
      itemListElement: GUIDES.map((g, i) => ({
        "@type": "ListItem",
        position: i + 1,
        url: `${BASE}/buying-guides/${g.slug}/`,
        name: g.title,
      })),
    },
  };

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${BASE}/` },
          { name: "Buying Guides", url: PAGE_URL },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(collectionSchema).replace(/</g, "\u003c"),
        }}
      />

      <SiteBreadcrumb trail={[{ label: "Buying Guides" }]} />

      <section className="bg-brand-navy text-white py-12 md:py-16 border-b border-white/[.14]">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="font-heading font-extrabold leading-[0.98] text-[clamp(1.9rem,5vw,3.5rem)]">
            Used Car Buying Guides
            <span className="block text-brand-red mt-2">Villa Park, IL</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-ink-300 max-w-3xl">
            Plain-English guides from a family owned dealer in Villa Park, IL.
            What to look for, what to ask and which model years make sense.
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-12">
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {GUIDES.map((g) => (
            <li
              key={g.slug}
              className="group border border-ink-200 bg-white hover:border-brand-red transition-colors flex flex-col"
            >
              <Link
                href={`/buying-guides/${g.slug}/`}
                className="flex flex-col p-6 h-full"
              >
                <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-2">
                  {g.title}
                </h2>
                <p className="text-base text-brand-gray-700 leading-relaxed mb-4 flex-grow">
                  {g.summary}
                </p>
                <span className="inline-flex items-center gap-2 text-[12.5px] font-bold uppercase tracking-[0.08em] text-brand-red border-b border-current pb-0.5 mt-auto self-start">
                  Read the guide
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="bg-ink-100 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-2">
            Have a question about a car?
          </h2>
          <p className="text-brand-gray-600 mb-6">
            Call (630) 359-3643. 735 N Yale Ave, Unit A, Villa Park, IL
            60181. Open Tuesday to Saturday, 2 to 6 PM, other times by
            appointment.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <TrackedPhoneLink
              location="buying_guides_cta"
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
