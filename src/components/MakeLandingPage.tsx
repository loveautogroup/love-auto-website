import Link from "next/link";
import type { MakeLandingContent } from "@/data/makeLandings";
import MakeLandingInventory from "@/components/MakeLandingInventory";
import { BreadcrumbSchema } from "@/components/StructuredData";

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

  return (
    <>
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
      <nav className="max-w-7xl mx-auto px-4 py-4 text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-brand-gray-500">
          <li><Link href="/" className="hover:text-brand-red">Home</Link></li>
          <li>/</li>
          <li><Link href="/inventory" className="hover:text-brand-red">Inventory</Link></li>
          <li>/</li>
          <li className="text-brand-gray-900 font-medium">
            {isBodyStyle ? `Used ${pluralNoun}` : `Used ${content.make}`}
          </li>
        </ol>
      </nav>

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
            {isBodyStyle ? `${pluralNoun} We Specialize In` : `${content.make} Models We Specialize In`}
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
          <h2 className="text-2xl font-bold mb-2">See What's on the Lot Today</h2>
          <p className="text-brand-gray-300 mb-6">
            Inventory rotates weekly. Stop by our Villa Park location or call us to ask about a specific {isBodyStyle ? "vehicle" : content.make} you're hunting for.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/inventory"
              className="inline-flex items-center bg-brand-red hover:bg-brand-red-dark text-white px-6 py-3 rounded-xl font-semibold"
            >
              Browse Full Inventory
            </Link>
            <a
              href="tel:6303593643"
              className="inline-flex items-center border-2 border-white/30 hover:bg-white/10 text-white px-6 py-3 rounded-xl font-semibold"
            >
              Call (630) 359-3643
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
