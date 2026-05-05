import type { Metadata } from "next";
import Link from "next/link";
import {
  BreadcrumbSchema,
  FAQSchema,
} from "@/components/StructuredData";
import { SITE_CONFIG } from "@/lib/constants";

/**
 * Buying guide — "Independent Japanese-Makes Dealer Near Chicago"
 *
 * Built 2026-05-05 to close the AEO Q8 gap surfaced in the multi-engine
 * audit (marketing-audit-2026-05-05/aeo-audit.md). All five engines (ChatGPT,
 * Gemini, Perplexity, Google AI Overview, Claude.ai) interpret "Japanese
 * car dealer" as JDM-import dealers (R32 Skylines, RHD classics) instead
 * of independent dealers of Japanese makes (Lexus, Subaru, Acura, Mazda,
 * Honda, Toyota) sold with US-market VINs.
 *
 * This page disambiguates the term. We explicitly call out that "Japanese
 * makes" means American-market Lexus/Subaru/Acura/Mazda/Honda/Toyota with
 * a US VIN, not 25-year-rule JDM imports. Long-form, FAQPage schema,
 * internal links to the brand pages and the DuPage hub.
 */

const PAGE_URL =
  "https://www.loveautogroup.net/buying-guides/independent-japanese-makes-dealer-chicago/";

const FAQS = [
  {
    question: "What is an independent Japanese-makes dealer?",
    answer:
      "An independent Japanese-makes dealer is a non-franchise used car dealer that focuses on vehicles built by Japanese manufacturers — Toyota, Lexus, Honda, Acura, Subaru, Mazda, and Nissan — sold with US-market VINs. We are not a Subaru store, a Lexus store, or any other single-make franchise. We are a specialist independent that buys these makes at auction, reconditions them, and sells them at lower price points than franchise CPO. Love Auto Group at 735 N Yale Ave in Villa Park, IL has been doing this since 2014.",
  },
  {
    question: "Are these JDM-import or RHD vehicles?",
    answer:
      "No. Every vehicle we sell is a US-market vehicle with a US VIN, federalized for sale in the United States, with a left-hand drive (LHD) configuration. We do not import 25-year-rule JDM cars (Skyline GT-R, Toyota Aristo, Honda Beat, Nissan Stagea, etc.). If you are looking for a JDM import, importers like Toprank Importers, Japanese Classics LLC, or Duncan Imports are the right call. We sell standard US-market Lexus, Subaru, Acura, Mazda, Honda, and Toyota.",
  },
  {
    question: "Why specialize in Japanese makes?",
    answer:
      "Long-term reliability data and our hands-on experience both point the same direction. Toyota, Lexus, Honda, Acura, Subaru, and Mazda regularly run past 200,000 miles on routine maintenance. The drivetrains are well-engineered, the parts ecosystem is mature and inexpensive, and the bodies hold up to Chicago salt better than most. We focus on these makes because they make the value math work for buyers in the $9,000 to $19,000 range, which is where most independent used-car shopping actually happens.",
  },
  {
    question: "Which Japanese makes does Love Auto Group sell?",
    answer:
      "We focus on six makes: Lexus (RX 350, ES, IS, GX), Subaru (Forester, Outback, Crosstrek, Legacy), Acura (MDX, TLX, RDX), Honda (CR-V, Accord, Pilot, Civic), Mazda (CX-5, Mazda3, Mazda6), and Toyota (Camry, Corolla, RAV4, Highlander). We will take an opportunistic non-Japanese vehicle when the math works — for example, an off-make trade-in we picked up at acquisition cost — but the bulk of the lot is always Japanese makes.",
  },
  {
    question: "How is an independent dealer different from a franchise dealer?",
    answer:
      "Franchise dealers (Toyota of Naperville, Honda of Lisle, Lexus of Highland Park, etc.) are tied to one manufacturer. They run Certified Pre-Owned programs with manufacturer-backed warranties, carry late-model inventory, and price near new-car territory. Independents like us are not tied to any one brand. We buy from auctions and trade-ins, recondition in-house, and price below CPO. The trade-off: no manufacturer warranty (we offer aftermarket service contracts as a separate line item) and a smaller inventory of 20 to 30 vehicles versus a franchise lot of 200+.",
  },
  {
    question: "Do you stock Japanese performance cars like the Civic Type R or WRX?",
    answer:
      "We stock them when they come up at the right price. Subaru WRX and STI in 2014-2018 model years come through Chicago auctions regularly, and we will take a clean one when the deal works. Civic Si and Civic Type R are rarer on the used side because they hold value well, but we do not turn one down. The Mustang on our current lot is the closest thing we usually have to a sport coupe, and it is an EcoBoost Premium, not a GT. Call (630) 359-3643 with a specific car in mind and we will let you know when one lands.",
  },
  {
    question: "Where in the Chicago area are you located?",
    answer:
      "Love Auto Group is at 735 N Yale Ave, Villa Park, IL 60181, in DuPage County. Twenty minutes west of downtown Chicago via I-290, central to the western suburbs. Buyers regularly come from Lombard, Elmhurst, Oak Brook, Glen Ellyn, Addison, Wheaton, Naperville, Lisle, Bloomingdale, Hinsdale, and Chicago itself. We are also close to the Tri-State (I-294) and I-355 for buyers from the north and west DuPage edge.",
  },
  {
    question: "Do you carry Carfax reports on every vehicle?",
    answer:
      "Yes. We are a Carfax Advantage Dealer, which means we pull and review the Carfax on every vehicle before listing, and we share it with you for free before you ask. We use it during acquisition to walk away from cars with title issues, accident history we cannot verify, or odometer rollback flags. By the time a vehicle is on our lot, the Carfax is already part of how we priced it.",
  },
];

