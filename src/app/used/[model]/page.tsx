import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MODEL_LANDINGS } from "@/data/modelLandings";
import { BRANDS } from "@/data/brands";
import { fetchDmsInventory } from "@/lib/dmsInventory";
import { TrackedPhoneLink } from "@/components/TrackedLink";
import { BreadcrumbSchema, FAQSchema } from "@/components/StructuredData";
import SiteBreadcrumb from "@/components/SiteBreadcrumb";

/**
 * Model landing pages, /used/{make}-{model}/. Content and the sales numbers
 * behind it live in src/data/modelLandings.ts (read the header there for
 * where each figure comes from). Cars in stock are resolved at build and
 * rendered as plain links so a crawler sees them without running JS.
 */

const BASE = "https://www.loveautogroup.net";

export async function generateStaticParams() {
  return MODEL_LANDINGS.map((m) => ({ model: m.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ model: string }>;
}): Promise<Metadata> {
  const { model } = await params;
  const m = MODEL_LANDINGS.find((x) => x.slug === model);
  if (!m) return {};
  const url = `${BASE}/used/${m.slug}/`;
  return {
    title: m.title,
    description: m.description,
    alternates: { canonical: url },
    openGraph: {
      title: m.title,
      description: m.description,
      url,
      type: "website",
      siteName: "Love Auto Group",
    },
  };
}

const money = (n: number) => `$${Math.round(n).toLocaleString("en-US")}`;

export default async function ModelPage({
  params,
}: {
  params: Promise<{ model: string }>;
}) {
  const { model } = await params;
  const m = MODEL_LANDINGS.find((x) => x.slug === model);
  if (!m) notFound();

  const pageUrl = `${BASE}/used/${m.slug}/`;
  const brand = BRANDS.find((b) => b.slug === m.brandSlug);
  const brandUrl = `${BASE}/brands/${m.brandSlug}/`;

  const inventory = await fetchDmsInventory();
  const onLot = inventory
    .filter(
      (v) =>
        v.status === "available" &&
        typeof v.make === "string" &&
        v.make.toLowerCase() === m.make.toLowerCase() &&
        typeof v.model === "string" &&
        m.modelMatch.test(v.model.trim()) &&
        Number.isFinite(v.price) &&
        v.price > 0 &&
        typeof v.slug === "string" &&
        v.slug.length > 0
    )
    .sort((a, b) => a.price - b.price);

  const name = `${m.make} ${m.model}`;

  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: `${BASE}/` },
          { name: `Used ${m.make}`, url: brandUrl },
          { name: `Used ${name}`, url: pageUrl },
        ]}
      />
      <FAQSchema items={m.faqs} />

      <SiteBreadcrumb
        trail={[
          { label: `Used ${m.make}`, href: `/brands/${m.brandSlug}/` },
          { label: `Used ${name}` },
        ]}
      />

      <section className="bg-brand-navy text-white py-12 md:py-16 border-b border-white/[.14]">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="font-heading font-extrabold leading-[0.98] text-[clamp(1.9rem,5vw,3.5rem)]">
            Used {name}
            <span className="block text-brand-red mt-2">
              near Villa Park, IL
            </span>
          </h1>
          <p className="mt-4 text-lg md:text-xl text-ink-300 max-w-3xl">
            Love Auto Group is an independent used car dealer at 735 N Yale
            Ave, Unit A in Villa Park, IL, in business since 2014. Our sales
            records for this lot go back to 2018, and in that time we have
            sold {m.stats.soldSince2018} used {name}s. The ones we have sold
            since 2024 were mostly {m.stats.typicalYears} models with{" "}
            {m.stats.typicalMiles}. We charge no dealer fees, and cars that
            show the CARFAX badge come with a free CARFAX report. Call
            630-359-3643 or text 312-925-7520.
          </p>
          <div className="mt-6 flex flex-wrap gap-4">
            <Link
              href="/book-a-visit/"
              className="inline-flex items-center bg-brand-red hover:bg-brand-red-dark text-white px-6 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em]"
            >
              Book a visit
            </Link>
            <TrackedPhoneLink
              location="model_landing_hero"
              href="tel:+16303593643"
              className="inline-flex items-center border border-white text-white hover:bg-white hover:text-brand-navy px-6 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em]"
            >
              Call (630) 359-3643
            </TrackedPhoneLink>
          </div>
        </div>
      </section>

      <section
        className="max-w-4xl mx-auto px-4 py-12"
        aria-labelledby="stock-heading"
      >
        <h2
          id="stock-heading"
          className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-4"
        >
          {name} for sale right now
        </h2>
        {onLot.length > 0 ? (
          <>
            <p className="text-brand-gray-700 mb-4">
              We have {onLot.length} {name}
              {onLot.length === 1 ? "" : "s"} in stock today. You pay the price
              shown plus tax, title, and license.
            </p>
            <ul className="space-y-2">
              {onLot.map((v) => (
                <li key={v.slug}>
                  <Link
                    href={`/inventory/${v.slug}/`}
                    className="text-brand-red hover:underline font-semibold"
                  >
                    {v.year} {v.make} {v.model}
                    {v.trim ? ` ${v.trim}` : ""}
                  </Link>
                  <span className="text-brand-gray-600">
                    {" "}
                    · {money(v.price)} · {v.mileage.toLocaleString("en-US")}{" "}
                    miles
                  </span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-brand-gray-700">
            We do not have a {name} in stock right now.{" "}
            <Link
              href="/waitlist/"
              className="text-brand-red hover:underline font-semibold"
            >
              Join the waitlist
            </Link>{" "}
            and we will contact you when one comes in. You can also{" "}
            <Link
              href={`/brands/${m.brandSlug}/`}
              className="text-brand-red hover:underline font-semibold"
            >
              see every used {m.make} we have
            </Link>
            .
          </p>
        )}
      </section>

      <article className="max-w-4xl mx-auto px-4 pb-12">
        <section className="mb-10">
          <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-4">
            Questions about a used {name}
          </h2>
          <div className="space-y-6">
            {m.faqs.map((f) => (
              <div key={f.question} className="border-b border-ink-200 pb-6">
                <h3 className="font-heading font-bold text-brand-gray-900 mb-2">
                  {f.question}
                </h3>
                <p className="text-brand-gray-700 leading-relaxed">
                  {f.answer}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-4">
            More from Love Auto Group
          </h2>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 font-semibold">
            {MODEL_LANDINGS.filter((x) => x.slug !== m.slug).map((x) => (
              <li key={x.slug}>
                <Link
                  href={`/used/${x.slug}/`}
                  className="text-brand-red hover:text-brand-red-dark"
                >
                  Used {x.make} {x.model} →
                </Link>
              </li>
            ))}
            {brand ? (
              <li>
                <Link
                  href={`/brands/${brand.slug}/`}
                  className="text-brand-red hover:text-brand-red-dark"
                >
                  All used {brand.displayName} →
                </Link>
              </li>
            ) : null}
            <li>
              <Link
                href="/inventory/"
                className="text-brand-red hover:text-brand-red-dark"
              >
                Full inventory →
              </Link>
            </li>
            <li>
              <Link
                href="/used-cars-villa-park-il/"
                className="text-brand-red hover:text-brand-red-dark"
              >
                Used cars in Villa Park →
              </Link>
            </li>
          </ul>
        </section>

        <div className="bg-brand-navy p-8 text-center text-white">
          <h2 className="font-heading font-extrabold text-2xl mb-2">
            Want to see a {name}?
          </h2>
          <p className="text-ink-300 mb-6">
            Stop in at 735 N Yale Ave, Unit A, or call 630-359-3643 or text
            312-925-7520. Tue to Sat 2 to 6 PM, and other times by
            appointment.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/book-a-visit/"
              className="bg-brand-red hover:bg-brand-red-dark text-white px-7 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em]"
            >
              Book a visit
            </Link>
            <Link
              href="/waitlist/"
              className="border border-white text-white hover:bg-white hover:text-brand-navy px-7 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em]"
            >
              Join the waitlist
            </Link>
          </div>
        </div>
      </article>
    </>
  );
}
