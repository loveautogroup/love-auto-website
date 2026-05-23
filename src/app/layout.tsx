import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TextUsButton from "@/components/TextUsButton";
import StickyCTA from "@/components/StickyCTA";
import { LocalBusinessSchema } from "@/components/StructuredData";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL("https://www.loveautogroup.net"),
  title: {
    default: "Used Cars in Villa Park IL, Japanese Makes Specialist | Love Auto Group",
    template: "%s",
  },
  description:
    "Independent dealer specializing in used Lexus, Subaru, Acura, Mazda, and Honda in Villa Park IL. 4.7 stars on Google with 125+ reviews. Family owned since 2014. View inventory.",
  keywords: [
    "used cars Villa Park IL",
    "used car dealership Villa Park",
    "Japanese used cars DuPage County",
    "family owned dealership",
    "used Lexus",
    "used Subaru",
    "used Acura",
    "used Mazda",
    "cars for sale near Chicago",
  ],
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: "/favicon.ico",
  },
  openGraph: {
    title: "Used Cars in Villa Park IL, Japanese Makes Specialist | Love Auto Group",
    description:
      "Independent dealer specializing in used Lexus, Subaru, Acura, Mazda, and Honda in Villa Park IL. 4.7 stars on Google with 125+ reviews. Family owned since 2014. View inventory.",
    url: "https://www.loveautogroup.net",
    siteName: "Love Auto Group",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://www.loveautogroup.net/og-image.png",
        width: 1200,
        height: 630,
        alt: "Love Auto Group — Quality Used Cars in Villa Park, IL",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    // 2026-05-05 — added site/creator handles per Charlotte SEO audit.
    // X/Twitter is not a primary channel for us, but having the handles
    // wired makes the cards parse cleanly for any engine that reads them.
    site: "@loveautogroup",
    creator: "@loveautogroup",
    title: "Used Cars in Villa Park IL, Japanese Makes Specialist | Love Auto Group",
    description:
      "Independent dealer specializing in used Lexus, Subaru, Acura, Mazda, and Honda in Villa Park IL. Family owned since 2014. View inventory.",
    images: ["https://www.loveautogroup.net/og-image.png"],
  },
  verification: {
    google: "l6ab4DiDlnOSGeg0EiwLqR2qt4wUPCULG0_ZdefZMp8",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.loveautogroup.net",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="bg-brand-gray-50 text-brand-gray-900 antialiased">
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <LocalBusinessSchema />
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
        <TextUsButton />
        <StickyCTA />
        {/* CarGurus Deal Rating Badge SDK — self-injecting IIFE.
            Settings match Jeremiah's configurator: STYLE1, GOOD_PRICE minimum,
            60px height, live updates every 500ms, showContactForm enabled.

            NOTE: SRI hash removed (2026-05-17). CarGurus rotates their bundle
            regularly; an outdated integrity hash causes browsers to silently
            block the script load, making badges disappear. The re-pin-cargurus-
            sri.yml workflow catches drift but opens a PR rather than auto-
            merging, so stale hashes persist in prod. Since this is a first-party
            CarGurus CDN with no user-submitted content, SRI adds minimal
            security benefit vs. the downtime cost. */}
        <script dangerouslySetInnerHTML={{ __html: `
var CarGurus=window.CarGurus||{};window.CarGurus=CarGurus;
CarGurus.DealRatingBadge=window.CarGurus.DealRatingBadge||{};
CarGurus.DealRatingBadge.options={
  "style":"STYLE1",
  "minRating":"GOOD_PRICE",
  "showContactForm":true,
  "debug":false,
  "live":true,
  "liveIntervalMS":500,
  "defaultHeight":"60"
};
(function(){
  var s=document.createElement('script');
  s.src="https://static.cargurus.com/js/api/en_US/1.0/dealratingbadge.js";
  s.async=true;
  var e=document.getElementsByTagName('script')[0];
  e.parentNode.insertBefore(s,e);
})();
`}} />
      </body>
    </html>
  );
}
