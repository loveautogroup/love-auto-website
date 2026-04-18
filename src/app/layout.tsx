import type { Metadata } from 'next';
import { Montserrat, Inter } from 'next/font/google';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { SITE_CONFIG } from '@/lib/constants';
import './globals.css';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Love Auto Group | Quality Used Cars in Villa Park, IL',
    template: '%s | Love Auto Group | Villa Park, IL',
  },
  description:
    'Carefully selected, fully reconditioned, and thoroughly inspected quality used vehicles. Family owned dealership in Villa Park, IL specializing in Japanese makes.',
  keywords: [
    'used cars Villa Park IL',
    'Love Auto Group',
    'used car dealer DuPage County',
    'quality used vehicles',
    'Japanese cars for sale',
    'Lexus', 'Subaru', 'Acura', 'Mazda',
    'used car financing',
  ],
  authors: [{ name: 'Love Auto Group' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_CONFIG.url,
    siteName: SITE_CONFIG.name,
    title: 'Love Auto Group | Quality Used Cars in Villa Park, IL',
    description:
      'Carefully selected, fully reconditioned, and thoroughly inspected quality used vehicles. Family owned since 2014.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Love Auto Group',
    description: 'Quality used vehicles in Villa Park, IL. Family owned since 2014.',
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_CONFIG.url,
  },
};

/* JSON-LD structured data for AutoDealer */
function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AutoDealer',
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    telephone: SITE_CONFIG.phone,
    email: SITE_CONFIG.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: SITE_CONFIG.address.street,
      addressLocality: SITE_CONFIG.address.city,
      addressRegion: SITE_CONFIG.address.state,
      postalCode: SITE_CONFIG.address.zip,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: SITE_CONFIG.geo.lat,
      longitude: SITE_CONFIG.geo.lng,
    },
    openingHoursSpecification: [
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Monday', opens: '14:00', closes: '19:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: ['Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '11:00', closes: '19:00' },
      { '@type': 'OpeningHoursSpecification', dayOfWeek: 'Saturday', opens: '12:00', closes: '19:00' },
    ],
    priceRange: '$6,500-$25,000',
    image: `${SITE_CONFIG.url}/images/brand/og-image.jpg`,
    sameAs: [SITE_CONFIG.social.facebook, SITE_CONFIG.social.instagram],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: SITE_CONFIG.googleReviews.rating.toString(),
      reviewCount: SITE_CONFIG.googleReviews.count.toString(),
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${inter.variable} h-full antialiased`}
    >
      <head>
        <LocalBusinessSchema />
      </head>
      <body
        className="min-h-full flex flex-col bg-white text-gray-900"
        style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}
      >
        {/* Skip to main content — accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-red-600 focus:text-white focus:px-4 focus:py-2 focus:rounded-lg"
        >
          Skip to main content
        </a>

        <Header />
        <main id="main-content" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
