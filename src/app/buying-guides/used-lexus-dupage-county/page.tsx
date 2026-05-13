import type { Metadata } from "next";
import Link from "next/link";
import {
  BreadcrumbSchema,
  FAQSchema,
} from "@/components/StructuredData";
import { SITE_CONFIG } from "@/lib/constants";

/**
 * Buying guide — "Where to Buy a Used Lexus in DuPage County"
 *
 * Built 2026-05-02 to close the AEO Q6 gap surfaced in the multi-engine
 * audit. All four engines surface only franchise dealers (McGrath
 * Westmont, Lexus of Naperville, Woodfield Lexus, Lexus of Orland) on
 * "where to buy a used Lexus in the Chicago suburbs / DuPage County."
 *
 * Long-form, FAQPage schema, internal links to the brand page and the
 * DuPage hub. Header carries "Used Lexus in DuPage County" so engines
 * can lift the heading verbatim.
 */

const PAGE_URL =
  "https://www.loveautogroup.net/buying-guides/used-lexus-dupage-county/";

const FAQS = [
  {
    question: "Where can I buy a used Lexus in DuPage County?",
    answer:
      "Love Auto Group at 735 N Yale Ave in Villa Park, IL is a family owned independent used Lexus dealer in DuPage County. We specialize in Japanese makes including Lexus, Subaru, Acura, Honda, Toyota, and Mazda. Buyers regularly come from Lombard, Elmhurst, Oak Brook, Glen Ellyn, Wheaton, Naperville, Hinsdale, and the wider western Chicago suburbs. Franchise Lexus dealers nearby include McGrath Lexus of Westmont, Lexus of Naperville, Woodfield Lexus in Schaumburg, Lexus of Arlington Heights, and Bill Jacobs Lexus in Naperville.",
  },
  {
    question: "Independent used Lexus dealer vs. franchise Lexus store: which is right for me?",
    answer:
      "Franchise Lexus stores carry L/Certified Pre-Owned inventory: typically Lexus vehicles six years old or newer with under 70,000 miles, a 161-point inspection, and a manufacturer-backed warranty extension. If you want a 2022 RX 350 with factory backing, that path makes sense. Independent specialists like Love Auto Group focus on a different price point. We buy 2010 to 2017 RX, ES, IS, and GX models, recondition them in our shop, and price them well below CPO. Same Toyota-derived drivetrains the franchise stores recondition, lower overhead, lower price. The trade-off is no Lexus factory warranty, smaller inventory, and an older average model year.",
  },
  {
    question: "Are used Lexus parts more expensive than Toyota parts?",
    answer:
      "Some are, most are not. The drivetrain on a Lexus RX or ES is essentially identical to the Toyota Highlander or Avalon, so engine, transmission, suspension, and brake parts price the same as the equivalent Toyota part. Where parts get pricier is interior trim, leather, and Lexus-specific exterior body panels. For routine maintenance, a Lexus costs about the same to service as the equivalent Toyota.",
  },
  {
    question: "How long do used Lexus RX 350s last?",
    answer:
      "The RX 350 with the 2GR-FE 3.5L V6 routinely runs past 250,000 miles when serviced properly. It is the same engine family used in Toyota Highlanders and Camrys, just with better insulation, better interior materials, and slightly different tuning. We focus on third-generation 2010 to 2015 RX 350s in the 90,000 to 130,000 mile range, which on this platform is barely broken in. The fourth-generation 2016 to 2022 RX 350 is also reliable but commands a premium that does not always reflect a meaningful difference in long-term durability.",
  },
  {
    question: "Is a used Lexus a good winter car for the Chicago suburbs?",
    answer:
      "It depends on the model. The all-wheel drive RX 350 is excellent: responsive AWD that engages quickly on slick surfaces, and the platform handles a DuPage County winter without drama. The GX 460 is a true body-on-frame SUV with a low-range transfer case, which makes it overkill for snow but capable in any condition. The rear-wheel drive ES 350 and IS 250 need decent winter tires to be at their best in heavy snow. We can usually find an AWD RX in inventory most of the year.",
  },
  {
    question: "Should I buy a used Lexus IS 250 or IS 350?",
    answer:
      "The IS 250 with the 2.5L V6 is the volume car and the better used-market value. The 2.5L is reliable and parts are cheap, though the car is not fast (zero to sixty around 7.7 seconds). The IS 350 with the 3.5L V6 is genuinely quick (around 5.6 seconds) and the engine is bulletproof, but used examples are rarer and command a price premium. For daily driving in the Chicago suburbs, the IS 250 is the smart pick. If you want a fast Japanese sedan that also handles winter well with snow tires, the IS 350 is the one.",
  },
  {
    question: "Do you stock used Lexus GX 460?",
    answer:
      "Occasionally. The GX 460 is a body-on-frame Lexus SUV that shares its platform with the Toyota 4Runner and Land Cruiser Prado. Buyers love it for genuine off-road capability, towing, and longevity (300,000-mile examples are common). Used GX 460s in good condition hold value strongly, so they are not always available, but we add them to inventory when one comes through that meets our standard. Call (630) 359-3643 to ask if one is in the pipeline.",
  },
  {
    question: "What should I check before buying a used Lexus?",
    answer:
      "Service history first. Lexus owners who follow the maintenance schedule produce cars that go 250,000 miles without major issues. Owners who skip services produce expensive problems. We pull a Carfax on every Lexus and review the service record before listing. Specific items we inspect: oil consumption history (especially on RX 350 and ES 350 above 100,000 miles), suspension air struts on GX 460 (a known wear point that costs $1,500+ if it fails), transmission fluid color, and any documented timing chain or VVT-i sensor work. Carfax Advantage Dealer status means we share the report before you ask.",
  },
];

