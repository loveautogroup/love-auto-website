import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import FinancingForm from "./FinancingForm";
import PaymentCalculator from "./PaymentCalculator";

export const metadata: Metadata = {
  title: "Used Car Financing, All Credit Welcome | Love Auto",
  description:
    "All credit welcome. Multiple lenders, competitive rates, and fast pre-approval with no impact on your credit score. Apply online with Love Auto Group.",
  alternates: { canonical: "https://www.loveautogroup.net/financing" },
};

export default function FinancingPage() {
  return (
    <>
      {/* Hero with dual-CTA split */}
      <section className="bg-brand-navy text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-brand-red uppercase tracking-wider text-sm font-bold mb-3">
            Financing
          </p>
          <h1 className="text-4xl md:text-5xl font-bold">
            Financing for All Credit Levels
          </h1>
          <p className="mt-4 text-lg text-brand-gray-300 max-w-2xl mx-auto">
            First-time buyer? Rebuilding credit? No problem. Love Auto Group
            works with multiple lenders to find you the best rate.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#apply"
              className="inline-flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors"
            >
              <span aria-hidden>📋</span> Full Credit Application
            </a>
            <a
              href="#apply"
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 hover:bg-white/20 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors"
            >
              <span aria-hidden>⚡</span> Quick Pre-Qualify
            </a>
          </div>
          <p className="mt-3 text-sm text-brand-gray-400">
            Soft inquiry — no impact to your credit score to apply.
          </p>
        </div>
      </section>

      {/* Payment calculator */}
      <section className="max-w-5xl mx-auto px-4 -mt-8 relative z-10">
        <PaymentCalculator />
      </section>

      <section
        id="apply"
        className="max-w-7xl mx-auto px-4 py-16 scroll-mt-20"
      >
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12">
          <div>
            <FinancingForm />
          </div>

          {/* Sidebar info */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-brand-gray-200 p-6">
              <h2 className="font-bold text-brand-gray-900 mb-4">
                How It Works
              </h2>
              <ol className="space-y-4">
                {[
                  {
                    step: "1",
                    title: "Submit Your Info",
                    desc: "Fill out the quick form. It takes less than 2 minutes.",
                  },
                  {
                    step: "2",
                    title: "We Find Options",
                    desc: "We work with multiple lenders to find competitive rates for your situation.",
                  },
                  {
                    step: "3",
                    title: "Pick Your Vehicle",
                    desc: "Browse our inventory knowing your budget and get behind the wheel faster.",
                  },
                ].map((item) => (
                  <li key={item.step} className="flex gap-3">
                    <span className="w-8 h-8 bg-brand-red text-white rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                      {item.step}
                    </span>
                    <div>
                      <p className="font-semibold text-brand-gray-900">
                        {item.title}
                      </p>
                      <p className="text-sm text-brand-gray-500">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="bg-brand-red/5 border border-brand-red/20 rounded-xl p-6">
              <h3 className="font-bold text-brand-gray-900 mb-2">
                Your Information Is Safe
              </h3>
              <p className="text-sm text-brand-gray-600 leading-relaxed">
                This is a pre-qualification form, not a full credit application.
                Your information is kept confidential and used only to explore
                financing options for you.
              </p>
            </div>

            <div className="bg-white rounded-xl border border-brand-gray-200 p-6">
              <h3 className="font-bold text-brand-gray-900 mb-2">
                Questions?
              </h3>
              <p className="text-sm text-brand-gray-600 mb-3">
                Prefer to talk to a person? We&apos;re happy to walk you through
                the process.
              </p>
              <a
                href={`tel:${SITE_CONFIG.phoneRaw}`}
                className="inline-flex items-center gap-2 text-brand-red hover:text-brand-red-dark font-semibold"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                  />
                </svg>
                {SITE_CONFIG.phone}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
