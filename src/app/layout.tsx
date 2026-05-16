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
    default: "Quality Used Cars in Villa Park, IL | Love Auto Group",
    template: "%s",
  },
  description:
    "Family owned used car dealership in Villa Park, IL since 2014. Quality Japanese vehicles, carefully selected and fully reconditioned. Browse inventory.",
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
    title: "Quality Used Cars in Villa Park, IL | Love Auto Group",
    description:
      "Family owned used car dealership in Villa Park, IL since 2014. Quality Japanese vehicles, carefully selected and fully reconditioned. Browse inventory.",
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
    title: "Quality Used Cars in Villa Park, IL | Love Auto Group",
    description:
      "Family owned used car dealership in Villa Park, IL since 2014. Quality Japanese vehicles, carefully selected and fully reconditioned.",
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

            SEC-M6 (Sam, 2026-05-05): Subresource Integrity (SRI). The
            integrity hash below is the SHA-384 of the upstream bundle as
            of this commit. CarGurus occasionally rotates the file, which
            will cause the browser to reject the load — when that happens
            the badge silently disappears (acceptable graceful degradation)
            and CI's `re-pin-cargurus-sri.yml` workflow re-pins the hash
            on its next run. crossOrigin="anonymous" is required for the
            integrity check to apply against a cross-origin response. */}
        <script dangerouslySetInnerHTML={{ __html: `
var CarGurus=window.CarGurus||{};window.CarGurus=CarGurus;
CarGurus.DealRatingBadge=window.CarGurus.DealRatingBadge||{};
CarGurus.DealRatingBadge.options={
  "style":"STYLE1",
  "minRating":"GOOD_PRICE",
  "showContactForm":true,
  "debug":false,
  "live":false,
  "defaultHeight":"60"
};
(function(){
  var s=document.createElement('script');
  s.src="https://static.cargurus.com/js/api/en_US/1.0/dealratingbadge.js";
  s.async=true;
  s.integrity="sha384-lcY+u0y7nRPriRojg1b26zCQqDRbf8R2Rf+Yxm+bkIZhw5hAydMokFwTBLywCVR+";
  s.crossOrigin="anonymous";
  var e=document.getElementsByTagName('script')[0];
  e.parentNode.insertBefore(s,e);
})();
`}} />
      </body>
    </html