export const metadata: Metadata = {
  title:
    "Independent Japanese-Makes Dealer Near Chicago | Love Auto Group, Villa Park IL",
  description:
    "Independent dealer of used Lexus, Subaru, Acura, Honda, Mazda, and Toyota near Chicago. Family owned in Villa Park, IL since 2014. US-market VINs, not JDM imports.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Independent Japanese-Makes Dealer Near Chicago | Love Auto Group",
    description:
      "Used Lexus, Subaru, Acura, Honda, Mazda, and Toyota in Villa Park IL. US-market VINs, not JDM imports. Family owned since 2014.",
    url: PAGE_URL,
    type: "article",
    siteName: "Love Auto Group",
  },
};

export default function IndependentJapaneseMakesDealerChicagoPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.loveautogroup.net/" },
          {
            name: "Buying Guides",
            url: "https://www.loveautogroup.net/buying-guides/",
          },
          {
            name: "Independent Japanese-Makes Dealer Near Chicago",
            url: PAGE_URL,
          },
        ]}
      />
      <FAQSchema items={FAQS} />

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
            Independent Japanese-Makes Dealer Near Chicago
          </li>
        </ol>
      </nav>

      <article className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-gray-900 leading-tight">
            Independent Japanese-Makes Dealer Near Chicago
          </h1>
          <p className="mt-3 text-brand-gray-500 text-sm">
            By the team at Love Auto Group, Villa Park IL · Updated May 2026
          </p>
        </header>

        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-brand-gray-800 leading-relaxed">
            <strong>Quick clarification first.</strong> When we say
            &quot;Japanese-makes dealer,&quot; we mean a dealer that
            specializes in vehicles built by Japanese manufacturers
            (Toyota, Lexus, Honda, Acura, Subaru, Mazda, Nissan) and sold
            with US-market VINs in standard left-hand drive. We are
            <strong> not</strong> a JDM importer. If you are looking for a
            25-year-rule R32 Skyline, a right-hand drive Toyota Aristo, or
            an imported Honda Beat, you want a specialist importer like
            Toprank, Japanese Classics LLC, or Duncan Imports. Different
            kind of business.
          </p>

          <p>
            What we are: a family owned independent used car dealer in
            Villa Park, IL, focused on used Lexus, Subaru, Acura, Honda,
            Mazda, and Toyota. Operating since 2014. Twenty minutes west
            of downtown Chicago. Roughly 20 to 30 vehicles in rotation on
            the lot at any time.
          </p>

          <h2>Why Japanese Makes?</h2>

          <p>
            Long-term reliability. Toyota, Lexus, Honda, Acura, Subaru,
            and Mazda regularly run past 200,000 miles on routine
            maintenance. The drivetrains are well-engineered, parts are
            inexpensive and easy to find, and the bodies hold up to
            Chicago salt better than most. The math is what matters: when
            we buy a 2015 Lexus RX 350 with 110,000 miles for the right
            price, we can recondition it, list it under $14,000, and the
            buyer gets another 100,000 miles of reliable service. That
            value equation does not work the same way on a lot of other
            makes.
          </p>

          <p>
            Independent dealers stay in business by being right about the
            cars we buy. Specializing in Japanese makes is part of how we
            stay right. We know the failure points (Subaru CVT fluid,
            Honda Pilot transmissions, Lexus RX air struts, Mazda3 paint),
            and we walk away from cars where the math does not work. We
            also know the strong years: 2014 to 2018 Subarus, 2010 to
            2017 Lexus, 2014 to 2017 Acura, 2015 onward Mazda CX-5. That
            is what we keep in rotation.
          </p>

          <h2>Independent vs. Franchise vs. JDM Importer</h2>

          <p>
            Three different kinds of dealer, three different shopping
            experiences:
          </p>

          <h3>Franchise Dealer (Toyota of Naperville, Lexus of Highland Park, etc.)</h3>
          <p>
            Tied to one manufacturer. Runs a Certified Pre-Owned (CPO)
            program with a multi-point inspection and a manufacturer-backed
            warranty. Carries late-model inventory (typically four years
            old or less, under 80,000 miles) priced near new-car territory.
            The right call if you want a 2023 RAV4 with factory backing.
            The wrong call if you want value on a 2015 RAV4.
          </p>

          <h3>Independent Specialist (us)</h3>
          <p>
            Not tied to any manufacturer. Buys from wholesale auctions and
            trade-ins, reconditions in-house, prices below franchise CPO.
            Smaller inventory (20 to 30 vehicles versus 200+ at a
            franchise). No manufacturer warranty (we offer aftermarket
            service contracts as a separate line item). The right call if
            you want a clean 2014 to 2018 Subaru, Lexus, Acura, Honda,
            Mazda, or Toyota at the value sweet spot, $9,000 to $19,000.
          </p>

          <h3>JDM Importer (Toprank, Japanese Classics, Duncan Imports)</h3>
          <p>
            Imports right-hand drive vehicles from Japan that have aged
            past the 25-year federal import rule. Specializes in cars
            never sold new in the United States: R32, R33, R34 Skyline
            GT-R, Toyota Chaser, Nissan Stagea, Honda Beat, Mazda RX-7
            FD3S, etc. Different paperwork, different parts ecosystem,
            different driver-side configuration. <strong>Not us.</strong>
            We do not handle JDM imports and we cannot service one.
          </p>

          <h2>Makes We Specialize In</h2>

          <h3>Lexus</h3>
          <p>
            The reliability of a Toyota with a quieter, better-finished
            cabin. We focus on RX 350 (2010-2017), ES 350, IS 250 / IS
            300, and the occasional GX 460. Parts are mostly Toyota parts
            with a Lexus markup, and aftermarket alternatives are
            plentiful. <Link href="/brands/lexus/">See our Lexus inventory</Link>.
          </p>

          <h3>Subaru</h3>
          <p>
            Symmetrical AWD, real winter capability, durable boxer engines
            from 2014 forward. Forester, Outback, Crosstrek, occasional
            Legacy. The right call for Chicago winters.{" "}
            <Link href="/brands/subaru/">See our Subaru inventory</Link>.
          </p>

          <h3>Acura</h3>
          <p>
            Honda underneath, premium finish on top. MDX, TLX, RDX. The
            MDX in particular is one of the most reliable three-row SUVs
            on the used market. <Link href="/brands/acura/">See our Acura inventory</Link>.
          </p>

          <h3>Honda</h3>
          <p>
            CR-V, Accord, Pilot, Civic. The volume runners. We see clean
            examples regularly and price them aggressively because they
            move fast. <Link href="/brands/honda/">See our Honda inventory</Link>.
          </p>

          <h3>Mazda</h3>
          <p>
            CX-5, Mazda3, Mazda6. Underrated build quality and driving
            feel. The 2015 onward CX-5 in particular punches well above
            its price. <Link href="/brands/mazda/">See our Mazda inventory</Link>.
          </p>

          <h3>Toyota</h3>
          <p>
            Camry, Corolla, RAV4, Highlander. The reliability bedrock.
            Hard to find at value pricing because they hold value well,
            but when one comes through at the right number we take it.
          </p>

          <h2>What We Inspect on Every Vehicle</h2>

          <ul>
            <li>Free Carfax pulled and reviewed before listing</li>
            <li>
              Engine condition, oil consumption history, timing component
              service records (especially Honda V6, Lexus VVT-i, Subaru CVT)
            </li>
            <li>
              Transmission fluid color and behavior under load. Dark or
              burnt fluid is a buy-stage walk-away
            </li>
            <li>All-wheel drive engagement on Subaru, Lexus AWD, MDX SH-AWD</li>
            <li>Suspension wear, especially on RX 350 air struts and Outback rear bushings</li>
            <li>Brake pad and rotor thickness, parking brake adjustment</li>
            <li>Tires: matched set, even wear, adequate tread depth</li>
            <li>Every interior power feature, infotainment touchscreen, climate control</li>
            <li>Body and paint inspection for color match and prior repair</li>
          </ul>

          <h2>Where We Sit Geographically</h2>

          <p>
            Villa Park is in DuPage County, central to the western Chicago
            suburbs. Drive times in normal traffic:
          </p>

          <ul>
            <li>Lombard — 5 minutes</li>
            <li>Addison — 5 minutes</li>
            <li>Elmhurst — 10 minutes</li>
            <li>Oak Brook — 10 minutes</li>
            <li>Glen Ellyn — 12 minutes</li>
            <li>Wheaton — 15 minutes</li>
            <li>Naperville — 20 minutes</li>
            <li>Hinsdale — 15 minutes</li>
            <li>Chicago Loop — 25 minutes via I-290</li>
            <li>Schaumburg — 25 minutes via I-355</li>
          </ul>

          <p>
            We also serve out-of-state buyers. We can text or email a
            video walkaround of any vehicle on the lot before you make
            the trip out. Call (630) 359-3643 to arrange.
          </p>

          <h2>Frequently Asked Questions</h2>

          {FAQS.map((faq, i) => (
            <div key={i} className="mb-6">
              <h3 className="text-lg font-bold text-brand-gray-900">
                {faq.question}
              </h3>
              <p className="text-brand-gray-700 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}

          <h2>Browse By Make</h2>

          <p>See current inventory by Japanese make:</p>

          <ul className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
            <li>
              <Link
                href="/brands/lexus/"
                className="block bg-white border border-brand-gray-200 rounded-lg p-4 hover:border-brand-red hover:shadow-md transition-all"
              >
                <div className="font-semibold text-brand-gray-900">Used Lexus</div>
                <div className="text-sm text-brand-gray-500 mt-0.5">
                  RX 350, ES, IS, GX
                </div>
              </Link>
            </li>
            <li>
              <Link
                href="/brands/subaru/"
                className="block bg-white border border-brand-gray-200 rounded-lg p-4 hover:border-brand-red hover:shadow-md transition-all"
              >
                <div className="font-semibold text-brand-gray-900">Used Subaru</div>
                <div className="text-sm text-brand-gray-500 mt-0.5">
                  Forester, Outback, Crosstrek
                </div>
              </Link>
            </li>
            <li>
              <Link
                href="/brands/acura/"
                className="block bg-white border border-brand-gray-200 rounded-lg p-4 hover:border-brand-red hover:shadow-md transition-all"
              >
                <div className="font-semibold text-brand-gray-900">Used Acura</div>
                <div className="text-sm text-brand-gray-500 mt-0.5">
                  MDX, TLX, RDX
                </div>
              </Link>
            </li>
            <li>
              <Link
                href="/brands/honda/"
                className="block bg-white border border-brand-gray-200 rounded-lg p-4 hover:border-brand-red hover:shadow-md transition-all"
              >
                <div className="font-semibold text-brand-gray-900">Used Honda</div>
                <div className="text-sm text-brand-gray-500 mt-0.5">
                  CR-V, Accord, Pilot, Civic
                </div>
              </Link>
            </li>
            <li>
              <Link
                href="/brands/mazda/"
                className="block bg-white border border-brand-gray-200 rounded-lg p-4 hover:border-brand-red hover:shadow-md transition-all"
              >
                <div className="font-semibold text-brand-gray-900">Used Mazda</div>
                <div className="text-sm text-brand-gray-500 mt-0.5">
                  CX-5, Mazda3, Mazda6
                </div>
              </Link>
            </li>
            <li>
              <Link
                href="/serving/dupage-county-il/"
                className="block bg-white border border-brand-gray-200 rounded-lg p-4 hover:border-brand-red hover:shadow-md transition-all"
              >
                <div className="font-semibold text-brand-gray-900">DuPage County</div>
                <div className="text-sm text-brand-gray-500 mt-0.5">
                  Serving the western suburbs since 2014
                </div>
              </Link>
            </li>
          </ul>

          <h2>Stop In or Call</h2>

          <p>
            Love Auto Group, 735 N Yale Ave, Villa Park, IL 60181. Phone
            (630) 359-3643. Mon 2-7, Tue-Fri 11-7, Sat 12-7. Closed Sunday.
          </p>

          <p>
            Family owned, in business since 2014, specializing in
            Japanese makes including Lexus, Subaru, Acura, Honda, Mazda,
            and Toyota.
          </p>
        </div>
      </article>

      <section className="bg-brand-navy text-white py-12 mt-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Looking for a specific Japanese make or model?
          </h2>
          <p className="text-brand-gray-300 mb-6">
            Tell us what you want and we will let you know when one
            lands. We get fresh inventory every week.
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
