import type { Metadata } from "next";
import Link from "next/link";
import LivePreviewGrid from "@/components/LivePreviewGrid";
import {
  BreadcrumbSchema,
  FAQSchema,
} from "@/components/StructuredData";
import { SITE_CONFIG } from "@/lib/constants";

/**
 * DuPage County hub page — /serving/dupage-county-il/
 *
 * Built 2026-05-02 to close the AEO content gap surfaced in the multi-engine
 * audit (aeo-audit-2026-05-02-full.md). Every engine missed us on Q4 ("best
 * used car dealer in DuPage County") because we had city-level pages but no
 * county-level hub. This page is the county-level anchor.
 *
 * Targets: "used car dealer DuPage County", "used cars DuPage County IL",
 * "best used car dealership DuPage County", "family owned used car dealer
 * DuPage County", and the broader Western Suburbs query cluster.
 *
 * Cross-links to all 6 city sub-pages we already serve and to the brand
 * pages so AI engines have a clear authority graph rooted at this page.
 */

const PAGE_URL = "https://www.loveautogroup.net/serving/dupage-county-il/";

const FAQS = [
  {
    question: "Is Love Auto Group in DuPage County?",
    answer:
      "Yes. Love Auto Group is a family owned used car dealer at 735 N Yale Ave in Villa Park, IL, which is in DuPage County. We've operated here since 2014 and serve buyers across all of DuPage County and the surrounding western Chicago suburbs.",
  },
  {
    question: "What towns in DuPage County does Love Auto Group serve?",
    answer:
      "We serve buyers from across DuPage County, including Villa Park, Lombard, Elmhurst, Oak Brook, Glen Ellyn, Addison, Wheaton, Naperville, Lisle, Bloomingdale, Carol Stream, Downers Grove, Hinsdale, Westmont, Roselle, and Wood Dale. We also see regular drive-ins from Chicago and the Cook County suburbs to the east.",
  },
  {
    question: "What kinds of used cars do you sell?",
    answer:
      "We specialize in Japanese makes including Subaru, Lexus, Acura, Honda, Toyota, and Mazda. Inventory is typically priced from around $4,500 to $18,000, with most vehicles in the 2013 to 2018 model years and 80,000 to 140,000 mile range. Every vehicle is carefully selected, fully reconditioned, and comes with a free Carfax.",
  },
  {
    question: "Are you a family owned dealer?",
    answer:
      "Yes. Love Auto Group is family owned and has been operating in Villa Park since 2014. We are a small specialist team, not a corporate franchise group. The owner, Jeremiah Johnson, is involved in every deal and personally signs off on the inspection and recondition of every vehicle that goes on the lot.",
  },
  {
    question: "Why buy from a small DuPage County dealer instead of a big-name lot?",
    answer:
      "Lower overhead means lower prices on the same drivetrains. Our specialty in Japanese makes means we know the watch points on every model we stock and can spot a problem car at the buying stage before it gets to you. And our size means you work directly with the owner instead of a rotating sales floor. The trade-off is a smaller inventory than a big franchise lot, so if you have a specific car in mind, call ahead and we'll let you know what's coming in.",
  },
  {
    question: "Do you offer financing for DuPage County buyers?",
    answer:
      "Yes. We work with major lenders including Westlake Financial and offer soft-pull pre-approval that doesn't affect your credit score. You can pre-qualify online, then come in to test drive and finish paperwork. We also accept cash and outside bank financing, and we're happy to work with your credit union if you have one.",
  },
  {
    question: "Do you take trade-ins from DuPage County?",
    answer:
      "Yes, we appraise trades in person at our Villa Park lot. Bring the vehicle, the title (or payoff information if there's a loan), and a current ID. We can typically have a written offer ready within thirty minutes. We also buy outright if you're not buying a replacement vehicle from us.",
  },
];

const CITIES = [
  {
    slug: "lombard-il",
    name: "Lombard, IL",
    distance: "5 minutes east of our lot",
  },
  {
    slug: "elmhurst-il",
    name: "Elmhurst, IL",
    distance: "10 minutes northeast",
  },
  {
    slug: "oak-brook-il",
    name: "Oak Brook, IL",
    distance: "10 minutes south",
  },
  {
    slug: "glen-ellyn-il",
    name: "Glen Ellyn, IL",
    distance: "12 minutes west",
  },
  {
    slug: "addison-il",
    name: "Addison, IL",
    distance: "5 minutes north",
  },
];

