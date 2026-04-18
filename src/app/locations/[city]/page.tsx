import type { Metadata } from "next";
import Link from "next/link";
import StructuredData from "@/components/StructuredData";

// ============================================================================
// City Data — distance, direction, and unique description for each target city
// ============================================================================

interface CityData {
  name: string;
  slug: string;
  distance: string;
  direction: string;
  tagline: string;
  paragraphs: string[];
}

const cityData: Record<string, CityData> = {
  lombard: {
    name: "Lombard",
    slug: "lombard",
    distance: "2 miles",
    direction: "east",
    tagline: "Just minutes from downtown Lombard on Roosevelt Road",
    paragraphs: [
      "Love Auto Group is proud to serve drivers in Lombard, IL, located just 2 miles east of our Villa Park showroom on Roosevelt Road. Whether you live near Lilacia Park, shop at Yorktown Center, or commute along I-355, our dealership is a quick trip from anywhere in Lombard. We carry a wide selection of inspected, affordably priced used cars, trucks, and SUVs perfect for Lombard families and commuters.",
      "Lombard residents love our straightforward approach to used car buying. There are no hidden fees, no pressure tactics — just honest pricing and quality vehicles you can count on. Many of our repeat customers drive from Lombard because they know we treat every buyer like a neighbor, not a number.",
      "Stop by our showroom at 735 N Yale Ave in Villa Park, or give us a call at (630) 359-3643 to schedule a test drive. From downtown Lombard, head west on Roosevelt Road and you will be at our lot in about five minutes.",
    ],
  },
  addison: {
    name: "Addison",
    slug: "addison",
    distance: "3 miles",
    direction: "north",
    tagline: "A quick drive south on Addison Road",
    paragraphs: [
      "Looking for a reliable used car near Addison, IL? Love Auto Group is just 3 miles south of Addison on Addison Road, making us one of the closest quality used car dealerships to the Addison community. Whether you are near Lake Addison, the Addison Trail area, or the industrial corridor along Lake Street, our Villa Park lot is an easy drive away.",
      "Addison drivers appreciate our no-hassle financing options. We work with banks and credit unions to find competitive rates for every customer. Whether you have great credit or are rebuilding, our team will help you find a payment plan that fits your budget. We have helped hundreds of Addison-area residents get behind the wheel.",
      "Ready to find your next vehicle? Visit us at 735 N Yale Ave in Villa Park — just head south on Addison Road to Roosevelt Road and turn east. Or call (630) 359-3643 to check availability before you visit.",
    ],
  },
  elmhurst: {
    name: "Elmhurst",
    slug: "elmhurst",
    distance: "3 miles",
    direction: "east",
    tagline: "Conveniently located right off North Ave",
    paragraphs: [
      "Elmhurst residents searching for quality used cars do not have to look far. Love Auto Group is conveniently located just 3 miles west of downtown Elmhurst, right off North Avenue in Villa Park. From Elmhurst College to Spring Road shops, our dealership serves the entire Elmhurst community with dependable, inspected pre-owned vehicles.",
      "What sets Love Auto Group apart for Elmhurst buyers is our commitment to transparency. Every vehicle on our lot goes through a thorough inspection, and we price our cars honestly from the start. Elmhurst families trust us because we stand behind every sale with integrity and genuine customer care.",
      "Swing by 735 N Yale Ave in Villa Park today — from Elmhurst, take North Avenue west or Roosevelt Road west, and you will arrive in just a few minutes. Call us at (630) 359-3643 to reserve a test drive or ask about our current inventory.",
    ],
  },
  "glen-ellyn": {
    name: "Glen Ellyn",
    slug: "glen-ellyn",
    distance: "5 miles",
    direction: "west",
    tagline: "An easy drive east on Roosevelt Road",
    paragraphs: [
      "Glen Ellyn drivers looking for a trusted used car dealer will find everything they need at Love Auto Group in nearby Villa Park — just 5 miles east on Roosevelt Road. Whether you are near the Glen Ellyn Civic Center, Lake Ellyn, or the Metra station, our dealership is a short drive that is well worth the trip.",
      "We have been serving Glen Ellyn and the surrounding DuPage County communities since 2018, building a reputation for fair deals and quality vehicles. Our bank and credit union financing partnerships make it easy for Glen Ellyn residents to drive home in a reliable vehicle with competitive rates and flexible terms.",
      "Visit our lot at 735 N Yale Ave, Villa Park, IL 60181. From Glen Ellyn, take Roosevelt Road east — you will be here in about 10 minutes. Or call (630) 359-3643 to speak with our team about your next vehicle.",
    ],
  },
  wheaton: {
    name: "Wheaton",
    slug: "wheaton",
    distance: "7 miles",
    direction: "west",
    tagline: "Worth the short drive from downtown Wheaton",
    paragraphs: [
      "Wheaton residents, your search for an affordable, reliable used car ends at Love Auto Group in Villa Park — just 7 miles east of downtown Wheaton. Whether you commute to Chicago on the Metra, work near Wheaton College, or drive the kids to school along Butterfield Road, we have vehicles that fit your life and your budget.",
      "The short drive from Wheaton to our Villa Park showroom is absolutely worth it. Love Auto Group works with trusted banks and credit unions to offer competitive financing that bigger dealerships simply cannot match. Whether you have excellent credit or are working on building it, our team will find the right lender for your situation. We have helped families from Wheaton and western DuPage County find quality pre-owned vehicles since 2018.",
      "Head east on Roosevelt Road or take I-355 south to reach us at 735 N Yale Ave, Villa Park. The drive takes about 15 minutes, and we promise it is time well spent. Call (630) 359-3643 to get started.",
    ],
  },
  "oak-brook": {
    name: "Oak Brook",
    slug: "oak-brook",
    distance: "4 miles",
    direction: "south",
    tagline: "Just north of Oak Brook off Route 83",
    paragraphs: [
      "Oak Brook drivers deserve quality used cars at honest prices — and that is exactly what Love Auto Group delivers from our Villa Park location, just 4 miles north of Oak Brook off Route 83. Whether you work near Oakbrook Center, live in the Oak Brook Terrace area, or commute along I-88, our dealership is a convenient stop.",
      "While Oak Brook is known for upscale shopping, Love Auto Group is known for down-to-earth car buying. We skip the high-pressure sales tactics and inflated pricing you might find at larger dealerships. Instead, we offer straightforward deals on thoroughly inspected used cars, trucks, and SUVs — all backed by genuine customer service.",
      "Come see us at 735 N Yale Ave, Villa Park, IL 60181. From Oak Brook, head north on Route 83 and you will arrive in about 10 minutes. Call (630) 359-3643 to schedule a test drive or inquire about financing options.",
    ],
  },
};

