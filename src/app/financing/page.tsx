import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";

// ============================================================================
// Financing Page — Options, Pre-Approval Form, and Trust Signals
// ============================================================================

export const metadata: Metadata = {
  title: "Used Car Financing Villa Park IL | Bank & Credit Union Loans | Love Auto Group",
  description:
    "Easy used car financing in Villa Park, IL. We work with banks and credit unions to get you competitive rates. Get pre-approved online at Love Auto Group.",
  openGraph: {
    title: "Easy Used Car Financing | Love Auto Group Villa Park IL",
    description:
      "Bank and credit union financing for quality used cars. Get pre-approved today at Love Auto Group in Villa Park, IL.",
    type: "website",
  },
};

const financingJsonLd = {
  "@context": "https://schema.org",
  "@type": "FinancialProduct",
  name: "Used Car Financing at Love Auto Group",
  description:
    "Flexible used car financing through trusted banks and credit unions in Villa Park, IL. Competitive rates and terms for all credit levels.",
  provider: {
    "@type": "AutoDealer",
    name: "Love Auto Group",
    address: {
      "@type": "PostalAddress",
      streetAddress: "735 N Yale Ave",
      addressLocality: "Villa Park",
      addressRegion: "IL",
      postalCode: "60181",
      addressCountry: "US",
    },
    telephone: "(630) 359-3643",
  },
};

