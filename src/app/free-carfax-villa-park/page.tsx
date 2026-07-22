import type { Metadata } from "next";
import Link from "next/link";
import LivePreviewGrid from "@/components/LivePreviewGrid";
import CarfaxAdvantageBadge from "@/components/CarfaxAdvantageBadge";
import { BreadcrumbSchema } from "@/components/StructuredData";

export const metadata: Metadata = {
  title: "Free Carfax Report on Every Used Car Near Chicago | Love Auto Group",
  description:
    "Every used car at our Villa Park dealership near Chicago comes with a free Carfax report already pulled. No signup, no fee, no exceptions. See the full history before you buy.",
  alternates: { canonical: "https://www.loveautogroup.net/free-carfax-villa-park" },
  openGraph: {
    title: "Free Carfax Report on Every Used Car Near Chicago | Love Auto Group",
    description:
      "Every used car at our Villa Park dealership near Chicago comes with a free Carfax report already pulled. No signup, no fee, no exceptions.",
    url: "https://www.loveautogroup.net/free-carfax-villa-park",
    type: "website",
    siteName: "Love Auto Group",
  },
};

export default function FreeCarfaxLanding() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.loveautogroup.net/" },
          {
            name: "Free Carfax",
            url: "https://www.loveautogroup.net/free-carfax-villa-park/",
          },
        ]}
      />

      {/* Breadcrumb */}
      <nav className="max-w-7xl mx-auto px-4 py-4 text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-brand-gray-500">
          <li><Link href="/" className="hover:text-brand-red">Home</Link></li>
          <li>/</li>
          <li className="text-brand-gray-900 font-medium">Free Carfax on Every Vehicle</li>
        </ol>
      </nav>

      {/* Hero with badge */}
      <section className="bg-brand-navy text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-[1fr_auto] items-center gap-8">
          <div>
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">
              Free Carfax on Every Used Car —
              <span className="block text-brand-red mt-2">No Fees, No Exceptions</span>
            </h1>
            <p className="mt-4 text-lg md:text-xl text-brand-gray-300 max-w-2xl">
              Love Auto Group is a Carfax Advantage Dealer. Every vehicle in our Villa Park, IL inventory comes with a free Carfax history report you can pull directly from the listing — no email signup, no haggling, no exceptions.
            </p>
          </div>
          <CarfaxAdvantageBadge size="lg" />
        </div>
      </section>

      {/* Editorial */}
      <article className="max-w-4xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-brand-gray-900 mb-4">What "Carfax Advantage Dealer" Actually Means</h2>
        <p className="text-brand-gray-700 leading-relaxed mb-4">
          Carfax Advantage Dealer is an accreditation program — Carfax independently verifies that a dealer reports vehicle service activity, accident records, and ownership history into the Carfax database, and provides a free Carfax history report on every vehicle in inventory. It's not a self-claimed badge. Carfax has to confirm we meet the standard.
        </p>
        <p className="text-brand-gray-700 leading-relaxed mb-8">
          Most local independent dealers don't bother with the program because it requires a real reporting commitment. We've kept our Advantage status since we opened in Villa Park in 2014 because the transparency it provides is exactly the kind of trust signal our customers ask for.
        </p>

        <h2 className="text-2xl font-bold text-brand-gray-900 mb-4">What's in a Carfax History Report</h2>
        <p className="text-brand-gray-700 leading-relaxed mb-4">
          When you pull a Carfax report on a vehicle from our inventory, you'll see: full ownership history (number of previous owners, where the vehicle was registered), title status (clean, salvage, rebuilt, lemon, flood — anything that should affect the buying decision), accident records (reported accidents, severity, repair locations), service history (oil changes, mechanical work, recalls completed), and odometer history (mileage at every reported event, with red flags if the readings don't progress logically).
        </p>
        <p className="text-brand-gray-700 leading-relaxed mb-8">
          That's the same report that costs around $40 to pull as a private buyer on the Carfax website. We provide it for free on every car we list.
        </p>

        <h2 className="text-2xl font-bold text-brand-gray-900 mb-4">How to Pull a Free Carfax Report on Our Inventory</h2>
        <p className="text-brand-gray-700 leading-relaxed mb-4">
          Open any vehicle listing on our site. Click the <strong>CARFAX FREE REPORT</strong> button in the top-left of the photo. The report opens in a new tab. That's it — no signup, no email gate, no upsell.
        </p>
        <p className="text-brand-gray-700 leading-relaxed mb-8">
          One honest limit: our Carfax Advantage status covers our own inventory, so we can only pull a free report on a vehicle we actually have on our lot. If you've found a car for sale somewhere else, we can't pull a Carfax on it for you at no charge - Carfax's own site is where that report comes from, and it isn't free there. What we can tell you: every car <em>we</em> sell already has the report pulled and waiting, which is one less thing to chase down before you buy.
        </p>

        <h2 className="text-2xl font-bold text-brand-gray-900 mb-4">Why This Matters Buying Used in Villa Park</h2>
        <p className="text-brand-gray-700 leading-relaxed mb-4">
          Used-car shopping in DuPage County means dealing with vehicles that have lived through Chicago winters, rust-belt road salt, and several previous owners. The single best protection a buyer has is a complete service and accident history before signing anything. The Carfax report is the closest thing to that you can get on a vehicle you don't know personally.
        </p>
        <p className="text-brand-gray-700 leading-relaxed mb-8">
          Our Carfax Advantage status is a permanent commitment to making that history available to every shopper who walks onto our lot or browses our website. That's the kind of dealer we are. That's the kind of buying experience our customers tell us they want.
        </p>
        <p className="text-brand-gray-700 leading-relaxed">
          Shopping specifically in Villa Park? Start with our{" "}
          <Link href="/used-cars-villa-park-il/" className="text-brand-red hover:underline font-semibold">
            Villa Park used car guide
          </Link>
          . Looking for a Subaru? Every one on our{" "}
          <Link href="/brands/subaru/" className="text-brand-red hover:underline font-semibold">
            Subaru inventory page
          </Link>{" "}
          comes with the same free Carfax report.
        </p>
      </article>

      {/* Inventory preview */}
      <section className="max-w-7xl mx-auto px-4 pb-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-gray-900">
            Browse Inventory — Free Carfax on Every Listing
          </h2>
        </div>
        <LivePreviewGrid />
        <div className="text-center mt-10">
          <Link
            href="/inventory"
            className="inline-flex items-center bg-brand-red hover:bg-brand-red-dark text-white px-8 py-3 rounded-xl font-semibold"
          >
            View All Inventory
          </Link>
        </div>
      </section>
    </>
  );
}
