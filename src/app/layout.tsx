import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TextUsButton from "@/components/TextUsButton";
import { LocalBusinessSchema } from "@/components/StructuredData";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Love Auto Group | Quality Used Vehicles | Villa Park, IL",
    template: "%s | Love Auto Group | Villa Park, IL",
  },
  description:
    "Love Auto Group is a family owned used car dealership in Villa Park, IL since 2014. Specializing in quality Japanese vehicles. Every vehicle inspected and reconditioned. Lexus, Subaru, Acura, Mazda and more.",
  keywords: [
    "used cars Villa Park IL",
    "used car dealer DuPage County",
    "Love Auto Group",
    "used Subaru",
    "used Lexus",
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
    title: "Love Auto Group | Quality Used Vehicles | Villa Park, IL",
    description:
      "Family owned since 2014. Quality used vehicles carefully selected and fully reconditioned.",
    url: "https://loveautogroup.com",
    siteName: "Love Auto Group",
    locale: "en_US",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://loveautogroup.com",
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
      </body>
    </html>
  );
}
