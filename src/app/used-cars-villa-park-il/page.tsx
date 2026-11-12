import type { Metadata } from "next";
import Link from "next/link";
import LivePreviewGrid from "@/components/LivePreviewGrid";
import { TrackedPhoneLink } from "@/components/TrackedLink";
import { BreadcrumbSchema, FAQSchema } from "@/components/StructuredData";
import SiteBreadcrumb from "@/components/SiteBreadcrumb";
import { SITE_CONFIG } from "@/lib/constants";
import { BRANDS } from "@/data/brands";
import { fetchDmsInventory } from "@/lib/dmsInventory";

const PAGE_URL = "https://www.loveautogroup.net/used-cars-villa-park-il/";

const PAGE_TITLE = "Used Cars Villa Park IL | No Dealer Fees | Love Auto Group";
const PAGE_DESCRIPTION = `Used cars for sale in Villa Park, IL, ${SITE_CONFIG.priceRange.text}. In business since 2014, no dealer fees, free CARFAX on marked cars. Open Tue to Sat 2 to 6 PM.`;

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
    url: PAGE_URL,
    type: "website",
    siteName: "Love Auto Group",
  },
};

const FAQ_ITEMS = [
  {
    question: "Where can I find used cars for sale in Villa Park, IL?",
    answer:
      "Love Auto Group is an independent used car dealership located at 735 N Yale Ave, Unit A, Villa Park, IL 60181. We sell used cars, SUVs, and trucks, with a specialty in makes like Subaru, Lexus, Acura, Honda, Toyota, and Mazda.",
  },
  {
    question: "What are the best used car dealerships in Villa Park, Illinois?",
    answer:
      "Love Auto Group has been in business since 2014 and serves Villa Park and the surrounding DuPage County area. We have a 4.7-star rating on Google. A free CARFAX report is included on the cars that show the CARFAX badge.",
  },
  {
    question: "What used cars does Love Auto Group have in Villa Park?",
    answer:
      "Our inventory changes regularly, but we carry used vehicles — Subaru Forester, Outback, and Crosstrek; Lexus RX, ES, and IS; Honda CR-V, Accord, and Pilot; Acura MDX and TLX; and Mazda CX-5. We also carry select domestic and other import vehicles. Browse our current inventory at loveautogroup.net/inventory.",
  },
  {
    question: "How much do used cars cost at Love Auto Group?",
    answer: `Most of our cars are priced from ${SITE_CONFIG.priceRange.text}. The price you see is the price you pay, plus tax, title, and license. We charge no dealer fees.`,
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
      "Tuesday through Saturday, 2:00 PM to 6:00 PM. Closed Sunday and Monday. Appointments are available outside of office hours, so call 630-359-3643 or text 312-925-7520.",
  },
];