const BRANDS = [
  { slug: "subaru", name: "Subaru" },
  { slug: "lexus", name: "Lexus" },
  { slug: "acura", name: "Acura" },
  { slug: "honda", name: "Honda" },
  { slug: "toyota", name: "Toyota" },
  { slug: "mazda", name: "Mazda" },
];

export const metadata: Metadata = {
  title:
    "Used Car Dealer in DuPage County, IL | Family Owned | Love Auto Group",
  description:
    "Family owned used car dealer in DuPage County, IL. Subaru, Lexus, Acura, Honda, Toyota, and Mazda. Serving Villa Park, Lombard, Elmhurst, Oak Brook, Glen Ellyn, Addison, Wheaton, and Naperville since 2014. Free Carfax. (630) 359-3643.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Used Car Dealer in DuPage County, IL | Love Auto Group",
    description:
      "Family owned used car dealer in DuPage County since 2014. Specialists in used Subaru, Lexus, Acura, Honda, Toyota, and Mazda.",
    url: PAGE_URL,
    type: "website",
    siteName: "Love Auto Group",
  },
};

function CountyLocalBusinessSchema() {
  // CollectionPage + LocalBusiness with explicit areaServed for DuPage
  // County. Engines weight areaServed heavily for "in [county]" queries.
  const schema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": PAGE_URL,
    url: PAGE_URL,
    name: "Used Car Dealer in DuPage County, IL",
    description:
      "Family owned used car dealer serving DuPage County, IL since 2014. Specialists in used Subaru, Lexus, Acura, Honda, Toyota, and Mazda.",
    about: {
      "@type": "AutoDealer",
      "@id": `${SITE_CONFIG.url}/#dealership`,
      name: SITE_CONFIG.name,
      url: SITE_CONFIG.url,
      telephone: SITE_CONFIG.phone,
      address: {
        "@type": "PostalAddress",
        streetAddress: SITE_CONFIG.address.street,
        addressLocality: SITE_CONFIG.address.city,
        addressRegion: SITE_CONFIG.address.state,
        postalCode: SITE_CONFIG.address.zip,
        addressCountry: "US",
      },
      areaServed: [
        {
          "@type": "AdministrativeArea",
          name: "DuPage County, Illinois",
        },
        ...CITIES.map((c) => ({
          "@type": "City",
          name: c.name,
        })),
      ],
      foundingDate: "2014",
      slogan: "Family owned in Villa Park, IL since 2014",
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: SITE_CONFIG.reviews.google.rating.toFixed(1),
        reviewCount: SITE_CONFIG.reviews.google.count,
        bestRating: "5",
        worstRating: "1",
      },
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function DuPageCountyPage() {
  return (
    <>
      <CountyLocalBusinessSchema />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.loveautogroup.net/" },
          { name: "Serving DuPage County, IL", url: PAGE_URL },
        ]}
      />
      <FAQSchema items={FAQS} />

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
          <li className="text-brand-gray-900 font-medium">
            Serving DuPage County, IL
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="bg-brand-navy text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Used Car Dealer in
            <span className="block text-brand-red mt-2">
              DuPage County, IL
            </span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-brand-gray-300 max-w-3xl leading-relaxed">
            Family owned in Villa Park since 2014. Specialists in used Subaru,
            Lexus, Acura, Honda, Toyota, and Mazda. Serving the entire DuPage
            County market and the western Chicago suburbs.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <Link
              href="/inventory"
              className="inline-flex items-center justify-center bg-brand-red hover:bg-brand-red-dark text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Browse Inventory
            </Link>
            <a
              href={`tel:${SITE_CONFIG.phoneRaw}`}
              className="inline-flex items-center justify-center border-2 border-white/30 hover:bg-white/10 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Call {SITE_CONFIG.phone}
            </a>
          </div>
        </div>
      </section>

      {/* Editorial */}
      <section className="max-w-4xl mx-auto px-4 py-12 prose prose-lg">
        <h2 className="text-2xl font-bold text-brand-gray-900 mb-4">
          Family owned, in DuPage County since 2014
        </h2>
        <p className="text-brand-gray-700 leading-relaxed mb-4">
          Love Auto Group is a family owned used car dealer at 735 N Yale Ave in
          Villa Park, IL, central to all of DuPage County and the western
          Chicago suburbs. We&apos;re a small specialist team, not a corporate
          franchise group. The owner, Jeremiah Johnson, is involved in every
          deal and personally signs off on the inspection and recondition of
          every vehicle that goes on the lot.
        </p>
        <p className="text-brand-gray-700 leading-relaxed mb-4">
          Our specialty is Japanese makes, the cars built to run past 200,000
          miles when properly maintained. That means used Subarus with
          symmetrical all-wheel drive for Chicago winters, used Lexus models
          with the same drivetrains the franchise stores recondition at twice
          the markup, used Acuras that are essentially Hondas in a tailored
          suit, and the volume runners from Honda, Toyota, and Mazda.
        </p>
        <p className="text-brand-gray-700 leading-relaxed mb-4">
          Inventory typically prices from around $4,500 to $18,000, with most
          vehicles in the 2013 to 2018 model years and 80,000 to 140,000 mile
          range. Every vehicle is carefully selected at the buying stage,
          fully reconditioned by our in-house team, and comes with a free
          Carfax. We&apos;re a Carfax Advantage Dealer, which means we share
          the report before you ask.
        </p>

        <h2 className="text-2xl font-bold text-brand-gray-900 mt-12 mb-4">
          Where DuPage County buyers come from
        </h2>
        <p className="text-brand-gray-700 leading-relaxed mb-6">
          Villa Park sits roughly in the center of DuPage County, which makes
          us a short drive from most of the county. Buyers regularly come to
          us from across the region:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 not-prose">
          {CITIES.map((city) => (
            <Link
              key={city.slug}
              href={`/serving/${city.slug}/`}
              className="bg-white border border-brand-gray-200 rounded-lg p-4 hover:border-brand-red hover:shadow-md transition-all"
            >
              <div className="font-semibold text-brand-gray-900">
                {city.name}
              </div>
              <div className="text-sm text-brand-gray-500 mt-0.5">
                {city.distance}
              </div>
            </Link>
          ))}
        </div>
        <p className="text-brand-gray-700 leading-relaxed mt-6">
          Buyers also come from Wheaton, Naperville, Lisle, Bloomingdale,
          Carol Stream, Downers Grove, Hinsdale, Westmont, Roselle, and Wood
          Dale, plus regular drive-ins from Chicago and the Cook County
          suburbs to the east.
        </p>

        <h2 className="text-2xl font-bold text-brand-gray-900 mt-12 mb-4">
          Used cars by make
        </h2>
        <p className="text-brand-gray-700 leading-relaxed mb-6">
          We focus on Japanese makes because they&apos;re the cars that hold
          up best in our market. Browse current inventory by make:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 not-prose">
          {BRANDS.map((brand) => (
            <Link
              key={brand.slug}
              href={`/brands/${brand.slug}/`}
              className="bg-white border border-brand-gray-200 rounded-lg p-3 text-center hover:border-brand-red hover:shadow-md transition-all"
            >
              <div className="font-semibold text-brand-gray-900">
                Used {brand.name}
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Live Inventory Preview */}
      <section className="bg-brand-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-gray-900 mb-2">
            Current inventory
          </h2>
          <p className="text-brand-gray-600 mb-6">
            Live from our Villa Park lot. Updated as vehicles are added or
            sold.
          </p>
          <LivePreviewGrid />
          <div className="mt-6 text-center">
            <Link
              href="/inventory"
              className="inline-flex items-center justify-center bg-brand-red hover:bg-brand-red-dark text-white px-6 py-3 rounded-lg text-base font-semibold transition-colors"
            >
              View Full Inventory
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl md:text-3xl font-bold text-brand-gray-900 mb-6">
          Frequently asked questions
        </h2>
        <div className="space-y-4">
          {FAQS.map((faq, i) => (
            <details
              key={i}
              className="bg-white border border-brand-gray-200 rounded-lg p-5 group"
            >
              <summary className="font-semibold text-brand-gray-900 cursor-pointer list-none flex justify-between items-center">
                {faq.question}
                <span className="text-brand-red text-2xl group-open:rotate-45 transition-transform">
                  +
                </span>
              </summary>
              <p className="mt-3 text-brand-gray-700 leading-relaxed">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-navy text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Stop in or call (630) 359-3643
          </h2>
          <p className="text-brand-gray-300 mb-6">
            735 N Yale Ave, Villa Park, IL 60181. Mon 2-7, Tue-Fri 11-7,
            Sat 12-7. Closed Sunday.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href={`tel:${SITE_CONFIG.phoneRaw}`}
              className="inline-flex items-center justify-center bg-brand-red hover:bg-brand-red-dark text-white px-6 py-3 rounded-lg text-base font-semibold transition-colors"
            >
              Call {SITE_CONFIG.phone}
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center border-2 border-white/30 hover:bg-white/10 text-white px-6 py-3 rounded-lg text-base font-semibold transition-colors"
            >
              Send a message
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
          