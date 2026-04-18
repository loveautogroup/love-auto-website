import type { Metadata } from "next";
import Link from "next/link";
import StructuredData from "@/components/StructuredData";

// ============================================================================
// About Page — Love Auto Group Story and Values
// ============================================================================

export const metadata: Metadata = {
  title: "About Love Auto Group | Trusted Used Car Dealer Villa Park IL Since 2018",
  description:
    "Learn about Love Auto Group, a family-owned used car dealership in Villa Park, IL since 2018. Honest pricing, thorough inspections, and customer-first service.",
  openGraph: {
    title: "About Love Auto Group | Villa Park IL Used Car Dealer",
    description:
      "Family-owned since 2018. Quality inspected used cars with honest pricing in Villa Park, IL.",
    type: "website",
  },
};

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  name: "Love Auto Group",
  foundingDate: "2018",
  description:
    "Family-owned used car dealership in Villa Park, IL offering quality pre-owned vehicles with honest pricing and flexible financing since 2018.",
  address: {
    "@type": "PostalAddress",
    streetAddress: "735 N Yale Ave",
    addressLocality: "Villa Park",
    addressRegion: "IL",
    postalCode: "60181",
    addressCountry: "US",
  },
  telephone: "(630) 359-3643",
  url: "https://www.loveautogroup.com",
};

export default function AboutPage() {
  return (
    <>
      <StructuredData data={aboutJsonLd} />

      {/* Hero */}
      <section className="bg-[#1B4F72] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            About Love Auto Group
          </h1>
          <p className="text-lg text-blue-100">
            Family-owned. Community-driven. Trusted since 2018.
          </p>
        </div>
      </section>

      {/* Our Story */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4F72] mb-6">
            Our Story
          </h2>
          <div className="space-y-6 text-gray-700 leading-relaxed text-lg">
            <p>
              Love Auto Group was founded in 2018 with a simple mission: make buying a used car an honest, stress-free experience. Based in Villa Park, Illinois, we set out to be the kind of dealership we would want to buy from ourselves — one that puts people before profits and treats every customer like family.
            </p>
            <p>
              What started as a small, family-owned operation has grown into a trusted name across DuPage County. Over the years, we have helped hundreds of families, first-time buyers, and working professionals find reliable vehicles at prices that actually make sense. From Lombard and Addison to Elmhurst, Glen Ellyn, Wheaton, and Oak Brook, drivers across the western suburbs come to Love Auto Group because they know they will be treated right.
            </p>
            <p>
              We are not a big-box dealership with a corporate script. We are real people who live and work in this community. When you walk onto our lot at 735 N Yale Ave, you will meet a team that genuinely cares about putting you in the right car at the right price.
            </p>
          </div>
        </div>
      </section>

      {/* What Makes Us Different */}
      <section className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4F72] mb-8 text-center">
            What Makes Us Different
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="w-16 h-16 bg-[#1B4F72]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#1B4F72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-[#1B4F72] mb-2">
                Thorough Inspection Process
              </h3>
              <p className="text-gray-600">
                Every vehicle undergoes a comprehensive inspection covering mechanical systems, safety equipment, and overall condition. We do not put anything on the lot that we would not drive ourselves or let our families drive.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="w-16 h-16 bg-[#1B4F72]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#1B4F72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-[#1B4F72] mb-2">
                Honest, Transparent Pricing
              </h3>
              <p className="text-gray-600">
                No hidden fees. No bait-and-switch. No last-minute add-ons at the signing table. We research the market to price our vehicles fairly from the start, so you can buy with confidence.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-sm text-center">
              <div className="w-16 h-16 bg-[#1B4F72]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#1B4F72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-semibold text-lg text-[#1B4F72] mb-2">
                Customer-First Service
              </h3>
              <p className="text-gray-600">
                We take the time to understand what you need and what you can afford. No pressure, no rush. Our goal is to earn a customer for life, not just make a sale.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4F72] mb-8 text-center">
            Meet Our Team
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { role: "Owner / General Manager", placeholder: "Team Member" },
              { role: "Sales Manager", placeholder: "Team Member" },
              { role: "Finance Manager", placeholder: "Team Member" },
            ].map((member, index) => (
              <div
                key={index}
                className="bg-gray-100 rounded-xl p-6 text-center"
              >
                <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-lg text-gray-800">
                  {member.placeholder}
                </h3>
                <p className="text-gray-500 text-sm">{member.role}</p>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-500 mt-6 text-sm">
            Team photos and bios coming soon.
          </p>
        </div>
      </section>

      {/* Location Info */}
      <section className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4F72] mb-6 text-center">
            Visit Our Dealership
          </h2>
          <div className="bg-white rounded-xl shadow-sm p-8 text-center">
            <p className="text-xl font-semibold text-gray-800 mb-2">
              Love Auto Group
            </p>
            <p className="text-gray-600 mb-1">735 N Yale Ave</p>
            <p className="text-gray-600 mb-4">Villa Park, IL 60181</p>
            <p className="text-gray-600 mb-6">
              Phone:{" "}
              <a
                href="tel:+16303593643"
                className="text-[#1B4F72] font-semibold hover:underline"
              >
                (630) 359-3643
              </a>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-block bg-[#1B4F72] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[#154360] transition-colors"
              >
                Contact Us
              </Link>
              <a
                href="https://www.google.com/maps/dir//735+N+Yale+Ave,+Villa+Park,+IL+60181"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block border-2 border-[#1B4F72] text-[#1B4F72] font-semibold px-8 py-3 rounded-lg hover:bg-[#1B4F72] hover:text-white transition-colors"
              >
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
