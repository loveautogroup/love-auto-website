import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StructuredData from "@/components/StructuredData";
import {
  BUSINESS_NAME,
  SITE_URL,
  ADDRESS,
  PHONE,
  EMAIL,
  OPENING_HOURS_SPECIFICATION,
} from "@/lib/constants";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

// ---------------------------------------------------------------------------
// Site-wide SEO metadata
// ---------------------------------------------------------------------------
export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: "%s | Love Auto Group | Villa Park, IL",
    default:
      "Used Cars for Sale Villa Park IL | Bank Financing Available | Love Auto Group",
  },
  description:
    "Love Auto Group in Villa Park, IL offers quality used cars for sale with bank and credit union financing. Affordable used vehicles near Chicago, Elmhurst, Lombard & DuPage County.",
  keywords: [
    "used cars Villa Park IL",
    "used car financing Villa Park",
    "bank financing used cars Chicago",
    "credit union auto loans Illinois",
    "used car dealer DuPage County",
    "affordable used cars Lombard IL",
    "quality used cars near me",
    "Love Auto Group",
  ],
  authors: [{ name: BUSINESS_NAME }],
  creator: BUSINESS_NAME,
  publisher: BUSINESS_NAME,
  formatDetection: {
    telephone: true,
    email: true,
    address: true,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: BUSINESS_NAME,
    title:
      "Used Cars for Sale Villa Park IL | Bank Financing Available | Love Auto Group",
    description:
      "Quality used cars with bank and credit union financing in Villa Park, IL. Serving Chicago, Elmhurst, Lombard & DuPage County.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Love Auto Group - Used Cars Villa Park IL",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title:
      "Used Cars for Sale Villa Park IL | Bank Financing Available | Love Auto Group",
    description:
      "Quality used cars with bank and credit union financing in Villa Park, IL. Serving Chicagoland.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
};

// ---------------------------------------------------------------------------
// JSON-LD: LocalBusiness + AutoDealer structured data
// ---------------------------------------------------------------------------
const localBusinessJsonLd = {
  "@context": "https://schema.org",
  "@type": ["AutoDealer", "LocalBusiness"],
  "@id": `${SITE_URL}/#business`,
  name: BUSINESS_NAME,
  url: SITE_URL,
  telephone: PHONE.raw,
  email: EMAIL,
  image: `${SITE_URL}/og-image.jpg`,
  logo: `${SITE_URL}/logo.png`,
  description:
    "Love Auto Group is a used car dealership in Villa Park, IL offering bank and credit union financing on quality pre-owned vehicles. Serving Chicago, Elmhurst, Lombard & DuPage County.",
  address: {
    "@type": "PostalAddress",
    streetAddress: ADDRESS.street,
    addressLocality: ADDRESS.city,
    addressRegion: ADDRESS.state,
    postalCode: ADDRESS.zip,
    addressCountry: "US",
  },
  geo: {
    "@type": "GeoCoordinates",
    latitude: 41.8898,
    longitude: -87.9776,
  },
  openingHoursSpecification: OPENING_HOURS_SPECIFICATION.map((spec) => ({
    "@type": "OpeningHoursSpecification",
    dayOfWeek: spec.dayOfWeek,
    opens: spec.opens,
    closes: spec.closes,
  })),
  priceRange: "$$",
  currenciesAccepted: "USD",
  paymentAccepted: "Cash, Credit Card, Financing",
  areaServed: [
    { "@type": "City", name: "Villa Park, IL" },
    { "@type": "City", name: "Elmhurst, IL" },
    { "@type": "City", name: "Lombard, IL" },
    { "@type": "City", name: "Addison, IL" },
    { "@type": "City", name: "Chicago, IL" },
    { "@type": "AdministrativeArea", name: "DuPage County, IL" },
  ],
  sameAs: [],
};

// ---------------------------------------------------------------------------
// Root Layout
// ---------------------------------------------------------------------------
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full`}>
      <body className="min-h-full flex flex-col font-sans antialiased bg-white text-[#2C3E50]">
        <StructuredData data={localBusinessJsonLd} />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