// ============================================================================
// Static Params — pre-build all city pages at build time
// ============================================================================

export function generateStaticParams() {
  return Object.keys(cityData).map((city) => ({ city }));
}

// ============================================================================
// Dynamic Metadata
// ============================================================================

interface PageProps {
  params: Promise<{ city: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { city } = await params;
  const data = cityData[city];
  if (!data) return {};

  return {
    title: `Used Cars for Sale ${data.name} IL | Love Auto Group Near ${data.name}`,
    description: `${data.tagline}. Browse affordable used cars, trucks, and SUVs near ${data.name}, IL. Bank and credit union financing available. Love Auto Group — ${data.distance} from ${data.name}.`,
    openGraph: {
      title: `Used Cars for Sale Near ${data.name}, IL | Love Auto Group`,
      description: `Quality used cars ${data.distance} from ${data.name}. Visit Love Auto Group in Villa Park for honest pricing and flexible financing.`,
      type: "website",
    },
  };
}

// ============================================================================
// Page Component
// ============================================================================

export default async function CityLocationPage({ params }: PageProps) {
  const { city } = await params;
  const data = cityData[city];

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-gray-600">City not found.</p>
      </div>
    );
  }

  const localBusinessData = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    name: "Love Auto Group",
    description: `Used car dealer serving ${data.name}, IL — ${data.distance} ${data.direction} of Villa Park.`,
    address: {
      "@type": "PostalAddress",
      streetAddress: "735 N Yale Ave",
      addressLocality: "Villa Park",
      addressRegion: "IL",
      postalCode: "60181",
      addressCountry: "US",
    },
    telephone: "(630) 359-3643",
    areaServed: {
      "@type": "City",
      name: `${data.name}, IL`,
    },
  };

  return (
    <>
      <StructuredData data={localBusinessData} />

      {/* Hero Section */}
      <section className="bg-[#1B4F72] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Used Cars for Sale Near {data.name}, IL
          </h1>
          <p className="text-lg sm:text-xl text-blue-100 mb-2">
            {data.tagline}
          </p>
          <p className="text-blue-200">
            Only {data.distance} {data.direction} of {data.name} in Villa Park
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg max-w-none">
            {data.paragraphs.map((paragraph, index) => (
              <p key={index} className="text-gray-700 leading-relaxed mb-6">
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      </section>

      {/* Why Buy From Us */}
      <section className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4F72] mb-8 text-center">
            Why {data.name} Residents Choose Love Auto Group
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg text-[#1B4F72] mb-2">
                Thorough Vehicle Inspections
              </h3>
              <p className="text-gray-600">
                Every car on our lot is inspected for safety and reliability before it goes up for sale. No surprises — just dependable vehicles.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg text-[#1B4F72] mb-2">
                Honest, Upfront Pricing
              </h3>
              <p className="text-gray-600">
                Our prices are fair and transparent. No hidden fees, no last-minute add-ons. The price you see is the price you pay.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg text-[#1B4F72] mb-2">
                Flexible Financing Options
              </h3>
              <p className="text-gray-600">
                Bank and credit union financing with competitive rates. We work with your budget, not against it.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg text-[#1B4F72] mb-2">
                Family-Owned Since 2018
              </h3>
              <p className="text-gray-600">
                We are a local, family-owned business that treats every customer like a neighbor. Your satisfaction is our reputation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto bg-[#1B4F72] rounded-2xl p-8 sm:p-12 text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Ready to Find Your Next Car?
          </h2>
          <p className="text-blue-100 mb-8 text-lg">
            Browse our current inventory online or visit us in Villa Park — just {data.distance} from {data.name}.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/inventory"
              className="inline-block bg-white text-[#1B4F72] font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors"
            >
              Browse Inventory
            </Link>
            <a
              href="tel:+16303593643"
              className="inline-block border-2 border-white text-white font-semibold px-8 py-3 rounded-lg hover:bg-white/10 transition-colors"
            >
              Call (630) 359-3643
            </a>
          </div>
        </div>
      </section>

      {/* Directions / Map */}
      <section className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#1B4F72] mb-4">
            Directions from {data.name} to Love Auto Group
          </h2>
          <p className="text-gray-600 mb-6">
            735 N Yale Ave, Villa Park, IL 60181 — {data.distance} {data.direction} of {data.name}
          </p>
          <a
            href={`https://www.google.com/maps/dir/${encodeURIComponent(data.name + ", IL")}/${encodeURIComponent("735 N Yale Ave, Villa Park, IL 60181")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block bg-[#1B4F72] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[#154360] transition-colors"
          >
            Get Directions on Google Maps
          </a>
        </div>
      </section>
    </>
  );
}
