import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants";
import { TrackedPhoneLink } from "@/components/TrackedLink";
import PromoVideo from "@/components/PromoVideo";
import AboutHero from "./AboutHero";

export const metadata: Metadata = {
  title: "About Love Auto Group, Family Owned in Villa Park IL",
  description:
    "Family-owned independent dealer in Villa Park, IL since 2014. Every vehicle carefully selected, no dealer fees, free CARFAX on marked vehicles.",
  alternates: { canonical: "https://www.loveautogroup.net/about/" },
};

export default function AboutPage() {
  return (
    <>
      <AboutHero />

      <section className="max-w-4xl mx-auto px-4 py-16">
        {/* Story */}
        <div className="prose prose-lg max-w-none">
          <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-4">
            Our Story
          </h2>
          <p className="text-brand-gray-700 leading-relaxed mb-6">
            Love Auto Group started with a simple idea: sell quality used
            vehicles at fair prices, and treat every customer the way you&apos;d
            want to be treated. Since 2014, that&apos;s exactly what we&apos;ve
            done from our lot at 735 N Yale Ave in Villa Park.
          </p>
          <p className="text-brand-gray-700 leading-relaxed mb-6">
            We&apos;re not a big corporate dealer group with hundreds of cars and
            faceless sales floors. We&apos;re a small team that knows every
            vehicle on the lot inside and out because we personally source
            each one before it gets a price tag.
          </p>
          <p className="text-brand-gray-700 leading-relaxed mb-6">
            Our focus is on vehicles like Lexus,{" "}
            <Link href="/brands/subaru/" className="text-brand-red hover:underline">
              Subaru
            </Link>
            , Acura, and Mazda. Makes known for reliability and longevity. We
            source carefully selected vehicles that meet our standards.
            Anything that doesn&apos;t pass gets sent back.
          </p>
          <p className="text-brand-gray-700 leading-relaxed mb-6">
            Shopping nearby? Start with our{" "}
            <Link
              href="/used-cars-villa-park-il/"
              className="text-brand-red hover:underline"
            >
              used cars in Villa Park, IL
            </Link>{" "}
            page — current stock, directions, hours, and the questions we
            hear most.
          </p>
        </div>

        {/* What sets us apart — hairline spec blocks, not rounded cards */}
        <div className="mt-14">
          <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-6">
            What Makes Us Different
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 border-t border-l border-ink-200">
            <div className="border-r border-b border-ink-200 p-6">
              <h3 className="font-heading font-bold text-brand-gray-900 mb-2">
                Free CARFAX Reports
              </h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">
                Every vehicle that shows the CARFAX badge comes with a free
                history report: accident history, service records, and
                title status, ready before you ask.
              </p>
            </div>
            <div className="border-r border-b border-ink-200 p-6">
              <h3 className="font-heading font-bold text-brand-gray-900 mb-2">
                Transparent Pricing
              </h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">
                Every price is competitive and clearly listed. We don&apos;t play
                games with hidden fees or bait-and-switch tactics. The price you
                see is the price you pay.
              </p>
            </div>
            <div className="border-r border-b border-ink-200 p-6">
              <h3 className="font-heading font-bold text-brand-gray-900 mb-2">
                Carefully Selected
              </h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">
                We hand-pick every vehicle based on history, condition, and
                reliability. We know what we&apos;re buying before we buy it —
                so you can buy with confidence.
              </p>
            </div>
            <div className="border-r border-b border-ink-200 p-6">
              <h3 className="font-heading font-bold text-brand-gray-900 mb-2">
                Small Team, Big Care
              </h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">
                When you buy from us, you&apos;re working with the owner, not a
                rotating cast of commission-hungry salespeople. Your satisfaction
                is our reputation.
              </p>
            </div>
          </div>
        </div>

        {/* "Our happy customers" video, click-to-play. */}
        <div className="mt-16 text-center">
          <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-6">
            Our happy customers
          </h2>
          <PromoVideo
            src="/videos/happy-customers.mp4"
            posterSrc="/videos/happy-customers-poster.jpg"
            mode="click"
            ariaLabel="Love Auto Group customers sharing their experience"
            analyticsVideo="happy_customers"
            analyticsLocation="about_page"
          />
        </div>

        {/* CTA */}
        <div className="mt-16 bg-brand-red p-8 md:p-12 text-center text-white">
          <h2 className="font-heading font-extrabold text-2xl md:text-3xl mb-4">
            Ready to Find Your Next Vehicle?
          </h2>
          <p className="text-red-100 mb-6 max-w-xl mx-auto">
            Browse our inventory online or stop by the lot. We&apos;re always
            happy to show you around.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3">
            <Link
              href="/inventory"
              className="group inline-flex items-center justify-center gap-2.5 bg-white hover:bg-brand-gray-100 text-brand-red px-7 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em] transition-colors"
            >
              Browse Inventory
              <svg className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <TrackedPhoneLink
              location="about_cta"
              href={`tel:${SITE_CONFIG.phoneRaw}`}
              className="inline-flex items-center justify-center border border-white/35 hover:border-white hover:bg-white/[.06] text-white px-7 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em] transition-colors"
            >
              Call {SITE_CONFIG.phone}
            </TrackedPhoneLink>
          </div>
        </div>
      </section>
    </>
  );
}
