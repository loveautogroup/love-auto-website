import { SITE_CONFIG } from "@/lib/constants";
import { Vehicle } from "@/lib/types";

export function LocalBusinessSchema() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `${SITE_CONFIG.url}/#dealership`,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.url,
    telephone: SITE_CONFIG.phone,
    email: SITE_CONFIG.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: SITE_CONFIG.address.street,
      addressLocality: SITE_CONFIG.address.city,
      addressRegion: SITE_CONFIG.address.state,
      postalCode: SITE_CONFIG.address.zip,
      addressCountry: "US",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Monday",
        opens: "14:00",
        closes: "19:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "11:00",
        closes: "19:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: "Saturday",
        opens: "12:00",
        closes: "19:00",
      },
    ],
    geo: {
      "@type": "GeoCoordinates",
      latitude: SITE_CONFIG.geo.lat,
      longitude: SITE_CONFIG.geo.lng,
    },
    priceRange: "$4,500–$18,000",
    image: `${SITE_CONFIG.url}/images/storefront.jpg`,
    // Sam's notes: AggregateRating uses real Google Business profile data
    // (rating + count from SITE_CONFIG.reviews.google). Update via Google
    // Places API sync in a future revision.
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: SITE_CONFIG.reviews.google.rating.toFixed(1),
      reviewCount: SITE_CONFIG.reviews.google.count,
      bestRating: "5",
      worstRating: "1",
    },
    sameAs: [
      SITE_CONFIG.social.facebook,
      SITE_CONFIG.social.google,
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

export function VehicleSchema({ vehicle }: { vehicle: Vehicle }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${vehicle.year} ${vehicle.make} ${vehicle.model} ${vehicle.trim}`,
    brand: { "@type": "Brand", name: vehicle.make },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    mileageFromOdometer: {
      "@type": "QuantitativeValue",
      value: String(vehicle.mileage),
      unitCode: "SMI",
    },
    color: vehicle.exteriorColor,
    vehicleInteriorColor: vehicle.interiorColor,
    driveWheelConfiguration:
      vehicle.drivetrain === "AWD"
        ? "AllWheelDriveConfiguration"
        : vehicle.drivetrain === "4WD"
          ? "FourWheelDriveConfiguration"
          : vehicle.drivetrain === "RWD"
            ? "RearWheelDriveConfiguration"
            : "FrontWheelDriveConfiguration",
    vehicleTransmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    vehicleIdentificationNumber: vehicle.vin,
    bodyType: vehicle.bodyStyle,
    vehicleEngine: {
      "@type": "EngineSpecification",
      name: vehicle.engine,
    },
    offers: {
      "@type": "Offer",
      price: String(vehicle.price),
      priceCurrency: "USD",
      availability:
        vehicle.status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/LimitedAvailability",
      seller: {
        "@type": "AutoDealer",
        "@id": `${SITE_CONFIG.url}/#dealership`,
        name: SITE_CONFIG.name,
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE_CONFIG.address.street,
          addressLocality: SITE_CONFIG.address.city,
          addressRegion: SITE_CONFIG.address.state,
          postalCode: SITE_CONFIG.address.zip,
        },
        telephone: SITE_CONFIG.phone,
      },
    },
    image: vehicle.images,
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * BreadcrumbList — adds breadcrumb rich result eligibility to inner pages.
 * Pass an ordered list of {name, url} pairs from root → current page.
 */
export function BreadcrumbSchema({ items }: { items: { name: string; url: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * FAQPage — emit on the FAQ page so Google can serve the rich-result
 * accordion in SERPs. Q/A pairs are passed as {question, answer} objects.
 */
export function FAQSchema({ items }: { items: { question: string; answer: string }[] }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
