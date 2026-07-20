import type { Metadata } from "next";
import Link from "next/link";
import LivePreviewGrid from "@/components/LivePreviewGrid";
import { BreadcrumbSchema, FAQSchema } from "@/components/StructuredData";
import { SITE_CONFIG } from "@/lib/constants";
import { BRANDS } from "@/data/brands";

const PAGE_URL = "https://www.loveautogroup.net/used-cars-villa-park-il/";

export const metadata: Metadata = {
  title: "Used Cars in Villa Park, IL | Love Auto Group",
  description:
    "Family owned used car dealership in Villa Park, IL since 2014. Browse quality used cars, trucks, and SUVs — Subaru, Lexus, Honda, Acura, and more. Serving DuPage County and the western Chicago suburbs.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Used Cars in Villa Park, IL | Love Auto Group",
    description:
      "Family owned used car dealership in Villa Park, IL since 2014. Browse quality used cars, trucks, and SUVs. Serving DuPage County.",
    url: PAGE_URL,
    type: "website",
    siteName: "Love Auto Group",
  },
};

const FAQ_ITEMS = [
  {
    question: "Where can I find used cars for sale in Villa Park, IL?",
    answer:
      "Love Auto Group is a family owned used car dealership located at 735 N Yale Ave, Unit A, Villa Park, IL 60181. We carry a carefully selected inventory of quality used cars, SUVs, and trucks — with a specialty in Japanese makes like Subaru, Lexus, Acura, Honda, and Mazda.",
  },
  {
    question: "What are the best used car dealerships in Villa Park, Illinois?",
    answer:
      "Love Auto Group has been serving Villa Park and the surrounding DuPage County area since 2014. We're a CarGurus top-rated dealer with a 4.7-star Google rating and over 125 reviews. Every vehicle is carefully inspected before it hits our lot, and a free Carfax report is included on every car.",
  },
  {
    question: "What used cars does Love Auto Group have in Villa Park?",
    answer:
      "Our inventory changes regularly, but we specialize in used Japanese vehicles — Subaru Forester, Outback, and Crosstrek; Lexus RX, ES, and IS; Honda CR-V, Accord, and Pilot; Acura MDX and TLX; and Mazda CX-5. We also carry select domestic and other import vehicles. Browse our current inventory at loveautogroup.net/inventory.",
  },
  {
    question: "Do Villa Park used car dealers offer financing?",
    answer:
      "Yes. Love Auto Group works with lenders to help buyers with a range of credit situations. You can apply online at loveautogroup.net/financing or come in and we'll walk you through your options in person. No high-pressure sales — just straightforward answers.",
  },
  {
    question: "How far is Love Auto Group from the center of Villa Park?",
    answer:
      "We're located at 735 N Yale Ave, Unit A — right in Villa Park, less than a mile from the Route 83 / St. Charles Road intersection. Easy to reach from Lombard, Elmhurst, Addison, and the rest of DuPage County.",
  },
  {
    question: "What are Love Auto Group's hours?",
    answer:
      "Monday 2:00 PM to 7:00 PM, Tuesday through Friday 11:00 AM to 7:00 PM, Saturday 12:00 PM to 7:00 PM. Closed Sunday. Call or text us at (630) 359-3643 anytime.",
  },
];