export const metadata: Metadata = {
  title:
    "Where to Buy a Used Lexus in DuPage County | Love Auto Group, Villa Park IL",
  description:
    "Used Lexus RX 350, ES, IS, and GX in DuPage County. Family owned independent dealer in Villa Park, IL serving the Chicago suburbs since 2014. Value sweet spot 2010 to 2017, $12,000 to $19,000. Free Carfax. (630) 359-3643.",
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: "Where to Buy a Used Lexus in DuPage County | Love Auto Group",
    description:
      "Independent used Lexus dealer in Villa Park, IL. RX 350, ES 350, IS 250, GX 460 in the value sweet spot. Family owned since 2014. Free Carfax.",
    url: PAGE_URL,
    type: "article",
    siteName: "Love Auto Group",
  },
};

export default function UsedLexusDuPageCountyPage() {
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
            name: "Used Lexus in DuPage County",
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
            Used Lexus in DuPage County
          </li>
        </ol>
      </nav>

      <article className="max-w-3xl mx-auto px-4 py-8 md:py-12">
        <header className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-brand-gray-900 leading-tight">
            Where to Buy a Used Lexus in DuPage County
          </h1>
          <p className="mt-3 text-brand-gray-500 text-sm">
            By the team at Love Auto Group, Villa Park IL · Updated May 2026
          </p>
        </header>

        <div className="prose prose-lg max-w-none">
          <p className="text-lg text-brand-gray-800 leading-relaxed">
            <strong>If you want a used Lexus in DuPage County, you have
            two real options: a franchise Lexus store (McGrath Westmont,
            Lexus of Naperville, Woodfield, Bill Jacobs) or an
            independent specialist like us at Love Auto Group in Villa
            Park.</strong> Both have a place. This guide explains when
            each makes sense, what to look for on the major models, and
            where the value sits on a 2010 to 2017 RX, ES, IS, or GX.
          </p>

          <h2>Independent vs. Franchise Lexus Dealer in DuPage County</h2>

          <p>
            Franchise Lexus stores carry L/Certified Pre-Owned inventory:
            late-model used Lexus vehicles (typically six years old or
            less, under 70,000 miles) that have passed Lexus&apos; 161-point
            inspection, come with a manufacturer-backed warranty extension
            (up to 6 years / unlimited mileage from original sale date),
            and are sold at a CPO price premium. McGrath Lexus of
            Westmont, Lexus of Naperville, Woodfield Lexus in Schaumburg,
            Lexus of Arlington Heights, and Bill Jacobs Lexus in Naperville
            all run good CPO programs. If you want a 2022 RX 350 with
            factory backing, that is the right path.
          </p>

          <p>
            Independent specialists like us focus on a different price
            point. We buy 2010 to 2017 RX, ES, IS, and GX models at the
            value sweet spot, recondition them in our shop, and price them
            well below franchise CPO. The drivetrains in this generation
            are essentially the same Toyota-derived powertrains the
            franchise stores recondition. The difference is we do not
            carry franchise overhead, so the price drops significantly.
            The trade-off is no Lexus factory warranty (we offer
            third-party service contracts as a separate line item), a
            smaller inventory, and an older average model year.
          </p>

          <p>
            Love Auto Group is family owned, has operated in Villa Park
            since 2014, and specializes in Japanese makes. Lexus is one
            of the makes we know best. Every vehicle is personally inspected
            and reconditioned before it goes on the lot.
          </p>

          <h2>The Value Sweet Spot: 2010 to 2017 Lexus</h2>

          <p>
            The third-generation RX 350 (2010 to 2015) and the matching
            ES, IS, and GX from this era are the value sweet spot on
            the used market. New-car depreciation has flattened, the cars
            still feel current inside, and the long-term reliability data
            is in. A 2012 RX 350 with 110,000 miles bought from us for
            $13,000 has the same Toyota 2GR-FE V6 as a Toyota Highlander
            of the same year, runs to 250,000 miles when serviced
            properly, and still feels like a luxury car when you drive
            it.
          </p>

          <p>
            We typically stock used Lexus in this range, focused on 90,000
            to 130,000 miles. That sounds high to first-time buyers, but
            on a Lexus, 100,000 miles is barely broken in if the previous
            owner kept up with service. The Carfax tells us whether they
            did. We pull a free Carfax on every vehicle and review it
            before listing.
          </p>

          <h2>Models We Keep in Rotation</h2>

          <h3>Lexus RX 350 (2010 to 2015)</h3>
          <p>
            The most reliable mid-size luxury SUV ever built. Two-row,
            front-wheel drive standard, all-wheel drive optional and
            common on the used market. The 3.5L 2GR-FE V6 is the same
            engine family that powers the Toyota Highlander, Camry V6,
            and Avalon. Trims to know: base, Premium, Luxury, F Sport
            (rare in this generation). Buyers come to us specifically
            for the AWD version because it handles a Chicago suburbs
            winter well. Price range $12,000 to $17,000.
          </p>

          <h3>Lexus ES 350 (2013 to 2018)</h3>
          <p>
            The closest thing to a Toyota Avalon wearing a tailored suit.
            Front-wheel drive only (Lexus added AWD to the ES for 2019).
            Same 2GR-FE V6 as the RX. Comfortable, quiet, well-built
            interior that ages gracefully. Best for buyers who want a
            luxury sedan for highway commutes and do not need AWD. Price
            range $12,000 to $16,000.
          </p>

          <h3>Lexus IS 250 / IS 350 (2010 to 2015)</h3>
          <p>
            Compact luxury sport sedan. The IS 250 with the 2.5L V6 is
            reliable but slow. The IS 350 with the 3.5L V6 is genuinely
            quick. Both are rear-wheel drive standard with optional AWD,
            which is common in the Chicago market. Smaller back seat than
            the ES, more athletic ride. Best for buyers who want a
            two-person daily driver that feels sporty. Price range
            $11,000 to $16,000.
          </p>

          <h3>Lexus GX 460 (2010 to 2017)</h3>
          <p>
            Body-on-frame three-row SUV that shares its platform with the
            Toyota 4Runner and Land Cruiser Prado. True off-road
            capability, low-range transfer case, full-time 4WD, and a
            durable 4.6L V8. The Lexus reliability with actual off-road
            chops, which is rare. Best for buyers who tow, drive
            unpaved roads, or want a vehicle that lasts 300,000+ miles
            with basic care. We get one or two GX 460s a year because
            they hold value strongly. Price range $18,000 to $25,000+.
          </p>

          <h2>What We Inspect on Every Used Lexus</h2>

          <ul>
            <li>
              Oil consumption history. RX 350 and ES 350 above 100,000
              miles can develop oil consumption from worn piston rings.
              We check the dipstick at receipt and again before listing
            </li>
            <li>
              Suspension air struts on GX 460 (a known wear point that
              costs $1,500+ to replace). We swap to OEM coil conversion
              kits when air strut wear is documented
            </li>
            <li>Transmission fluid color and shift quality</li>
            <li>VVT-i oil line condition (a 2GR-FE recall item)</li>
            <li>Brake pad and rotor thickness</li>
            <li>
              Tires: matched set, even wear. AWD vehicles need matched
              tires within 2/32&quot; tread depth difference
            </li>
            <li>Interior electronics: navigation, climate, every power feature</li>
            <li>Carfax review for documented service history</li>
          </ul>

          <h2>Lexus Reliability vs. The German Competition</h2>

          <p>
            Buyers shopping a used Lexus often cross-shop a used BMW X3,
            X5, Mercedes-Benz GLE, GLC, or Audi Q5. We do not stock
            German luxury vehicles for a reason: maintenance cost. A 2014
            BMW X5 at 100,000 miles is one suspension air strut, one
            water pump, and one transmission service away from costing
            more than the vehicle is worth. The Lexus equivalent
            (RX 350 in this case) does not have those failure modes at
            the same rate.
          </p>

          <p>
            That is not us trash-talking the German brands. It is a
            cost-of-ownership reality after the warranty expires. If you
            love driving a German car and you can absorb the maintenance
            cost, that is a fine choice. If you want luxury features
            with low total cost of ownership over the next five years,
            Lexus is the safer call.
          </p>

          <h2>Where Buyers Come From</h2>

          <p>
            Villa Park sits centrally in DuPage County. Lexus buyers
            regularly come to us from Lombard (5 minutes), Elmhurst
            (10 minutes), Oak Brook (10 minutes), Glen Ellyn, Addison,
            Wheaton, Naperville, Lisle, Hinsdale, and from Chicago itself
            via I-290 (about 25 minutes from the Loop). For buyers in
            Cook County, the Northwest suburbs, or further afield, we
            are happy to text or email video walkarounds before you make
            the trip.
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
                href="/brands/lexus/"
                className="block bg-white border border-brand-gray-200 rounded-lg p-4 hover:border-brand-red hover:shadow-md transition-all"
              >
                <div className="font-semibold text-brand-gray-900">
                  Used Lexus Inventory
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
            Japanese makes including Lexus, Subaru, Acura, Honda, Toyota,
            and Mazda.
          </p>
        </div>
      </article>

      <section className="bg-brand-navy text-white py-12 mt-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Looking for a specific Lexus?
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