export default function FinancingPage() {
  return (
    <>
      <StructuredData data={financingJsonLd} />

      {/* Hero */}
      <section className="bg-[#1B4F72] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Easy Used Car Financing in Villa Park, IL
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            We partner with trusted banks and credit unions to find you the best rate and terms. Let us do the work for you.
          </p>
        </div>
      </section>

      {/* Financing Options */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4F72] mb-8 text-center">
            Our Financing Options
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border-2 border-[#1B4F72] rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-[#1B4F72]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#1B4F72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-[#1B4F72] mb-3">
                Bank Financing
              </h3>
              <p className="text-gray-600 mb-4">
                We partner with trusted local and national banks to get you competitive rates and flexible terms on your auto loan.
              </p>
              <ul className="text-sm text-gray-600 space-y-1 text-left">
                <li className="flex items-start gap-2">
                  <span className="text-[#1B4F72] font-bold mt-0.5">&#10003;</span>
                  Competitive interest rates
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1B4F72] font-bold mt-0.5">&#10003;</span>
                  Flexible term lengths
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1B4F72] font-bold mt-0.5">&#10003;</span>
                  Build your credit history
                </li>
              </ul>
            </div>

            <div className="border-2 border-[#1B4F72] rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-[#1B4F72]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#1B4F72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-[#1B4F72] mb-3">
                Competitive Rates
              </h3>
              <p className="text-gray-600 mb-4">
                Because we work with multiple lenders, we can shop your application to find the most competitive rate available for your credit profile.
              </p>
              <ul className="text-sm text-gray-600 space-y-1 text-left">
                <li className="flex items-start gap-2">
                  <span className="text-[#1B4F72] font-bold mt-0.5">&#10003;</span>
                  Multiple lenders compete for your loan
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1B4F72] font-bold mt-0.5">&#10003;</span>
                  Flexible term lengths
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1B4F72] font-bold mt-0.5">&#10003;</span>
                  Transparent rates — no hidden fees
                </li>
              </ul>
            </div>

            <div className="border-2 border-[#1B4F72] rounded-xl p-6 text-center">
              <div className="w-16 h-16 bg-[#1B4F72]/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#1B4F72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="font-bold text-xl text-[#1B4F72] mb-3">
                Credit Union Loans
              </h3>
              <p className="text-gray-600 mb-4">
                Credit unions often offer lower rates than traditional banks. We work with several credit unions to help you save on your monthly payment.
              </p>
              <ul className="text-sm text-gray-600 space-y-1 text-left">
                <li className="flex items-start gap-2">
                  <span className="text-[#1B4F72] font-bold mt-0.5">&#10003;</span>
                  Often lower APR than banks
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1B4F72] font-bold mt-0.5">&#10003;</span>
                  Member-friendly terms
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#1B4F72] font-bold mt-0.5">&#10003;</span>
                  Fast, easy approval process
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Financing Content */}
      <section className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-[#1B4F72] mb-6">
            How Our Financing Works
          </h2>
          <div className="space-y-4 text-gray-700 leading-relaxed text-lg">
            <p>
              At Love Auto Group, we make financing simple. We work with a network of trusted banks and credit unions to find you the best rate and terms available — so you can focus on finding the right vehicle, not stressing about the paperwork.
            </p>
            <p>
              Here is how it works: fill out our quick pre-approval form or visit us in person. We submit your application to multiple lenders simultaneously, so you get competitive offers without having to shop around yourself. Our finance team will walk you through every option and help you choose the one that fits your budget.
            </p>
            <p>
              Whether you have excellent credit, are a first-time buyer, or are working on rebuilding, our lender relationships give us the flexibility to find solutions for a wide range of situations. We are here to help you get on the road in a quality vehicle with a payment you are comfortable with.
            </p>
          </div>
        </div>
      </section>

      {/* Pre-Approval Form */}
      <section className="py-12 px-4 sm:px-6 lg:px-8" id="pre-approval">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4F72] mb-2 text-center">
            Get Pre-Approved Online
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Fill out the form below and our team will contact you within one business day with your financing options.
          </p>

          <form className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-sm space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="finance-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="finance-name"
                  name="name"
                  required
                  autoComplete="name"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4F72] focus:border-transparent"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label
                  htmlFor="finance-phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  id="finance-phone"
                  name="phone"
                  required
                  autoComplete="tel"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4F72] focus:border-transparent"
                  placeholder="(630) 000-0000"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="finance-email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="finance-email"
                name="email"
                required
                autoComplete="email"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4F72] focus:border-transparent"
                placeholder="john@example.com"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label
                  htmlFor="finance-credit"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Credit Range
                </label>
                <select
                  id="finance-credit"
                  name="credit_range"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4F72] focus:border-transparent"
                >
                  <option value="">Select your credit range</option>
                  <option value="excellent">Excellent (720+)</option>
                  <option value="good">Good (660 - 719)</option>
                  <option value="fair">Fair (600 - 659)</option>
                  <option value="poor">Poor (below 600)</option>
                  <option value="no-credit">No Credit History</option>
                  <option value="not-sure">Not Sure</option>
                </select>
              </div>
              <div>
                <label
                  htmlFor="finance-budget"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Monthly Budget
                </label>
                <select
                  id="finance-budget"
                  name="monthly_budget"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-[#1B4F72] focus:border-transparent"
                >
                  <option value="">Select your budget</option>
                  <option value="under-200">Under $200/month</option>
                  <option value="200-300">$200 - $300/month</option>
                  <option value="300-400">$300 - $400/month</option>
                  <option value="400-500">$400 - $500/month</option>
                  <option value="500-plus">$500+/month</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="finance-vehicle"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Vehicle of Interest
              </label>
              <input
                type="text"
                id="finance-vehicle"
                name="vehicle_interest"
                className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4F72] focus:border-transparent"
                placeholder="e.g., Toyota Camry, any SUV under $15,000"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#1B4F72] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[#154360] transition-colors text-lg"
            >
              Submit Pre-Approval Application
            </button>
          </form>

          {/* Trust Signals */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center gap-2 p-4">
              <svg className="w-8 h-8 text-[#1B4F72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <p className="text-sm text-gray-600 font-medium">
                Secure, Encrypted Form
              </p>
              <p className="text-xs text-gray-400">
                Your data is protected with SSL encryption
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <svg className="w-8 h-8 text-[#1B4F72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <p className="text-sm text-gray-600 font-medium">
                No Impact on Credit Score
              </p>
              <p className="text-xs text-gray-400">
                Pre-approval does not affect your credit
              </p>
            </div>
            <div className="flex flex-col items-center gap-2 p-4">
              <svg className="w-8 h-8 text-[#1B4F72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-sm text-gray-600 font-medium">
                Fast Response
              </p>
              <p className="text-xs text-gray-400">
                We respond within one business day
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-[#1B4F72] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">
            Prefer to Talk in Person?
          </h2>
          <p className="text-blue-100 mb-6 text-lg">
            Call us or stop by the dealership. We are happy to walk you through your financing options face to face.
          </p>
          <a
            href="tel:+16303593643"
            className="inline-block bg-white text-[#1B4F72] font-semibold px-8 py-3 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Call (630) 359-3643
          </a>
        </div>
      </section>
    </>
  );
}
