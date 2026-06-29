import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants";
import HomeFeaturedGrid, { HomeOnTheLot } from "@/components/HomeFeaturedGrid";
import HomepageReviewWall from "@/components/HomepageReviewWall";
import PaymentCalculator from "@/components/PaymentCalculator";
import CarfaxAdvantageBadge from "@/components/CarfaxAdvantageBadge";
import VDPTrustStrip from "@/components/VDPTrustStrip";
import HomeHero from "@/components/HomeHero";
import { SERVICE_AREAS } from "@/data/serviceAreas";
import { BRANDS } from "@/data/brands";

export default function HomePage() {
  return (
    <>
      <HomeHero />

      {/* Trust ticker — 3 credibility pillars, visible on every page */}
      <div className="max-w-7xl mx-auto px-4 pt-4">
        <VDPTrustStrip />
      </div>

      {/* Featured Vehicles — self-hides when nothing is featured in KV */}
      <HomeFeaturedGrid />

      {/* On the Lot Now â€" horizontal scroll carousel */}
      <section className="bg-brand-navy py-12" aria-labelledby="lot-heading">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-baseline justify-between mb-6">
            <div>
              <h2 id="lot-heading" className="text-2xl font-bold text-white">
                On the Lot Now
              </h2>
              <p className="text-brand-gray-300 text-sm mt-1">
                Available today in Villa Park
              </p>
            </div>
            <Link
              href="/inventory"
              className="text-brand-red-light hover:text-white text-sm font-semibold transition-colors"
            >
              View All →
            </Link>
          </div>
          <HomeOnTheLot />
        </div>
      </section>

      {/* Trust Pillars */}
      <section className="bg-white py-16" aria-labelledby="why-heading">
        <div className="max-w-7xl mx-auto px-4">
          <h2 id="why-heading" className="text-3xl font-bold text-center text-brand-gray-900 mb-12">
            Why Love Auto Group?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-brand-red"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-brand-gray-900 mb-2">
                Every Vehicle Inspected
              </h3>
              <p className="text-brand-gray-500 leading-relaxed">
                Every vehicle is thoroughly inspected and reconditioned
                before it hits the lot. No surprises, just quality you can
                trust.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-brand-red"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-brand-gray-900 mb-2">
                Transparent Pricing
              </h3>
              <p className="text-brand-gray-500 leading-relaxed">
                Our prices are competitive and clearly listed. No hidden fees, no
                pressure tactics. Just deals that respect your
                time and budget.
              </p>
            </div>
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-brand-red/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 text-brand-red"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-brand-gray-900 mb-2">
                Family Owned Since 2014
              </h3>
              <p className="text-brand-gray-500 leading-relaxed">
                We&apos;re not a big corporate dealer group. We know our
                customers by name, and our reputation is everything. That&apos;s
                why we do it right.
              </p>
            </div>
          </div>

          {/* Accreditations row — third-party trust marks. Reinforces the
              three pillars with externally-verifiable proof points. */}
          <div className="mt-12 pt-10 border-t border-brand-gray-200">
            <p className="text-center text-xs uppercase tracking-[0.18em] text-brand-gray-500 mb-5">
              Accredited & Recognized
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              <CarfaxAdvantageBadge size="lg" />
            </div>
          </div>
        </div>
      </section>

      {/* We Buy Cars — private party acquisition CTA */}
      <section
        className="bg-brand-navy py-14"
        aria-labelledby="we-buy-heading"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-brand-red font-bold uppercase tracking-widest text-xs mb-3">
              Selling Your Car?
            </p>
            <h2
              id="we-buy-heading"
              className="text-3xl md:text-4xl font-bold text-white mb-4"
            >
              We Buy Cars — Any Make, Any Model
            </h2>
            <p className="text-brand-gray-300 text-base md:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
              Get a real cash offer from a real dealer. No pressure, no
              obligation, no trade-in required. We buy private party vehicles
              every week — bring it in and we&apos;ll make you an offer on
              the spot.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/sell-your-car"
                className="inline-flex items-center justify-center bg-brand-red hover:bg-brand-red-dark text-white font-bold px-8 py-3.5 rounded-xl transition-colors text-sm"
              >
                Get a Cash Offer
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="ml-2 w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <a
                href={`tel:${SITE_CONFIG.phoneRaw}`}
                className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 8V5z" />
                </svg>
                Or call {SITE_CONFIG.phone}
              </a>
            </div>

            {/* Trust chips */}
            <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs text-white/50">
              {[
                "Cash paid same day",
                "No trade-in required",
                "All makes & models",
                "Free on-the-spot appraisal",
              ].map((chip) => (
                <span key={chip} className="inline-flex items-center gap-1.5">
                  <svg className="w-3 h-3 text-brand-red flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  {chip}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Payment Calculator — CarMax-inspired */}
      <PaymentCalculator />

      {/* We Buy Cars — cash offer. Pairs with the delivery section below
          (sell -> ship) between the payment calculator and the reviews. */}
      <section className="bg-white py-14" aria-labelledby="sell-heading">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left - copy */}
            <div>
              <p className="text-brand-red font-bold uppercase tracking-widest text-xs mb-3">
                Selling Your Car?
              </p>
              <h2 id="sell-heading" className="text-3xl sm:text-4xl font-bold text-brand-gray-900 leading-tight mb-4">
                We Buy Cars. Any Make, Any Model.
              </h2>
              <p className="text-brand-gray-600 text-base leading-relaxed mb-6">
                A real cash offer from a real dealer. No pressure, no obligation,
                no trade-in required. Bring it in and we&rsquo;ll appraise it on
                the spot.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/sell-your-car"
                  className="inline-flex items-center justify-center gap-2 bg-brand-red text-white font-bold px-6 py-3 rounded-xl hover:bg-red-700 transition-colors text-sm"
                >
                  Get a Cash Offer
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                </Link>
                <a
                  href={`tel:${SITE_CONFIG.phoneRaw}`}
                  className="inline-flex items-center justify-center gap-2 bg-brand-gray-50 text-brand-gray-900 font-semibold px-6 py-3 rounded-xl hover:bg-brand-gray-100 transition-colors text-sm border border-brand-gray-200"
                  aria-label={`Call ${SITE_CONFIG.phone} for a cash offer`}
                >
                  Call {SITE_CONFIG.phone}
                </a>
              </div>
            </div>
            {/* Right - trust points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: "M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                  title: "Cash Paid Same Day",
                  body: "A real offer on the spot. Walk in with your car, walk out paid.",
                },
                {
                  icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                  title: "No Trade-In Required",
                  body: "You don't have to buy a car from us to sell us yours.",
                },
                {
                  icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z",
                  title: "All Makes & Models",
                  body: "Domestic, import, SUV, truck, high mileage, we look at everything.",
                },
                {
                  icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z",
                  title: "Free On-the-Spot Appraisal",
                  body: "No appointment, no fee. We appraise it while you wait.",
                },
              ].map(({ icon, title, body }) => (
                <div key={title} className="bg-brand-gray-50 border border-brand-gray-200 rounded-xl p-4">
                  <svg className="w-5 h-5 text-brand-red mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                  <p className="text-sm font-bold text-brand-gray-900 mb-1">{title}</p>
                  <p className="text-xs text-brand-gray-500 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Nationwide Delivery */}
      <section className="bg-brand-navy py-14" aria-labelledby="delivery-heading">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            {/* Left — copy */}
            <div>
              <p className="text-brand-red font-bold uppercase tracking-widest text-xs mb-3">
                Can&rsquo;t Make It to Villa Park?
              </p>
              <h2 id="delivery-heading" className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4">
                We Ship Anywhere in the US
              </h2>
              <p className="text-white/75 text-base leading-relaxed mb-6">
                Found your car but live out of state? No problem. We arrange
                door-to-door transport with a vetted carrier — you pay the
                shipping, we handle everything else. Hundreds of customers
                have bought from us sight-unseen. We&rsquo;ll walk you through
                every detail over the phone before you commit.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <a
                  href={`tel:${SITE_CONFIG.phoneRaw}`}
                  className="inline-flex items-center justify-center gap-2 bg-brand-red text-white font-bold px-6 py-3 rounded-xl hover:bg-red-700 transition-colors text-sm"
                  aria-label={`Call ${SITE_CONFIG.phone} to ask about delivery`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  Call {SITE_CONFIG.phone}
                </a>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center gap-2 bg-white/10 text-white font-semibold px-6 py-3 rounded-xl hover:bg-white/20 transition-colors text-sm border border-white/20"
                >
                  Ask About Delivery
                </Link>
              </div>
            </div>
            {/* Right — trust points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  icon: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
                  title: "Vetted Carriers",
                  body: "We work with licensed, insured transport carriers — not random Craigslist haulers.",
                },
                {
                  icon: "M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z",
                  title: "Personal Walkthrough",
                  body: "We’ll video-call you and walk the car bumper-to-bumper before it ships.",
                },
                {
                  icon: "M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z",
                  title: "All Paperwork Handled",
                  body: "We e-sign the title, bill of sale, and shipping docs — nothing left hanging.",
                },
                {
                  icon: "M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12",
                  title: "Door-to-Door",
                  body: "Carrier picks up from our lot and delivers straight to your driveway — no middleman terminal.",
                },
              ].map(({ icon, title, body }) => (
                <div key={title} className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <svg className="w-5 h-5 text-brand-red mb-2" fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                  </svg>
                  <p className="text-sm font-bold text-white mb-1">{title}</p>
                  <p className="text-xs text-white/60 leading-relaxed">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Location & Hours */}
      <section className="max-w-7xl mx-auto px-4 py-16" aria-labelledby="visit-heading">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 id="visit-heading" className="text-3xl font-bold text-brand-gray-900 mb-6">
              Visit Us in Villa Park
            </h2>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-brand-red mt-0.5 shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <div>
                  <p className="font-semibold text-brand-gray-900">
                    {SITE_CONFIG.address.full}
                  </p>
                  <p className="text-sm text-brand-gray-500">
                    Conveniently located off North Avenue in DuPage County
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-6 h-6 text-brand-red mt-0.5 shrink-0"
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
                <div>
                  <a
                    href={`tel:${SITE_CONFIG.phoneRaw}`}
                    className="font-semibold text-brand-red hover:text-brand-red-dark"
                  >
                    {SITE_CONFIG.phone}
                  </a>
                  <p className="text-sm text-brand-gray-500">
                    Call or text, we respond fast
                  </p>
                </div>
              </div>
            </div>

            {/* Hours table */}
            <div className="mt-6 bg-white rounded-xl border border-brand-gray-200 p-5">
              <h3 className="font-semibold text-brand-gray-900 mb-3">
                Business Hours
              </h3>
              <ul className="space-y-1.5 text-sm">
                {SITE_CONFIG.hours.map((h) => (
                  <li key={h.day} className="flex justify-between">
                    <span className="text-brand-gray-500">{h.day}</span>
                    <span
                      className={`font-medium ${h.hours === "Closed" ? "text-brand-red" : "text-brand-gray-900"}`}
                    >
                      {h.hours}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Map */}
          <div className="rounded-2xl overflow-hidden border border-brand-gray-200">
            <iframe
              title={`Map of ${SITE_CONFIG.name} at ${SITE_CONFIG.address.full}`}
              src={`https://www.google.com/maps?q=${encodeURIComponent(SITE_CONFIG.address.full)}&output=embed`}
              className="w-full aspect-[4/3] block border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          </div>
        </div>
      </section>
      {/* Review wall — social proof before the SEO hub. Positioned at the
          bottom of the page so it closes strong, distinct from mid-page
          placement used by competitors. */}
      <HomepageReviewWall />

      {/* Internal-linking hub section — feeds homepage authority to brand,
          geo, and buying-guide pages. Added 2026-05-23 as part of Anna v2
          SEO push. Per the GSC deep-dive, the homepage carries 80% of
          ranked queries; this block transfers some of that authority to
          the specialist landing pages we want to win specific intents. */}
      <section
        className="bg-brand-gray-50 py-16 border-t border-brand-gray-200"
        aria-labelledby="serving-heading"
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2
              id="serving-heading"
              className="text-3xl font-bold text-brand-gray-900 mb-3"
            >
              Serving Used Car Buyers Across DuPage County
            </h2>
            <p className="text-brand-gray-600 max-w-2xl mx-auto">
              We're family owned in Villa Park, IL — 20 miles from Chicago — and we draw buyers from
              every neighboring town. Find your route below, or browse by
              brand or buying guide.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Towns we serve */}
            <div>
              <h3 className="font-semibold text-brand-gray-900 mb-4 text-lg">
                Towns We Serve
              </h3>
              <ul className="space-y-2">
                {SERVICE_AREAS.map((area) => (
                  <li key={area.slug}>
                    <Link
                      href={`/serving/${area.slug}/`}
                      className="text-brand-navy hover:text-brand-red transition-colors"
                    >
                      Used Cars in {area.town}, IL
                    </Link>
                  </li>
                ))}
                <li className="pt-2 border-t border-brand-gray-200 mt-3">
                  <Link
                    href="/serving/dupage-county-il/"
                    className="text-brand-red font-semibold hover:text-brand-red-dark"
                  >
                    All of DuPage County →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Browse by brand */}
            <div>
              <h3 className="font-semibold text-brand-gray-900 mb-4 text-lg">
                Browse by Brand
              </h3>
              <ul className="space-y-2">
                {BRANDS.map((brand) => (
                  <li key={brand.slug}>
                    <Link
                      href={`/brands/${brand.slug}/`}
                      className="text-brand-navy hover:text-brand-red transition-colors"
                    >
                      Used {brand.displayName}
                    </Link>
                  </li>
                ))}
                <li className="pt-2 border-t border-brand-gray-200 mt-3">
                  <Link
                    href="/inventory/"
                    className="text-brand-red font-semibold hover:text-brand-red-dark"
                  >
                    View full inventory →
                  </Link>
                </li>
              </ul>
            </div>

            {/* Buying guides */}
            <div>
              <h3 className="font-semibold text-brand-gray-900 mb-4 text-lg">
                Buying Guides
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/buying-guides/used-lexus-dupage-county/"
                    className="text-brand-navy hover:text-brand-red transition-colors"
                  >
                    Used Lexus in DuPage County
                  </Link>
                </li>
                <li>
                  <Link
                    href="/buying-guides/used-subaru-near-chicago/"
                    className="text-brand-navy hover:text-brand-red transition-colors"
                  >
                    Used Subaru Near Chicago
                  </Link>
                </li>
                <li>
                  <Link
                    href="/buying-guides/independent-japanese-makes-dealer-chicago/"
                    className="text-brand-navy hover:text-brand-red transition-colors"
                  >
                    Why an Independent Japanese-Makes Dealer
                  </Link>
                </li>
                <li>
                  <Link
                    href="/free-carfax-villa-park/"
                    className="text-brand-navy hover:text-brand-red transition-colors"
                  >
                    Free Carfax on Every Vehicle
                  </Link>
                </li>
                <li>
                  <Link
                    href="/financing/"
                    className="text-brand-navy hover:text-brand-red transition-colors"
                  >
                    Used Car Financing, All Credit Welcome
                  </Link>
                </li>
                <li className="pt-2 border-t border-brand-gray-200 mt-3">
                  <Link
                    href="/faq/"
                    className="text-brand-red font-semibold hover:text-brand-red-dark"
                  >
                    FAQ →
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