export default async function UsedCarsVillaParkPage() {
  // Live stock, resolved at build so the cars are in the served HTML (the
  // client grid below only hydrates afterwards, and a crawler would see an
  // empty section). Same snapshot the brand pages use.
  const inventory = await fetchDmsInventory();
  const onLot = inventory
    .filter(
      (v) =>
        v.status === "available" &&
        Number.isFinite(v.price) &&
        v.price > 0 &&
        typeof v.slug === "string" &&
        v.slug.length > 0
    )
    .sort((x, y) => x.price - y.price);
  const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;
  const liveLine =
    onLot.length > 0
      ? `Right now we have ${onLot.length} used ${onLot.length === 1 ? "car" : "cars"} for sale, ${
          onLot.length === 1
            ? `priced at ${money(onLot[0].price)}`
            : `from ${money(onLot[0].price)} to ${money(onLot[onLot.length - 1].price)}`
        }.`
      : "";

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
      <SiteBreadcrumb trail={[{ label: "Used Cars in Villa Park, IL" }]} />

      {/* Hero. The first paragraph answers the search directly: who, where,
          what, price, fees, CARFAX, hours. */}
      <section className="bg-brand-navy text-white py-12 md:py-16 border-b border-white/[.14]">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="font-heading font-extrabold leading-[0.98] text-[clamp(1.9rem,5vw,3.5rem)]">
            Used Cars in Villa Park, IL
            <span className="block text-brand-red mt-2">
              In Business Since 2014
            </span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-ink-300 max-w-3xl">
            Love Auto Group is an independent used car dealer at 735 N Yale
            Ave, Unit A in Villa Park, IL. We sell used cars, SUVs, and
            trucks, mostly Subaru, Lexus, Honda, Acura, Toyota, and Mazda,
            usually priced from {SITE_CONFIG.priceRange.text}. We charge no
            dealer fees, and cars that show the CARFAX badge come with a free
            CARFAX report. We are open Tuesday to Saturday, 2 to 6 PM, closed
            Sunday and Monday, and other times by appointment.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/inventory"
              className="inline-flex items-center bg-brand-red hover:bg-brand-red-dark text-white px-6 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em]"
            >
              Browse Inventory
            </Link>
            <TrackedPhoneLink
              location="used_cars_villa_park_hero"
              href="tel:+16303593643"
              className="inline-flex items-center border border-white text-white hover:bg-white hover:text-brand-navy px-6 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em]"
            >
              Call (630) 359-3643
            </TrackedPhoneLink>
          </div>
        </div>
      </section>

      {/* Live inventory */}
      <section className="max-w-7xl mx-auto px-4 py-12" aria-labelledby="inv-heading">
        <div className="text-center mb-8">
          <h2
            id="inv-heading"
            className="font-heading font-extrabold text-2xl md:text-3xl text-brand-gray-900"
          >
            Used Cars For Sale in Villa Park Right Now
          </h2>
          <p className="mt-2 text-brand-gray-500">
            {liveLine} A free CARFAX report comes with the ones that show the badge.
          </p>
        </div>
        <LivePreviewGrid />
        {onLot.length > 0 && (
          <nav aria-label="Used cars for sale in Villa Park" className="mt-8">
            <ul className="grid gap-x-8 gap-y-2 sm:grid-cols-2 text-sm">
              {onLot.map((v) => (
                <li key={v.slug}>
                  <Link
                    href={`/inventory/${v.slug}/`}
                    className="text-brand-red hover:underline"
                  >
                    {v.year} {v.make} {v.model}
                  </Link>
                  <span className="text-brand-gray-500">
                    {" "}
                    — {money(v.price)}, {v.mileage.toLocaleString("en-US")} miles
                  </span>
                </li>
              ))}
            </ul>
          </nav>
        )}
        <div className="text-center mt-8">
          <Link
            href="/inventory"
            className="inline-flex items-center bg-brand-red hover:bg-brand-red-dark text-white px-7 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em]"
          >
            View Full Inventory
          </Link>
        </div>
      </section>

      {/* Editorial */}
      <article className="max-w-4xl mx-auto px-4 pb-12">
        <section className="mb-10">
          <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-4">
            Villa Park&apos;s Used Car Dealer, In Business Since 2014
          </h2>
          <p className="text-brand-gray-700 leading-relaxed mb-4">
            Love Auto Group has been selling used cars since 2014 and operates from
            Villa Park, Illinois. We&apos;re an independent dealership —
            not a chain, not a mega-lot — which means you deal directly with
            the people who stand behind every car we sell. Our lot is at 735 N
            Yale Ave, Unit A, right here in Villa Park.
          </p>
          <p className="text-brand-gray-700 leading-relaxed mb-4">
            Subaru, Lexus, Acura, Honda, Toyota, and Mazda make up the core of
            our used car inventory in Villa Park. We pick these makes because
            they tend to last a long time, hold their value, and cost less to
            own. We also carry some domestic and other import vehicles when the
            right car comes along.
          </p>
          <p className="text-brand-gray-700 leading-relaxed">
            A free CARFAX report comes with the cars that show the badge, and
            you can{" "}
            <Link href="/free-carfax-villa-park/" className="text-brand-red hover:underline">
              read how that works here
            </Link>
            . No surprises at the deal desk, no pressure on the lot. See what
            Villa Park and DuPage County buyers say on our{" "}
            <Link href="/reviews/" className="text-brand-red hover:underline">
              reviews page
            </Link>
            .
          </p>
        </section>

        <section className="mb-10">
          <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-4">
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
          <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-4">
            Visit Our Villa Park Car Dealership
          </h2>
          <div className="bg-white border border-ink-200 p-6">
            <p className="font-semibold text-brand-gray-900">
              {SITE_CONFIG.name}
            </p>
            <p className="text-brand-gray-700">{SITE_CONFIG.address.street}</p>
            <p className="text-brand-gray-700 mb-3">
              {SITE_CONFIG.address.city}, {SITE_CONFIG.address.state}{" "}
              {SITE_CONFIG.address.zip}
            </p>
            <p className="text-brand-gray-700 mb-4">
              <TrackedPhoneLink
                location="used_cars_villa_park_address"
                href={`tel:${SITE_CONFIG.phoneRaw}`}
                className="text-brand-red hover:underline font-semibold"
              >
                {SITE_CONFIG.phone}
              </TrackedPhoneLink>{" "}
              or text 312-925-7520
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
            <p className="mt-2 text-sm text-brand-gray-500">{SITE_CONFIG.hoursNote}</p>
            <p className="mt-4 text-sm">
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(SITE_CONFIG.address.full)}`}
                className="text-brand-red hover:underline font-semibold"
                rel="noopener"
              >
                Get directions on Google Maps
              </a>
            </p>
          </div>
        </section>

        {/* Brand hubs — the brief calls for links out to the brand pages
            so the geo hub feeds the make-level pages we want to rank. */}
        <section className="mb-10">
          <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-4">
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
          <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-4">
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
          <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-4">
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
            — no obligation. We are most interested in Subaru, Lexus, Honda,
            Acura, Mazda, and Toyota, but we will look at anything.
          </p>
        </section>

        {/* FAQ */}
        <section className="mb-10">
          <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-6">
            Frequently Asked Questions — Used Cars in Villa Park, IL
          </h2>
          <div className="space-y-6">
            {FAQ_ITEMS.map((item, i) => (
              <div key={i} className="border-b border-ink-200 pb-6">
                <h3 className="font-heading font-bold text-brand-gray-900 mb-2">
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
        <div className="bg-brand-navy p-8 text-center text-white">
          <h2 className="font-heading font-extrabold text-2xl mb-2">
            Ready to Find Your Next Car in Villa Park?
          </h2>
          <p className="text-ink-300 mb-6">
            Stop in at 735 N Yale Ave, Unit A, or call 630-359-3643 or text
            312-925-7520. Tue–Sat 2–6 PM. Appointments available outside of
            office hours.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/inventory"
              className="bg-brand-red hover:bg-brand-red-dark text-white px-7 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em]"
            >
              Browse Inventory
            </Link>
            <Link
              href="/contact"
              className="border border-white text-white hover:bg-white hover:text-brand-navy px-7 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em]"
            >
              Get Directions
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
