import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Script from "next/script";
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
        {/* CarGurus Deal Rating Badge SDK
            Settings: style1, minRating=good, height=60, live=true,
            liveInterval=500ms, showContactForm=true — configured by Jeremiah. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.cgAsyncInit=function(){CG.init({style:'style1',minRating:'good',height:60,live:true,liveInterval:500,showContactForm:true})};`,
          }}
        />
        <Script
          id="cg-badge-sdk"
          src="https://www.cargurus.com/js/coshopper/cg-deal-rating-badge.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
