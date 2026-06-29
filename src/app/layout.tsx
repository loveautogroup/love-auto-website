import type { Metadata } from "next";
import { Inter, Montserrat } from "next/font/google";
import "./globals.css";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/context/LanguageContext";
import { ReviewsProvider } from "@/context/ReviewsContext";
import { getGoogleReviews } from "@/lib/google-reviews";
import TextUsButton from "@/components/TextUsButton";
import StickyCTA from "@/components/StickyCTA";
import { LocalBusinessSchema } from "@/components/StructuredData";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

const inter = Inter({ subsets: ["latin"], display: "swap" });
// Montserrat powers the wordmark logo + the hero phone/URL badges so the
// HTML overlay renders the SAME font the bake compositor uses (real
// Montserrat, not the old Arial Black fallback). Exposed as a CSS var.
const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600", "900"],
  display: "swap",
  variable: "--font-montserrat",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.loveautogroup.net"),
  title: {
    default: "Japanese Makes in Villa Park IL, 20 Miles from Chicago | Love Auto Group",
    template: "%s",
  },
  description:
    "Japanese makes specialist in Villa Park IL — 20 miles from Chicago. Used Lexus, Subaru, Acura, Mazda, Honda. 4.7★ on Google, 125+ reviews. Family owned since 2014.",
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
    "used car dealer 20 miles from Chicago",
    "Japanese makes Villa Park IL",
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
    title: "Japanese Makes in Villa Park IL, 20 Miles from Chicago | Love Auto Group",
    description:
      "Japanese makes specialist in Villa Park IL — 20 miles from Chicago. Used Lexus, Subaru, Acura, Mazda, Honda. 4.7★ on Google, 125+ reviews. Family owned since 2014.",
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
    title: "Japanese Makes in Villa Park IL, 20 Miles from Chicago | Love Auto Group",
    description:
      "Japanese makes specialist in Villa Park IL — 20 miles from Chicago. Used Lexus, Subaru, Acura, Mazda, Honda. Family owned since 2014.",
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const googleReviews = await getGoogleReviews();
  return (
    <html lang="en" className={`${inter.className} ${montserrat.variable}`} suppressHydrationWarning>
      <body className="bg-brand-gray-50 text-brand-gray-900 antialiased">
        <ReviewsProvider value={googleReviews}>
        <LanguageProvider>
        <a href="#main-content" className="skip-link">
          Skip to main content
        </a>
        <LocalBusinessSchema />
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
        <TextUsButton />
        <StickyCTA />
        </LanguageProvider>
        </ReviewsProvider>
        {/* CarGurus Deal Rating Badge SDK — self-injecting IIFE.
            Options per CarGurus' documented set (DealRatingBadge.html).
            style=STYLE1 + minRating=FAIR_PRICE (Jeremiah 2026-06-24 — compact badge,
            shown for Great/Good/Fair). The badge never rendered because our own CSP
            blocked the rating call to www.cargurus.com; fixed 2026-06-24 by adding it
            to connect-src in public/_headers. live=true so the SDK re-scans the DOM
            and picks up cards rendered AFTER first paint — the inventory filter grid
            + homepage featured cards inject VehicleCard spans client-side, so with
            live:false they never got badges. Safe now: requests succeed + are cached
            (the old "50+ failed requests" storm was the CSP-blocked retries).
            data-cg-zip stays removed. defaultHeight 60 on detail; cards override to
            40 (smaller on listing pages, per CarGurus guidance).

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
  "minRating":"FAIR_PRICE",
  "showContactForm":true,
  "live":true,
  "liveIntervalMS":1000,
  "defaultHeight":"60",
  "debug":false
};
(function(){
  var s=document.createElement('script');
  s.src="https://static.cargurus.com/js/api/en_US/1.0/dealratingbadge.js";
  s.async=true;
  var e=document.getElementsByTagName('script')[0];
  e.parentNode.insertBefore(s,e);
})();
`}} />
        {/* GA4 funnel attribution (S2-1) — view_vehicle / form_submit /
            click_phone events fire from VDPTracker, the lead + financing
            forms, and PhoneCTA. */}
        <GoogleAnalytics />
        {/* Cloudflare Web Analytics (W2, Jun 7 2026) — RUM beacon feeding the
            per-VDP view counts. Auto-injection doesn't work on Pages-served
            sites, so the snippet is embedded. The token is the PUBLIC site
            token (site_tag 2e53d0ae1d184af9896e40b3669ae5ac). */}
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "c53f3b1dba644a4086838c08b1f57751"}'
        />
      </body>
    </html>
  );
}
