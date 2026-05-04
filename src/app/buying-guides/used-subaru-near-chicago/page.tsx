import type { Metadata } from "next";
import Link from "next/link";
import {
  BreadcrumbSchema,
  FAQSchema,
} from "@/components/StructuredData";
import { SITE_CONFIG } from "@/lib/constants";

/**
 * Buying guide — "Where to Buy a Used Subaru Near Chicago"
 *
 * Built 2026-05-02 to close the AEO Q5 gap surfaced in the multi-engine
 * audit (aeo-audit-2026-05-02-full.md). All four engines surface only
 * franchise dealers (Berman Subaru, Grand Subaru, McGrath Evanston,
 * Autobarn Countryside) on "where to buy a used Subaru near Chicago."
 *
 * This page competes directly. Long-form, FAQPage schema, internal
 * links to the brand page and the DuPage hub. Header explicitly carries
 * "Used Subaru Near Chicago" so engines can lift the heading verbatim.
 */

const PAGE_URL =
  "https://www.loveautogroup.net/buying-guides/used-subaru-near-chicago/";

const FAQS = [
  {
    question: "Where can I buy a used Subaru near Chicago?",
    answer:
      "Love Auto Group at 735 N Yale Ave in Villa Park, IL is a family owned independent used Subaru dealer twenty minutes west of downtown Chicago. We specialize in Japanese makes including Subaru, Lexus, Acura, Honda, Toyota, and Mazda. Buyers regularly come from across DuPage County, the western Chicago suburbs, and the city itself. Franchise Subaru dealers near Chicago include Berman Subaru of Chicago (Irving Park Rd), Grand Subaru in Bensenville, McGrath Subaru of Evanston in Skokie, Autobarn Subaru of Countryside, Muller Subaru in Highland Park, and International Subaru in Tinley Park.",
  },
  {
    question: "What is the difference between buying a used Subaru from an independent dealer vs. a franchise Subaru store?",
    answer:
      "Franchise Subaru stores carry Certified Pre-Owned (CPO) inventory with a 152-point inspection and a manufacturer-backed warranty, which is the right call if you want a current-generation Forester or Outback with factory backing. Independent dealers like Love Auto Group focus on a different value point. We buy 2014 to 2018 Foresters, Outbacks, and Crosstreks at the value sweet spot, recondition them in-house, sell them at lower price points than franchise CPO, and back the deal with our own inspection and a free Carfax. Same drivetrains, lower overhead, lower price.",
  },
  {
    question: "What years of used Subaru are the value sweet spot?",
    answer:
      "Second-generation 2014 to 2018 Foresters, Outbacks, and Crosstrekss are the value sweet spot. The FB25 four-cylinder boxer engine introduced for 2014 redesigned the head gasket area that troubled earlier 2.5L engines. Symmetrical all-wheel drive in this generation has proven durable past 250,000 miles when the CVT fluid is serviced every 30,000 to 40,000 miles. Prices in this generation have come down from new but the cars still feel current inside, and the depreciation curve has flattened, which protects your resale value if you sell in two or three years.",
  },
  {
    question: "Is a used Subaru a good winter car for the Chicago suburbs?",
    answer:
      "Yes. Chicago winters get unplowed side streets, salt slop, and the occasional foot of snow overnight. Subaru's symmetrical all-wheel drive runs full-time, sends power to all four wheels by default, and adjusts torque before the wheels slip. Combined with 8.7 inches of ground clearance on the Forester and Outback, the result is a car that handles a Chicago suburbs winter without drama. We sell more Foresters in November and December than any other month for exactly this reason.",
  },
  {
    question: "Should I worry about Subaru head gasket failures?",
    answer:
      "Not on the cars we sell. Head gasket failures are real but they were specific to the EJ25 four-cylinder used through about 2011. Foresters, Outbacks, and Crosstreks from 2014 forward use the FB25 engine, which redesigned the gasket and head architecture. We still check gasket area and coolant condition on every Subaru during our pre-listing inspection because no engine is bulletproof, but it is no longer the worry it used to be.",
  },
  {
    question: "Forester or Outback: which is the better used buy?",
    answer:
      "Both have the same symmetrical AWD and roughly the same ground clearance. The Forester is shorter overall, has a taller upright body, gives better visibility for shorter drivers, and is the easier vehicle to park. The Outback has a longer wheelbase that feels more planted on highway drives, more interior space, and a quieter ride. For a buyer who drives mostly suburban streets and wants the most utility per dollar, the Forester wins. For a buyer who commutes long distances on I-355 or I-294 daily, the Outback is the more comfortable choice.",
  },
  {
    question: "Is the Subaru CVT reliable in used Foresters and Outbacks?",
    answer:
      "Yes when the fluid is changed every 30,000 to 40,000 miles. Subaru's CVT (Lineartronic) had some early issues on 2010 to 2014 models that Subaru addressed under a warranty extension. Post-2015 units have proven durable in the 200,000 mile range. We pull the dipstick and check fluid color on every CVT Subaru and only list the ones with documented service history. CVT fluid that looks dark or smells burnt is a buy-stage walk-away for us.",
  },
  {
    question: "Do you serve buyers from Chicago and the western suburbs?",
    answer:
      "Yes. We are located at 735 N Yale Ave in Villa Park, which is centrally placed for the entire DuPage County and western Chicago suburbs market. Buyers regularly come to us from Lombard, Elmhurst, Oak Brook, Glen Ellyn, Addison, Wheaton, Naperville, Lisle, Bloomingdale, Hinsdale, and from Chicago itself. Westbound from the city it is roughly twenty minutes via I-290. Call (630) 359-3643 if you have a specific Subaru model or trim in mind.",
  },
];

