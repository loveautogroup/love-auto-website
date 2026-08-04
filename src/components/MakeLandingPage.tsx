import Link from "next/link";
import type { MakeLandingContent } from "@/data/makeLandings";
import MakeLandingInventory from "@/components/MakeLandingInventory";
import { BreadcrumbSchema, ItemListSchema } from "@/components/StructuredData";
import { sampleInventory } from "@/data/inventory";
import SiteBreadcrumb from "@/components/SiteBreadcrumb";
import T from "@/components/T";

interface MakeLandingPageProps {
  content: MakeLandingContent;
}

/**
 * Shared renderer for make-specific + body-style landing pages.
 *
 * Each landing (/inventory/used-subaru, /inventory/used-suvs, etc.) is
 * a static folder with a thin page.tsx that imports this component and
 * passes the matching MAKE_LANDINGS entry. This sidesteps Next.js's
 * dynamic-route disambiguation issues when two dynamic segments share
 * the same parent folder.
 */
export default function MakeLandingPage({ content }: MakeLandingPageProps) {
  const filterType = content.filterType ?? "make";
  const filterValue = (content.filterValue ?? content.make).toLowerCase();
  const pluralNoun = content.pluralNoun ?? `${content.make}s`;
  const isBodyStyle = filterType === "bodyStyle";

  // E6: build-time filtered list for structured data — the SAME filter
  // MakeLandingInventory applies client-side, so the ItemList matches
  // the cards baked into the page HTML.
  const schemaVehicles = sampleInventory.filter((v) => {
    if (v.status !== "available") return false;
    if (isBodyStyle) return v.bodyStyle.toLowerCase() === filterValue;
    return v.make.toLowerCase() === filterValue;
  });

  return (
    <>
      {/* E6: listing-hub structured data for this landing page. */}
      <ItemListSchema
        name={`Used ${isBodyStyle ? pluralNoun : content.make} for Sale in Villa Park, IL`}
        vehicles={schemaVehicles}
      />
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.loveautogroup.net/" },
          { name: "Inventory", url: "https://www.loveautogroup.net/inventory/" },
          {
            name: isBodyStyle ? `Used ${pluralNoun}` : `Used ${content.make}`,
            url: `https://www.loveautogroup.net/inventory/used-${content.slug}/`,
          },
        ]}
      />

      {/* Breadcrumb */}
      <SiteBreadcrumb
        includeInventory
        trail={[{ label: isBodyStyle ? `Used ${pluralNoun}` : `Used ${content.make}` }]}
      />

      {/* Hero */}
      <section className="bg-brand-navy text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            {isBodyStyle ? `Used ${pluralNoun}` : `Used ${content.make}`} for Sale in
            <span className="block text-brand-red mt-2">Villa Park, IL</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-brand-gray-300 max-w-3xl">
            {content.hero}
          </p>
        </div>
      </section>

      {/* Live inventory */}
      <MakeLandingInventory
        filterType={filterType}
        filterValue={filterValue}
        pluralNoun={pluralNoun}
        make={content.make}
      />

      {/* Editorial content */}
      <article className="max-w-4xl mx-auto px-4 pb-16">
        <p className="text-lg text-brand-gray-700 leading-relaxed mb-10">{content.intro}</p>

        {content.sections.map((section, i) => (
          <section key={i} className="mb-10">
            <h2 className="text-2xl font-bold text-brand-gray-900 mb-4">{section.heading}</h2>
            {section.body.map((paragraph, j) => (
              <p key={j} className="text-brand-gray-700 leading-relaxed mb-4">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <section className="mb-10 bg-brand-gray-50 rounded-xl p-6 border border-brand-gray-200">
          <h2 className="text-2xl font-bold text-brand-gray-900 mb-4">
            {isBodyStyle ? (
              <>{pluralNoun} <T get={(t) => t.makeLandingChrome.specializeInBodyStyle} /></>
            ) : (
              <>{content.make} <T get={(t) => t.makeLandingChrome.specializeIn} /></>
            )}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {content.models.map((model) => (
              <div key={model.name} className="flex gap-3">
                <span className="font-bold text-brand-red text-lg shrink-0">›</span>
                <div>
                  <p className="font-semibold text-brand-gray-900">{model.name}</p>
                  <p className="text-sm text-brand-gray-600">{model.pitch}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="bg-brand-navy text-white rounded-xl p-8 text-center">
          <h2 className="text-2xl font-bold mb-2"><T get={(t) => t.makeLandingChrome.ctaHeading} /></h2>
          <p className="text-brand-gray-300 mb-6">
            <T
              get={(t) =>
                t.makeLandingChrome.ctaBody.replace(
                  "{thing}",
                  isBodyStyle ? t.makeLandingChrome.vehicleGeneric : content.make
                )
              }
            />
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/inventory"
              className="inline-flex items-center bg-brand-red hover:bg-brand-red-dark text-white px-6 py-3 rounded-xl font-semibold"
            >
              <T get={(t) => t.makeLandingChrome.browseFullInventory} />
            </Link>
            <a
              href="tel:6303593643"
              className="inline-flex items-center border-2 border-white/30 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-semibold"
            >
              <T get={(t) => t.makeLandingChrome.callPhone.replace("{phone}", "(630) 359-3643")} />
            </a>
          </div>
        </section>
      </article>
    </>
  );
}

/**
 * Helper: generate Next.js Metadata from a MakeLandingContent entry.
 * Each static page.tsx calls this instead of duplicating the metadata.
 */
export function makeLandingMetadata(content: MakeLandingContent) {
  const url = `https://www.loveautogroup.net/inventory/used-${content.slug}`;
  return {
    title: content.title,
    description: content.description,
    alternates: { canonical: url },
    openGraph: {
      title: content.title,
      description: content.description,
      url,
      type: "website" as const,
      siteName: "Love Auto Group",
    },
  };
}
