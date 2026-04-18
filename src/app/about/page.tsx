import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Love Auto Group is a family owned used car dealership in Villa Park, IL since 2014. Meet our team and learn why we do things differently.",
};

export default function AboutPage() {
  return (
    <>
      <section className="bg-brand-navy text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">
            About Love Auto Group
          </h1>
          <p className="mt-4 text-lg text-brand-gray-300">
            Family owned in Villa Park, IL since {SITE_CONFIG.established}
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16">
        {/* Story */}
        <div className="prose prose-lg max-w-none">
          <h2 className="text-2xl font-bold text-brand-gray-900 mb-4">
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
            vehicle on the lot inside and out because we personally source,
            inspect, and recondition each one before it gets a price tag.
          </p>
          <p className="text-brand-gray-700 leading-relaxed mb-6">
            Our focus is on Japanese vehicles like Lexus, Subaru, Acura, and
            Mazda. Makes known for reliability and longevity. We source
            carefully selected vehicles that meet our standards.
            Anything that doesn&apos;t pass gets sent back.
          </p>
        </div>

        {/* What sets us apart */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-brand-gray-900 mb-6">
            What Makes Us Different
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl border border-brand-gray-200 p-6">
              <h3 className="font-bold text-brand-gray-900 mb-2">
                Fully Reconditioned
              </h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">
                Every vehicle is thoroughly inspected and reconditioned before
                it goes on the lot. We don&apos;t cut corners. If something
                needs fixing, it gets fixed right.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-brand-gray-200 p-6">
              <h3 className="font-bold text-brand-gray-900 mb-2">
                Transparent Pricing
              </h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">
                Every price is competitive and clearly listed. We don&apos;t play
                games with hidden fees or bait-and-switch tactics. The price you
                see is the price you pay.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-brand-gray-200 p-6">
              <h3 className="font-bold text-brand-gray-900 mb-2">
                Carefully Selected
              </h3>
              <p className="text-brand-gray-600 text-sm leading-relaxed">
                We hand-pick every vehicle based on history, condition, and
                reliability. We know what we&apos;re buying before we buy it —
                so you can buy with confidence.
              </p>
            </div>
            <div className="bg-white rounded-xl border border-brand-gray-200 p-6">
              <h3 className="font-bold text-brand-gray-900 mb-2">
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

        {/* Team */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-brand-gray-900 mb-6">
            Meet the Team
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                name: "Jeremiah",
                role: "Owner / Dealer Principal",
                description:
                  "Runs the show from sourcing to sale. Hands-on, detail-oriented, and genuinely passionate about putting people in the right vehicle.",
              },
              {
                name: "Ivan",
                role: "Reconditioning",
                description:
                  "Keeps every vehicle on the lot in top shape. If it's not right, it doesn't go out.",
              },
              {
                name: "Jimmy",
                role: "Partner",
                description:
                  "Co-pilot from the beginning. Helps keep the operation running smooth and the standards high.",
              },
            ].map((person) => (
              <div
                key={person.name}
                className="bg-white rounded-xl border border-brand-gray-200 overflow-hidden"
              >
                <div className="aspect-square bg-brand-gray-100 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-16 h-16 text-brand-gray-300"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-brand-gray-900">
                    {person.name}
                  </h3>
                  <p className="text-sm text-brand-red font-medium">
                    {person.role}
                  </p>
                  <p className="text-sm text-brand-gray-500 mt-2">
                    {person.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-16 bg-brand-red rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Ready to Find Your Next Vehicle?
          </h2>
          <p className="text-red-100 mb-6 max-w-xl mx-auto">
            Browse our inventory online or stop by the lot. We&apos;re always
            happy to show you around.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/inventory"
              className="inline-flex items-center justify-center bg-white text-brand-red px-8 py-3 rounded-xl font-bold hover:bg-brand-gray-100 transition-colors"
            >
              Browse Inventory
            </Link>
            <a
              href={`tel:${SITE_CONFIG.phoneRaw}`}
              className="inline-flex items-center justify-center border-2 border-white/30 hover:bg-white/10 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              Call {SITE_CONFIG.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
