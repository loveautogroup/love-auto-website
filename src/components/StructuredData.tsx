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
  //     "family owned" + service area baked in.
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
    alternateName: [
      "Love Auto",
      "Love Automotive",
      "Love Auto Group",
      "Love Auto Group Inc.",
      "Love Auto Villa Park",
      "Love Auto Group Villa Park",
    ],
    logo: `${SITE_CONFIG.url}/images/logo-primary-v2.svg`,
    legalName: "Love Auto Group Inc.",
    description:
      "Family-owned independent dealer in Villa Park, IL — 20 miles from Chicago. Since 2014. Specializing in used Subaru, Lexus, Acura, Honda, Toyota, and Mazda. Serving DuPage County and the western Chicago suburbs.",
    slogan: "Family-Owned Independent Dealer in Villa Park, IL — 20 miles from Chicago",
    foundingDate: "2014",
    knowsAbout: [
      "Used Subaru",
      "Used Lexus",
      "Used Acura",
      "Used Honda",
      "Used Toyota",
      "Used Mazda",
      "All-Wheel Drive vehicles",
      "used cars",
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
      // Added 2026-07-27 (Anna gap-zone). The first four now have live
      // /serving/ pages that were missing from the sitemap and unknown to
      // Google. Countryside and La Grange are here because two question-form
      // queries naming Countryside drove ~370 impressions to the Subaru
      // buying guide at zero clicks — the town was in our SERP footprint
      // without ever being an explicit service-area signal.
      { "@type": "City", name: "Westmont, IL" },
      { "@type": "City", name: "Lisle, IL" },
      { "@type": "City", name: "Downers Grove, IL" },
      { "@type": "City", name: "Countryside, IL" },
      { "@type": "City", name: "La Grange, IL" },
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
  // Found in the website audit: missing the trailing slash the site's own
  // trailingSlash: true policy (and every VDP's own canonical tag) uses —
  // a real, byte-verifiable mismatch between this JSON-LD @id/url and the
  // page's <link rel="canonical"> on every single VDP.
  const vdpUrl = `${SITE_CONFIG.url}/inventory/${vehicle.slug}/`;
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
    // Found in the website audit: this defaulted to FWD for ANY
    // unrecognized value, including a blank/missing drivetrain field —
    // a real RWD car with an empty drivetrain field would report FWD to
    // Google. Omit the field (undefined drops from the JSON-LD output)
    // rather than assert a specific, possibly wrong, configuration.
    driveWheelConfiguration:
      vehicle.drivetrain === "AWD"
        ? "AllWheelDriveConfiguration"
        : vehicle.drivetrain === "4WD"
          ? "FourWheelDriveConfiguration"
          : vehicle.drivetrain === "RWD"
            ? "RearWheelDriveConfiguration"
            : vehicle.drivetrain === "FWD"
              ? "FrontWheelDriveConfiguration"
              : undefined,
    vehicleTransmission: vehicle.transmission,
    fuelType: vehicle.fuelType,
    vehicleIdentificationNumber: vehicle.vin,
    // Stock number as sku/mpn. Machine-readable is the point: this is what
    // scrapers, AI assistants and our own lead bots read off the page, and a
    // shopper who writes "do you still have stock 11415?" can only be matched
    // to a car if the number is published somewhere addressable. The VIN alone
    // is not enough -- nobody quotes a VIN in an email.
    sku: vehicle.stockNumber,
    mpn: vehicle.stockNumber,
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
 * Upper bound on emitted ListItems. This is a page-weight backstop against a
 * bad feed (each item is ~130 bytes inlined into the static HTML, and a whole
 * archive pull would be ~1,200 of them), NOT a schema rule — schema.org sets
 * no maximum and Google's carousel spec states only a MINIMUM of two items.
 *
 * It must stay well clear of real inventory, because Google's one hard
 * requirement here is that the list be "complete and contains all the items
 * that are listed on the page". Both callers pass the page's entire unpaginated
 * card set, so any list this truncated would silently disagree with the page it
 * describes — and `numberOfItems` would report the truncated count as if it
 * were the whole lot. The previous bound was 25 — under the 28 active vehicles
 * CLAUDE.md records as measured live on 2026-08-07, so it was already a
 * truncation waiting to happen; it had not bitten only because the build-time
 * list is much smaller than the live lot.
 *
 * Counts re-verified 2026-08-10, because the previous revision of this comment
 * claimed "the build snapshot currently holds 8 available cars" and that was
 * wrong — it conflated two different lists:
 *   - src/data/inventory-snapshot.json — 5 vehicles, all status "available".
 *     This is the list that actually feeds the ItemList on a normal build.
 *   - HANDWRITTEN_FALLBACK in src/data/inventory.ts — 8 entries, also all
 *     status "available". buildSampleInventory() only falls through to it when
 *     the snapshot is missing or empty, so it feeds a rescued build, not a
 *     normal one. The "8" came from here.
 *
 * The ~9x multiplier refers to NEITHER build-time list: 250 / 28 ≈ 8.9x the 28
 * LIVE active vehicles cited above, which is the count this bound has to clear.
 */
const MAX_ITEM_LIST_ENTRIES = 250;

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
  const items = vehicles.slice(0, MAX_ITEM_LIST_ENTRIES);
  // The guard is `=== 0`, NOT `< 2`. A single-item ItemList is knowingly
  // emitted. Checked against Google's docs 2026-08-10 rather than assumed:
  //
  // The two-item rule ("define an ItemList that contains at least two ListItem
  // elements") lives on the CAROUSEL page, where it is an eligibility threshold
  // for a host carousel rich result — and that result requires the ItemList be
  // paired with one of exactly four supported features: Course list, Movie,
  // Recipe, Restaurant. The newer Carousels (beta) feature asks for at least
  // THREE items and covers only LocalBusiness subtypes, Product and Event.
  // Vehicles are in neither list, so this markup cannot earn a carousel rich
  // result by any item count, and that minimum does not bind it. What it does
  // instead is the ungated job of a plain ItemList: telling a crawler the page
  // is a listing hub and handing over every live VDP URL. schema.org sets no
  // minimum for that.
  //
  // Suppressing the one-item case would also break the one requirement that
  // DOES apply — the list must be "complete and contain all the items that are
  // listed on the page". A one-item list on a one-car page satisfies that
  // exactly; emitting nothing on a page that still renders a car does not.
  //
  // Live, not hypothetical: against the committed snapshot,
  // /inventory/used-subaru/ and /inventory/used-sedans/ each match exactly one
  // available vehicle (MakeLandingPage filters to status === "available"), so
  // both ship a one-item ItemList today.
  //
  // If Google ever extends carousel eligibility to vehicle listings, revisit —
  // the cost of being wrong here is losing a rich result we cannot get today,
  // never a penalty.
  // https://developers.google.com/search/docs/appearance/structured-data/carousel
  // https://developers.google.com/search/docs/appearance/structured-data/carousels-beta
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
