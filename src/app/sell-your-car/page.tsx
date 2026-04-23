import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import TradeInForm from "./TradeInForm";

export const metadata: Metadata = {
  title: "Sell or Trade Your Car in Villa Park | Love Auto Group",
  description:
    "We buy cars too. Get a fair market offer on your vehicle from Love Auto Group in Villa Park, IL. Trade in or cash out, the process takes minutes.",
  alternates: { canonical: "https://www.loveautogroup.net/sell-your-car" },
};

export default function SellYourCarPage() {
  return (
    <>
      <section className="bg-brand-navy text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">
            Sell Your Car to Us
          </h1>
          <p className="mt-4 text-lg text-brand-gray-300">
            Fair offers, no hassle. Tell us about your vehicle and we&apos;ll
            get back to you with an offer.
          </p>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12">
          <TradeInForm />

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-brand-gray-200 p-6">
              <h2 className="font-bold text-brand-gray-900 mb-3">
                Why Sell to Us?
              </h2>
              <ul className="space-y-3">
                {[
                  "Fair market-based offers",
                  "No obligation. Get a quote and decide.",
                  "Fast process, most offers within 24 hours",
                  "We handle all the paperwork",
                  "We buy all makes and models",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-brand-gray-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-brand-green shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-brand-gray-200 p-6">
              <h3 className="font-bold text-brand-gray-900 mb-2">
                Prefer to Call?
              </h3>
              <p className="text-sm text-brand-gray-600 mb-3">
                We&apos;re happy to discuss your vehicle over the phone.
              </p>
              <a
                href={`tel:${SITE_CONFIG.phoneRaw}`}
                className="inline-flex items-center gap-2 text-brand-red hover:text-brand-red-dark font-semibold"
              >
                {SITE_CONFIG.phone}
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
