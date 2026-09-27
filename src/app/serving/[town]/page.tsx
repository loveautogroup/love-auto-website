import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SERVICE_AREAS } from "@/data/serviceAreas";
import LivePreviewGrid from "@/components/LivePreviewGrid";
import { TrackedPhoneLink } from "@/components/TrackedLink";
import SiteBreadcrumb from "@/components/SiteBreadcrumb";
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
  // Found in the website audit: missing the trailing slash the site's own
  // trailingSlash: true policy requires — 9 of the 10 town pages declared
  // a canonical that itself 308-redirected to reach the URL it claimed
  // was canonical.
  const url = `https://www.loveautogroup.net/serving/${content.slug}/`;
  // villa-park-il duplicates the dedicated /used-cars-villa-park-il/ hub
  // (identical title/topic, both were self-canonical, splitting the geo
  // signal for our #2 gap-zone keyword). Consolidate onto the hub page.
  const canonical =
    content.slug === "villa-park-il"
      ? "https://www.loveautogroup.net/used-cars-villa-park-il/"
      : url;
  return {
    title: content.title,
    description: content.description,
    alternates: { canonical },
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
      <SiteBreadcrumb trail={[{ label: `Serving ${content.town}, IL` }]} />

      {/* Hero */}
      <section className="bg-brand-navy text-white py-12 md:py-16 border-b border-white/[.14]">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="font-heading font-extrabold leading-[0.98] text-[clamp(1.9rem,5vw,3.5rem)]">
            Used Car Dealer Near
            <span className="block text-brand-red mt-2">{content.town}, IL</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-ink-300 max-w-3xl">
            {content.proximity}
          </p>
        </div>
      </section>

      {/* Editorial content */}
      <article className="max-w-4xl mx-auto px-4 py-12">
        <p className="text-lg text-brand-gray-700 leading-relaxed mb-10">{content.intro}</p>

        {content.sections.map((section, i) => (
          <section key={i} className="mb-10">
            <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-4">{section.heading}</h2>
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
          <h2 id="inv-preview-heading" className="font-heading font-extrabold text-2xl md:text-3xl text-brand-gray-900">
            Vehicles On the Lot Today
          </h2>
          <p className="mt-2 text-brand-gray-500">
            Hand-picked inventory, ready for {content.town} drivers.
          </p>
        </div>

        <LivePreviewGrid />

        <div className="text-center mt-10">
          <Link
            href="/inventory"
            className="group inline-flex items-center gap-2.5 bg-brand-red hover:bg-brand-red-dark text-white px-7 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em] transition-colors"
          >
            View Full Inventory
            <svg className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-ink-100 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-2">
            Stop By From {content.town}
          </h2>
          <p className="text-brand-gray-600 mb-6">
            735 N Yale Ave, Unit A, Villa Park, IL 60181 — {content.proximity.toLowerCase()}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <TrackedPhoneLink
              location="serving_town_cta"
              href="tel:6303593643"
              className="inline-flex items-center bg-brand-red hover:bg-brand-red-dark text-white px-6 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em]"
            >
              Call (630) 359-3643
            </TrackedPhoneLink>
            <Link
              href="/contact"
              className="inline-flex items-center border border-brand-gray-300 hover:border-brand-gray-900 text-brand-gray-900 px-6 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em]"
            >
              Get Directions
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
