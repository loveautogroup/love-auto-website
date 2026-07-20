import { SITE_CONFIG } from "@/lib/constants";
import { Vehicle } from "@/lib/types";

/**
 * M2 — Safely serialize a JSON-LD schema for use in dangerouslySetInnerHTML.
 * Escapes characters that could break the <script> tag or enable XSS:
 *   < > and the Unicode line/paragraph separators U+2028/U+2029.
 */
function safeJsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
}

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
    // Branded-search fix (Anna gap-zone brief 2026-06-29 / DMS task #10):
    // cover the query variants searchers actually type for us.
    alternateName: ["Love Auto", "Love Automotive", "Love Auto Group"],
    logo: `${SITE_CONFIG.url}/images/logo-primary.svg`,
    legalName: "Love Auto Group Inc.",
    description:
      "Japanese makes specialist in Villa Park, IL — 20 miles from Chicago. Family owned since 2014. Specializing in used Subaru, Lexus, Acura, Honda, Toyota, and Mazda. Serving DuPage County and the western Chicago suburbs.",
    slogan: "Japanese Makes Specialist in Villa Park, IL — 20 miles from Chicago",
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
    // aggregateRating intentionally ABSENT (removed 2026-07-20, SEO plan
    // Phase 1 / DMS #6). Google's review-snippet policy: "If the entity
    // that's being reviewed controls the reviews about itself, their pages
    // that use LocalBusiness or any other type of Organization structured
    // data are ineligible for star review feature." Marking up our own
    // Google rating here is self-serving markup and a manual-action risk.
    // The 4.7/128 rating surfaces through the Business Profile instead.
    // https://developers.google.com/search/docs/appearance/structured-data/review-snippet
    sameAs: [
      SITE_CONFIG.social.facebook,
      SITE_CONFIG.social.google,
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
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
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
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
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
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
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}

/**
 * E6 — ItemList of vehicle listing pages. Emitted on /inventory and the
 * make/body-style landing pages so Google understands them as listing
 * hubs and can crawl straight to every live VDP. Baked at build time
 * from the same snapshot the page's cards render from.
 */
export function ItemListSchema({
  name,
  vehicles,
}: {
  name: string;
  vehicles: Vehicle[];
}) {
  const items = vehicles.slice(0, 25);
  if (items.length === 0) return null;
  const schema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((v, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${v.year} ${v.make} ${v.model}${v.trim ? ` ${v.trim}` : ""}`,
      url: `${SITE_CONFIG.url}/inventory/${v.slug}/`,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLd(schema) }}
    />
  );
}
