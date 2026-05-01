import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BRANDS } from "@/data/brands";
import MakeLandingInventory from "@/components/MakeLandingInventory";
import { BreadcrumbSchema, FAQSchema } from "@/components/StructuredData";

/**
 * Brand landing pages — /brands/{slug}/
 *
 * Targets brand-only keyword clusters ("used Honda Villa Park",
 * "used Lexus DuPage County"). Restored 2026-04-30 after live recheck
 * (task #48) found `/brands/honda`, `/brands/subaru`, `/brands/toyota`
 * returning 404 against the audit's URL plan. Editorial copy comes from
 * Mark's drafts in `seo-quickwins/brand-pages/` (task #19).
 *
 * Note: a parallel landing system already lives at /inventory/used-{slug}/
 * powered by `data/makeLandings.ts`. These /brands/ pages are intentionally
 * a separate URL pattern with shorter, voice-tuned copy from Mark's
 * 5-brand rewrite. They share the live inventory grid via
 * `MakeLandingInventory`, so brand filter behavior stays consistent.
 */

const BASE = "https://www.loveautogroup.net";

export async function generateStaticParams() {
  return BRANDS.map((b) => ({ brand: b.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  const { brand } = await params;
  const content = BRANDS.find((b) => b.slug === brand);
  if (!content) return {};
  const url = `${BASE}/brands/${content.slug}/`;
  return {
    title: content.metaTitle,
    description: content.metaDescription,
    alternates: { canonical: url },
    openGraph: {
      title: content.metaTitle,
      description: content.metaDescription,
      url,
      type: "website",
      siteName: "Love Auto Group",
    },
  };
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  const { brand } = await params;
  const content = BRANDS.find((b) => b.slug === brand);
  if (!content) notFound();

  const pageUrl = `${BASE}/brands/${content.slug}/`;

  // CollectionPage JSON-LD — these are commercial listing pages, not articles.
  const collectionSchema = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": pageUrl,
    url: pageUrl,
    name: content.metaTitle,
    description: content.metaDescription,
    inLanguage: "en-US",
    isPartOf: {
      "@type": "WebSite",
      "@id": `${BASE}/#website`,
      name: "Love Auto Group",
      url: `${BASE}/`,
    },
    about: {
      "@type": "Brand",
      name: content.displayName,
    },
  };

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${BASE}/` },
          { name: "Brands", url: `${BASE}/brands/` },
          {
            name: `Used ${content.displayName}`,
            url: pageUrl,
          },
        ]}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionSchema) }}
      />
      {content.faqs && content.faqs.length > 0 ? (
        <FAQSchema
          items={content.faqs.map((f) => ({
            question: f.question,
            answer: f.answer,
          }))}
        />
      ) : null}

      {/* Breadcrumb */}
      <nav
        className="max-w-7xl mx-auto px-4 py-4 text-sm"
        aria-label="Breadcrumb"
      >
        <ol className="flex items-center gap-2 text-brand-gray-500">
          <li>
            <Link href="/" className="hover:text-brand-red">
              Home
            </Link>
          </li>
          <li>/</li>
          <li>
            <Link href="/inventory" className="hover:text-brand-red">
              Inventory
            </Link>
          </li>
          <li>/</li>
          <li className="text-brand-gray-900 font-medium">
            Used {content.displayName}
          </li>
        </ol>
      </nav>

      {/* Hero */}
      <section className="bg-brand-navy text-white py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">
            Used {content.displayName} for Sale in
            <span className="block text-brand-red mt-2">Villa Park, IL</span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-brand-gray-300 max-w-3xl">
            {content.hero}
          </p>
        </div>
      </section>

      {/* Editorial content */}
      <article className="max-w-4xl mx-auto px-4 py-12">
        {content.body.map((paragraph, i) => (
          <p
            key={i}
            className="text-lg text-brand-gray-700 leading-relaxed mb-6"
          >
            {paragraph}
          </p>
        ))}

        {content.relatedLinks && content.relatedLinks.length > 0 ? (
          <p className="text-base text-brand-gray-600 mt-8">
            Browse the live inventory below, or{" "}
            {content.relatedLinks.map((link, i) => (
              <span key={link.href}>
                <Link
                  href={link.href}
                  className="text-brand-red hover:underline font-medium"
                >
                  {link.label}
                </Link>
                {i < content.relatedLinks!.length - 1 ? " or " : "."}
              </span>
            ))}
          </p>
        ) : null}
      </article>

      {/* FAQ section, when authored */}
      {content.faqs && content.faqs.length > 0 ? (
        <section className="max-w-4xl mx-auto px-4 pb-8">
          <h2 className="text-2xl font-bold text-brand-gray-900 mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            {content.faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="text-lg font-semibold text-brand-gray-900 mb-2">
                  {faq.question}
                </h3>
                <p className="text-brand-gray-700 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {/* Live inventory filtered by make. Empty-state in the component
          falls back to a "view all inventory" CTA, so we always have a
          path forward when there are zero matches in stock. */}
      <MakeLandingInventory
        filterType="make"
        filterValue={content.displayName.toLowerCase()}
        pluralNoun={`${content.displayName}s`}
        make={content.displayName}
      />

      {/* Final CTA */}
      <section className="bg-brand-gray-50 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-brand-gray-900 mb-2">
            Looking for a specific {content.displayName} model?
          </h2>
          <p className="text-brand-gray-600 mb-6">
            Call (630) 359-3643 and we will let you know when one lands.
            735 N Yale Ave, Villa Park, IL 60181.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <a
              href="tel:6303593643"
              className="inline-flex items-center bg-brand-red hover:bg-brand-red-dark text-white px-6 py-3 rounded-xl font-semibold"
            >
              Call (630) 359-3643
            </a>
            <Link
              href="/inventory"
              className="inline-flex items-center border-2 border-brand-gray-300 hover:bg-brand-gray-100 text-brand-gray-900 px-6 py-3 rounded-xl font-semibold"
            >
              View Full Inventory
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