export default function UsedCarsVillaParkPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.loveautogroup.net/" },
          { name: "Used Cars in Villa Park, IL", url: PAGE_URL },
        ]}
      />
      <FAQSchema items={FAQ_ITEMS} />

      {/* Breadcrumb */}
      <nav className="max-w-7xl mx-auto px-4 py-4 text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-brand-gray-500">
          <li>
            <Link href="/" className="hover:text-brand-red">
              Home
            </Link>
          </li>
          <li>/</li>
          <li className="text-brand-gray-900 font-medium">
            Used Cars in Villa Park, IL
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="bg-brand-navy text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Used Cars in Villa Park, IL
            <span className="block text-brand-red mt-2">
              Family Owned Since 2014
            </span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-brand-gray-300 max-w-3xl">
            Love Auto Group is Villa Park&apos;s used car specialist — 735 N
            Yale Ave, one mile from Route 83. Japanese makes, a free Carfax
            report on every car, 4.7 stars on Google.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/inventory"
              className="inline-flex items-center bg-brand-red hover:bg-brand-red-dark text-white px-6 py-3 rounded-xl font-semibold"
            >
              Browse Inventory
            </Link>
            <a
              href="tel:+16303593643"
              className="inline-flex items-center border border-white text-white hover:bg-white hover:text-brand-navy px-6 py-3 rounded-xl font-semibold"
            >
              Call (630) 359-3643
            </a>
          </div>
        </div>
      </section>

      {/* Live inventory */}
      <section className="max-w-7xl mx-auto px-4 py-12" aria-labelledby="inv-heading">
        <div className="text-center mb-8">
          <h2
            id="inv-heading"
            className="text-2xl md:text-3xl font-bold text-brand-gray-900"
          >
            Used Cars For Sale in Villa Park Right Now
          </h2>
          <p className="mt-2 text-brand-gray-500">
            Every vehicle inspected, lot-ready, and listed with a free Carfax report.
          </p>
        </div>
        <LivePreviewGrid />
        <div className="text-center mt-8">
          <Link
            href="/inventory"
            className="inline-flex items-center bg-brand-red hover:bg-brand-red-dark text-white px-8 py-3 rounded-xl font-semibold"
          >
            View Full Inventory
          </Link>
        </div>
      </section>

      {/* Editorial */}
      <article className="max-w-4xl mx-auto px-4 pb-12">
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-brand-gray-900 mb-4">
            Villa Park&apos;s Used Car Dealer Since 2014
          </h2>
          <p className="text-brand-gray-700 leading-relaxed mb-4">
            Love Auto Group has been selling quality used cars in Villa Park,
            Illinois for over a decade. We&apos;re a family owned dealership —
            not a chain, not a mega-lot — which means you deal directly with
            the people who stand behind every car we sell. Our lot is at 735 N
            Yale Ave, Unit A, right here in Villa Park.
          </p>
          <p className="text-brand-gray-700 leading-relaxed mb-4">
            We specialize in Japanese makes because they hold up. Subaru,
            Lexus, Acura, Honda, Toyota, and Mazda make up the core of our
            used car inventory in Villa Park. These vehicles have the longest
            service lives, the strongest resale curves, and the lowest
            ownership cost in the used market. We also carry select domestic
            and other import vehicles when the right car comes along.
          </p>
          <p className="text-brand-gray-700 leading-relaxed">
            Every used car we put on the lot goes through a full inspection by
            our in-house team before it&apos;s available for sale. Carfax
            reports are included free on every vehicle. No surprises at the
            deal desk, no pressure on the lot. That&apos;s why we have over 125
            Google reviews and a 4.7-star rating from Villa Park and DuPage
            County buyers.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-brand-gray-900 mb-4">
            Serving Villa Park and All of DuPage County
          </h2>
          <p className="text-brand-gray-700 leading-relaxed mb-4">
            Our Villa Park dealership is 20 miles west of Chicago and within a
            short drive of most DuPage County towns. We regularly serve buyers
            from Lombard, Elmhurst, Addison, Wheaton, Glen Ellyn, Oak Brook,
            Naperville, and Bloomingdale. If you&apos;re looking for a used car
            dealership near you in Villa Park or anywhere in the western
            suburbs, we&apos;re an easy drive down Route 83 or St. Charles Road.
          </p>
          <p className="text-brand-gray-700 leading-relaxed">
            We also help buyers from the Chicago area who want to skip the city
            dealership markup and find a better used car at a fair price. Our
            inventory turns quickly because we price to move — not to negotiate
            forever.
          </p>
        </section>

        {/* NAP block — must match the Google Business Profile listing
            (GBP store code 06345907979509993852) exactly. Rendered from
            SITE_CONFIG so a site-wide NAP change stays in sync here.
            Page-level AutoDealer JSON-LD (address, geo, hours, areaServed)
            is already emitted on this page by LocalBusinessSchema in the
            root layout — do not add a second AutoDealer entity. */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-brand-gray-900 mb-4">
            Visit Our Villa Park Car Dealership
          </h2>
          <div className="bg-white rounded-xl border border-brand-gray-200 p-6">
            <p className="font-semibold text-brand-gray-900">
              {SITE_CONFIG.name}
            </p>
            <p className="text-brand-gray-700">{SITE_CONFIG.address.street}</p>
            <p className="text-brand-gray-700 mb-3">
              {SITE_CONFIG.address.city}, {SITE_CONFIG.address.state}{" "}
              {SITE_CONFIG.address.zip}
            </p>
            <p className="text-brand-gray-700 mb-4">
              <a
                href={`tel:${SITE_CONFIG.phoneRaw}`}
                className="text-brand-red hover:underline font-semibold"
              >
                {SITE_CONFIG.phone}
              </a>{" "}
              — call or text
            </p>
            <h3 className="font-semibold text-brand-gray-900 mb-2">Hours</h3>
            <ul className="space-y-1 text-sm">
              {SITE_CONFIG.hours.map((h) => (
                <li key={h.day} className="flex justify-between max-w-xs">
                  <span className="text-brand-gray-500">{h.day}</span>
                  <span
                    className={
                      h.hours === "Closed"
                        ? "text-brand-red font-medium"
                        : "text-brand-gray-900 font-medium"
                    }
                  >
                    {h.hours}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Brand hubs — the brief calls for links out to the brand pages
            so the geo hub feeds the make-level pages we want to rank. */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-brand-gray-900 mb-4">
            Browse Our Villa Park Inventory by Brand
          </h2>
          <p className="text-brand-gray-700 leading-relaxed mb-4">
            Prefer to start with a make? Each brand page covers what we look
            for when we buy that make, plus the cars we have in stock today.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 font-semibold">
            {BRANDS.map((brand) => (
              <li key={brand.slug}>
                <Link
                  href={`/brands/${brand.slug}/`}
                  className="text-brand-red hover:text-brand-red-dark"
                >
                  Used {brand.displayName} →
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-brand-gray-900 mb-4">
            Used Car Financing in Villa Park, IL
          </h2>
          <p className="text-brand-gray-700 leading-relaxed mb-4">
            Looking for financing on a used car in Villa Park? Love Auto Group
            works with lenders who handle a range of credit situations —
            good credit, rebuilding credit, and everything in between. You can{" "}
            <Link href="/financing" className="text-brand-red hover:underline">
              apply online in minutes
            </Link>{" "}
            or come in and we&apos;ll walk you through your options in person.
          </p>
          <p className="text-brand-gray-700 leading-relaxed">
            No high-pressure tactics and no dealer fees — you pay the listed
            price plus tax, title, and license, nothing else. We explain
            every number before you put pen to paper.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-2xl font-bold text-brand-gray-900 mb-4">
            Sell or Trade Your Car in Villa Park
          </h2>
          <p className="text-brand-gray-700 leading-relaxed">
            Have a vehicle to sell or trade? We buy used cars directly from
            Villa Park area owners.{" "}
            <Link
              href="/sell-your-car"
              className="text-brand-red hover:underline"
            >
              Get a quick offer
            </Link>{" "}
            — no obligation. We&apos;re particularly interested in clean
            Japanese makes (Subaru, Lexus, Honda, Acura, Mazda, Toyota) in
            good condition, but we&apos;ll look at anything.
          </p>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-brand-gray-900 mb-6">
            Frequently Asked Questions — Used Cars in Villa Park, IL
          </h2>
          <div className="space-y-6">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border-b border-brand-gray-200 pb-6">
                <h3 className="font-semibold text-brand-gray-900 mb-2">
                  {item.question}
                </h3>
                <p className="text-brand-gray-700 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <div className="bg-brand-navy rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl font-bold mb-2">
            Ready to Find Your Next Car in Villa Park?
          </h2>
          <p className="text-brand-gray-300 mb-6">
            Stop in at 735 N Yale Ave, Unit A — or call us at (630) 359-3643.
            Mon 2–7pm, Tue–Fri 11am–7pm, Sat 12–7pm.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/inventory"
              className="bg-brand-red hover:bg-brand-red-dark text-white px-8 py-3 rounded-xl font-semibold"
            >
              Browse Inventory
            </Link>
            <Link
              href="/contact"
              className="border border-white text-white hover:bg-white hover:text-brand-navy px-8 py-3 rounded-xl font-semibold"
            >
              Get Directions
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
