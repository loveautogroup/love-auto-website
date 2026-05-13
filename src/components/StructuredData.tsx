import { SITE_CONFIG } from "@/lib/constants";
import { Vehicle } from "@/lib/types";

export function LocalBusinessSchema() {
  // Schema upgraded 2026-05-02 (AEO audit follow-up). Added:
  //   - description: gives engines a clean quotable sentence with
  //     "family owned" + Japanese specialty + service area baked in.
  //     Closes the Google AI Overview Q8 miss on "family owned"
  //     and reinforces the Q5/Q6 brand-near-Chicago positioning.
  //   - foundingDate: 2014. Closes the Claude.ai factual error
  //     ("operating since 2018"); locks in correct founding year
  //     for every engine that reads schema.
  //   - slogan: short owner-voice tagline that engines can lift verbatim.
  //   - areaServed: explicit DuPage County + city list. Closes the Q4
  //     county-level content gap as a structured signal in addition to
  //     the new /serving/dupage-county-il/ page.
  //   - knowsAbout: brand specialty list. Reinforces Q5/Q6 brand-near-
  //     Chicago answers because engines can see we work specifically on
  //     these makes, not generic "any used car."
  const schema = {
    "@context": "https://schema.org",
    "@type": "AutoDealer",
    "@id": `${SITE_CONFIG.url}/#dealership`,
    name: SITE_CONFIG.name,
    legalName: "Love Auto Group Inc.",
    description:
      "Family owned used car dealer in Villa Park, IL since 2014. Specialists in used Subaru, Lexus, Acura, Honda, Toyota, and Mazda. Serving DuPage County and the western Chicago suburbs.",
    slogan: "Family owned in Villa Park, IL since 2014",
    foundingDate: "2014",
    knowsAbout: [
      "Used Subaru",
      "Used Lexus",
      "Used Acura",
      "Used Honda",
      "Used Toyota",
      "Used Mazda",
      "All-Wheel Drive vehicles",
      "Japanese used cars",
      "Carfax vehicle history reports",
    ],
    areaServed: [
      {
        "@type": "AdministrativeArea",
        name: "DuPage County, Illinois",
      },
      { "@type": "City", name: "Villa Park, IL" },
      { "@type": "City", name: "Lombard, IL" },
      { "@type": "City", name: "Elmhurst, IL" },
      { "@type": "City", name: "Oak Brook, IL" },
      { "@type": "City", name: "Glen Ellyn, IL" },
      { "@type": "City", name: "Addison, IL" },
      { "@type": "City", name: "Wheaton, IL" },
      { "@type": "City", name: "Naperville, IL" },
      { "@type": "City", name: "Hinsdale, IL" },
      { "@type": "City", name: "Bloomingdale, IL" },
    ],
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
    // AggregateRating uses real Google Business profile data
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
  // Schema upgraded 2026-04-28 to be Google Vehicle Listings compliant
  // (https://developers.google.com/search/docs/appearance/structured-data/vehicle-listing).
  // Key additions vs. v1: itemCondition, validFrom on offer, subjectOf
  // back-link, numberOfPreviousOwners (when available), seller.url +
  // seller.image, priceCurrency on offer, vehicleConfiguration trim line.
  // Gets us into the Google Vehicles search vertical.
  const vdpUrl = `${SITE_CONFIG.url}/inventory/${vehicle.slug}`;
  const heroImage = vehicle.images?.[0]
    ? vehicle.images[0].startsWith("http")
      ? vehicle.images[0]
      : `${SITE_CONFIG.url}${vehicle.images[0]}`
    : undefined;

  // Per-VIN absolute image URLs (Google requires absolute, not relative).
  const absoluteImages = (vehicle.images ?? []).map((img) =>
    img.startsWith("http") ? img : `${SITE_CONFIG.url}${img}`,
  );

  // Availability mapping — Google reads these specifically.
  const availability =
    vehicle.status === "available"
      ? "https://schema.org/InStock"
      : vehicle.status === "sold"
        ? "https://schema.org/SoldOut"
        : "https://schema.org/LimitedAvailability";

  // Derive year-only production date in ISO format (Vehicle Listings prefers
  // a date over a string year for productionDate).
  const productionDate = vehicle.year
    ? `${vehicle.year}-01-01`
    : undefined;

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Car",
    "@id": vdpUrl,
    name: `${vehicle.year} ${vehicle.make} ${vehicle.model}${
      vehicle.trim ? ` ${vehicle.trim}` : ""
    }`,
    description: vehicle.description ?? undefined,
    url: vdpUrl,
    image: absoluteImages,
    brand: { "@type": "Brand", name: vehicle.make },
    manufacturer: { "@type": "Organization", name: vehicle.make },
    model: vehicle.model,
    vehicleModelDate: String(vehicle.year),
    productionDate,
    vehicleConfiguration: vehicle.trim,
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
    itemCondition: "https://schema.org/UsedCondition",
    vehicleEngine: {
      "@type": "EngineSpecification",
      name: vehicle.engine,
    },
    // Number of previous owners — pulled from Carfax snapshot when present.
    // Google Vehicle Listings uses this for the "1 Owner" badge.
    ...((vehicle as unknown as { carfaxSnapshot?: { ownerCount?: number } })
      .carfaxSnapshot?.ownerCount !== undefined
      ? {
          numberOfPreviousOwners: (
            vehicle as unknown as { carfaxSnapshot?: { ownerCount?: number } }
          ).carfaxSnapshot?.ownerCount,
        }
      : {}),
    offers: {
      "@type": "Offer",
      price: String(vehicle.price),
      priceCurrency: "USD",
      itemCondition: "https://schema.org/UsedCondition",
      availability,
      url: vdpUrl,
      // validFrom: when this offer became active. We don't track this
      // precisely; use today's date so re-renders don't flap. Vercel
      // rebuild renews this on every deploy.
      validFrom: new Date().toISOString().slice(0, 10),
      seller: {
        "@type": "AutoDealer",
        "@id": `${SITE_CONFIG.url}/#dealership`,
        name: SITE_CONFIG.name,
        url: SITE_CONFIG.url,
        image: `${SITE_CONFIG.url}/images/storefront.jpg`,
        telephone: SITE_CONFIG.phone,
        address: {
          "@type": "PostalAddress",
          streetAddress: SITE_CONFIG.address.street,
          addressLocality: SITE_CONFIG.address.city,
          addressRegion: SITE_CONFIG.address.state,
          postalCode: SITE_CONFIG.address.zip,
          addressCountry: "US",
        },
      },
    },
    // subjectOf back-references the listing itself; Google uses this to
    // confirm the schema is THIS page's authoritative listing.
    subjectOf: {
      "@type": "WebPage",
      "@id": vdpUrl,
      url: vdpUrl,
      ...(heroImage ? { primaryImageOfPage: heroImage } : {}),
    },
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