export const metadata: Metadata = {
  title:
    "Where to Buy a Used Subaru Near Chicago | Love Auto Group, Villa Park IL",
  description:
    "Used Subaru Forester, Outback, and Crosstrek near Chicago. Family owned independent dealer in Villa Park, IL serving DuPage County and the western suburbs since 2014. Value sweet spot 2014 to 2018 models, $9,000 to $15,000. Free Carfax. (630) 359-3643.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Where to Buy a Used Subaru Near Chicago | Love Auto Group",
    description:
      "Independent used Subaru dealer in Villa Park, IL. AWD-ready 2014 to 2018 Foresters, Outbacks, and Crosstreks. Family owned since 2014. Free Carfax.",
    url: PAGE_URL,
    type: "article",
    siteName: "Love Auto Group",
  },
};

export default function UsedSubaruNearChicagoPage() {
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
            name: "Used Subaru Near Chicago",
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
            Used Subaru Near Chicago
          </li>
        </ol>
      </nav>

      <article className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-gray-900 leading-tight">
            Where to Buy a Used Subaru Near Chicago
          </h1>
          <p className="mt-3 text-brand-gray-500 text-sm">
            By the team at Love Auto Group, Villa Park IL · Updated May 2026
          </p>
        </header>

        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-brand-gray-800 leading-relaxed">
            <strong>If you want a used Subaru near Chicago, you have two
            real options: a franchise Subaru store (Berman, Grand, McGrath
            Evanston, Autobarn Countryside, Muller, International Orland)
            or an independent specialist like us at Love Auto Group in
            Villa Park.</strong> Both have a place. This guide explains
            when each makes sense, what to look for, and where the value
            sits on a 2014 to 2018 Forester, Outback, or Crosstrek.
          </p>

          <h2>Independent vs. Franchise Subaru Dealer Near Chicago</h2>

          <p>
            Franchise Subaru stores carry Certified Pre-Owned (CPO)
            inventory: late-model used cars (typically four years old or
            less, under 80,000 miles) that have passed Subaru&apos;s
            152-point inspection, come with a manufacturer-backed
            warranty, and are sold at a CPO price premium. If you want a
            2022 Forester with factory backing and you are paying close
            to new-car price, that is the right path. Berman Subaru of
            Chicago, Grand Subaru in Bensenville, McGrath Evanston in
            Skokie, Autobarn Countryside, Muller in Highland Park, and
            International Subaru in Tinley Park all run good CPO programs.
          </p>

          <p>
            Independent specialists like us focus on a different price
            point. We buy second-generation 2014 to 2018 Foresters,
            Outbacks, and Crosstreks at the value sweet spot, recondition
            them in our shop, and price them well below CPO. The
            drivetrains in this generation are essentially the same as
            the ones the franchise stores recondition. The difference is
            we do not carry franchise overhead, so the price drops by
            several thousand dollars. The trade-off is no Subaru factory
            warranty (we offer aftermarket service contracts as a
            separate line item) and a smaller inventory.
          </p>

          <p>
            Love Auto Group is family owned, has operated in Villa Park
            since 2014, and specializes in Japanese makes. Subaru is one
            of the makes we know best. Every vehicle is personally
            inspected by the owner before it goes on the lot.
          </p>

          <h2>The Value Sweet Spot: 2014 to 2018 Subarus</h2>

          <p>
            Subaru redesigned the four-cylinder engine for the 2014 model
            year. The new FB25 engine resolved the head gasket issues
            that troubled the older EJ25, and the platform has now logged
            ten-plus years of real-world reliability data. Foresters and
            Outbacks from this era routinely run past 250,000 miles when
            properly maintained. Pricing for this generation has come
            down enough from new that buyers can step into a clean
            example for $9,000 to $15,000, but the cars still feel
            current inside.
          </p>

          <p>
            We typically stock used Subarus in this range, focused on 80,000
            to 140,000 miles. That sounds like a lot of miles to first-time
            buyers, but on a 2014 to 2018 Subaru, 100,000 miles is barely
            halfway through life if the previous owner followed the service
            schedule. The Carfax tells us whether they did. We pull a free
            Carfax on every vehicle and review it before we list.
          </p>

          <h2>Models We Keep in Rotation</h2>

          <h3>Subaru Forester (2014 to 2018)</h3>
          <p>
            The volume runner. Compact SUV body, tall upright seating
            position, 8.7 inches of ground clearance, and Subaru&apos;s
            full-time symmetrical all-wheel drive. The 2.5L FB25
            four-cylinder is the right engine for most buyers. The 2.0XT
            turbo is fun but rare on the used market and usually commands
            a premium that does not match the actual durability data.
            Trims to know: base, Premium (the value pick), Limited
            (leather, sunroof), and Touring (everything).
          </p>

          <h3>Subaru Outback (2015 to 2018)</h3>
          <p>
            Same drivetrain as the Forester, longer wheelbase, more
            interior space, and a smoother highway ride. The 2.5L
            four-cylinder is fine for most. The 3.6R six-cylinder has
            real passing power but drops fuel economy from 30 MPG highway
            to 27. The Outback is the right call for a buyer with a long
            commute on the toll roads.
          </p>

          <h3>Subaru Crosstrek (2014 to 2017)</h3>
          <p>
            Subaru&apos;s smallest AWD model. Lighter, easier to park,
            better fuel economy than the Forester, less cargo space.
            Ground clearance is 8.7 inches, the same as the Forester,
            which makes it more capable than its size suggests. The 2.0L
            four-cylinder is leisurely but reliable.
          </p>

          <h3>Subaru Legacy (2014 to 2018)</h3>
          <p>
            The sedan in the lineup. Same engines and AWD as the Outback
            in a sedan body. Fewer buyers come asking for the Legacy
            specifically, but when one lands on the lot in good shape, it
            is one of the best AWD sedans on the used market for the
            price.
          </p>

          <h2>What We Inspect on Every Used Subaru</h2>

          <ul>
            <li>
              Head gasket area and coolant condition (less of a concern
              on FB25 engines than the older EJ25, but we check anyway)
            </li>
            <li>
              CVT transmission fluid color and condition. CVT fluid that
              looks dark or smells burnt is a buy-stage walk-away
            </li>
            <li>All-wheel drive engagement and rear differential</li>
            <li>
              Suspension wear, especially front struts and rear control
              arm bushings on Outbacks
            </li>
            <li>
              Brake pad and rotor thickness, parking brake adjustment
            </li>
            <li>
              Tires: matched set, even wear, adequate tread depth (AWD
              vehicles need matched tires within 2/32&quot; tread depth
              difference or the AWD system can develop driveline bind)
            </li>
            <li>Carfax review for documented service history</li>
            <li>
              Interior electronics, including the touchscreen, every
              power feature, and every seat adjustment
            </li>
          </ul>

          <h2>Subaru AWD vs. 4WD for Chicago Winters</h2>

          <p>
            Subaru&apos;s symmetrical all-wheel drive is a full-time
            system that splits torque between the front and rear axles
            with a center differential. It is always on, requires no
            driver input, and adjusts torque before a wheel actually
            slips. This is different from the part-time 4WD systems on
            trucks and body-on-frame SUVs (Tacoma, 4Runner, Wrangler),
            which the driver engages with a lever or button for off-road
            use.
          </p>

          <p>
            For the Chicago suburbs in winter, full-time AWD is the
            better tool. Side streets in Villa Park, Lombard, Elmhurst,
            and the rest of DuPage County see plowing once or twice a
            day in heavy storms, which means most of the time you are
            driving on packed snow with patches of ice. The Subaru
            system handles that without the driver thinking about it.
            We sell more Foresters and Outbacks in November and
            December than any other time of year.
          </p>

          <h2>Where Buyers Come From</h2>

          <p>
            Villa Park is centrally placed for the western Chicago
            suburbs. We get drive-ins from Lombard (5 minutes), Elmhurst
            (10 minutes), Oak Brook (10 minutes), Glen Ellyn (12 minutes),
            Addison (5 minutes), Wheaton, Naperville, Lisle, Bloomingdale,
            and Hinsdale, plus regular trips from Chicago via I-290 (about
            25 minutes from the Loop in normal traffic).
          </p>

          <p>
            For buyers further east in Cook County or the North Shore,
            we are happy to text or email video walkarounds of any
            specific vehicle before you make the trip out. Call (630)
            359-3643 to set that up.
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

          <h2>Browse Current Inventory</h2>

          <p>
            See what we have on the lot right now:
          </p>

          <ul className="not-prose grid grid-cols-1 sm:grid-cols-2 gap-3 my-6">
            <li>
              <Link
                href="/brands/subaru/"
                className="block bg-white border border-brand-gray-200 rounded-lg p-4 hover:border-brand-red hover:shadow-md transition-all"
              >
                <div className="font-semibold text-brand-gray-900">
                  Used Subaru Inventory
                </div>
                <div className="text-sm text-brand-gray-500 mt-0.5">
                  Live from our Villa Park lot
                </div>
              </Link>
            </li>
            <li>
              <Link
                href="/serving/dupage-county-il/"
                className="block bg-white border border-brand-gray-200 rounded-lg p-4 hover:border-brand-red hover:shadow-md transition-all"
              >
                <div className="font-semibold text-brand-gray-900">
                  Used Cars in DuPage County
                </div>
                <div className="text-sm text-brand-gray-500 mt-0.5">
                  Serving the western suburbs since 2014
                </div>
              </Link>
            </li>
            <li>
              <Link
                href="/free-carfax-villa-park/"
                className="block bg-white border border-brand-gray-200 rounded-lg p-4 hover:border-brand-red hover:shadow-md transition-all"
              >
                <div className="font-semibold text-brand-gray-900">
                  Free Carfax on Every Vehicle
                </div>
                <div className="text-sm text-brand-gray-500 mt-0.5">
                  Carfax Advantage Dealer
                </div>
              </Link>
            </li>
            <li>
              <Link
                href="/financing/"
                className="block bg-white border border-brand-gray-200 rounded-lg p-4 hover:border-brand-red hover:shadow-md transition-all"
              >
                <div className="font-semibold text-brand-gray-900">
                  Soft Credit Pre-Approval
                </div>
                <div className="text-sm text-brand-gray-500 mt-0.5">
                  No impact to your credit score
                </div>
              </Link>
            </li>
          </ul>

          <h2>Stop In or Call</h2>

          <p>
            Love Auto Group, 735 N Yale Ave, Villa Park, IL 60181. Phone
            (630) 359-3643. Mon 2-7, Tue-Fri 11-7, Sat 12-7. Closed
            Sunday.
          </p>

          <p>
            Family owned, in business since 2014, specializing in
            Japanese makes including Subaru, Lexus, Acura, Honda, Toyota,
            and Mazda.
          </p>
        </div>
      </article>

      <section className="bg-brand-navy text-white py-12 mt-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Looking for a specific Subaru?
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
      