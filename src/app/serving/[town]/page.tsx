import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SERVICE_AREAS } from "@/data/serviceAreas";
import LivePreviewGrid from "@/components/LivePreviewGrid";
import { BreadcrumbSchema } from "@/components/StructuredData";

/**
 * Service area landing pages — /serving/{town-state}
 *
 * Targets queries like "used cars near Lombard IL", "used car dealer
 * Elmhurst". Per audit, every adjacent suburb has shoppers searching by
 * their own town name and there's almost no competition for those queries.
 */

export async function generateStaticParams() {
  return SERVICE_AREAS.map((entry) => ({ town: entry.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ town: string }>;
}): Promise<Metadata> {
  const { town } = await params;
  const content = SERVICE_AREAS.find((s) => s.slug === town);
  if (!content) return {};
  const url = `https://www.loveautogroup.net/serving/${content.slug}`;
  return {
    title: content.title,
    description: content.description,
    alternates: { canonical: url },
    openGraph: {
      title: content.title,
      description: content.description,
      url,
      type: "website",
      siteName: "Love Auto Group",
    },
  };
}

export default async function ServiceAreaPage({
  params,
}: {
  params: Promise<{ town: string }>;
}) {
  const { town } = await params;
  const content = SERVICE_AREAS.find((s) => s.slug === town);
  if (!content) notFound();

  // Inventory grid is live (DMS-driven via useInventory)

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.loveautogroup.net/" },
          {
            name: `Serving ${content.town}, IL`,
            url: `https://www.loveautogroup.net/serving/${content.slug}/`,
          },
        ]}
      />

      {/* Breadcrumb */}
      <nav className="max-w-7xl mx-auto px-4 py-4 text-sm" aria-label="Breadcrumb">
        <ol className="flex items-center gap-2 text-brand-gray-500">
          <li><Link href="/" className="hover:text-brand-red">Home</Link></li>
          <li>/</li>
          <li className="text-brand-gray-900 font-medium">Serving {content.town}, IL</li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="bg-brand-navy text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Used Car Dealer Near
            <span className="block text-brand-red mt-2">{content.town}, IL</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-brand-gray-300 max-w-3xl">
            {content.proximity}
          </p>
        </div>
      </section>

      {/* Editorial content */}
      <article className="max-w-4xl mx-auto px-4 py-12">
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
      </article>

      {/* Inventory preview */}
      <section className="max-w-7xl mx-auto px-4 pb-12" aria-labelledby="inv-preview-heading">
        <div className="text-center mb-8">
          <h2 id="inv-preview-heading" className="text-2xl md:text-3xl font-bold text-brand-gray-900">
            Vehicles On the Lot Today
          </h2>
          <p className="mt-2 text-brand-gray-500">
            Hand-picked inventory, inspected and ready for {content.town} drivers.
          </p>
        </div>

        <LivePreviewGrid />

        <div className="text-center mt-10">
          <Link
            href="/inventory"
            className="inline-flex items-center bg-brand-red hover:bg-brand-red-dark text-white px-8 py-3 rounded-xl font-semibold"
          >
            View Full Inventory
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-brand-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-brand-gray-900 mb-2">
            Stop By From {content.town}
          </h2>
          <p className="text-brand-gray-600 mb-6">
            735 N Yale Ave, Villa Park, IL 60181 — {content.proximity.toLowerCase()}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="tel:6303593643"
              className="inline-flex items-center bg-brand-red hover:bg-brand-red-dark text-white px-6 py-3 rounded-xl font-semibold"
            >
              Call (630) 359-3643
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center border-2 border-brand-gray-300 hover:bg-brand-gray-100 text-brand-gray-900 px-6 py-3 rounded-xl font-semibold"
            >
              Get Directions
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
