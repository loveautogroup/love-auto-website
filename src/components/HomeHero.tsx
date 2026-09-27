"use client";

/**
 * HomeHero — homepage hero section as a client component.
 *
 * Redesign 2026-09 (Bob's "modern automotive editorial" concept): the flat
 * dark-gradient hero is gone, replaced with the real customer promo video,
 * full-bleed, muted/looped/autoplaying behind the headline — photography
 * (here, real footage of real customers and their cars) leads, per the
 * concept's core rule. The headline becomes the dealership's own required
 * tagline instead of generic filler copy.
 *
 * This is a SEPARATE instance of the clip from HomeHappyCustomers below on
 * the page — that one is a deliberate click-through to the full video on
 * /reviews with its own heading and review lockup. This one is pure ambient
 * background; the two don't compete because they serve different jobs, and
 * neither is hidden from a viewer who scrolls past the other.
 *
 * Native `controls` stays on, same accessibility rule PromoVideo enforces
 * elsewhere on the site: a silent looping video always needs a reachable
 * pause button, even sitting behind display type.
 *
 * Extracted from app/page.tsx so it can consume useLanguage() for EN/ES
 * translations. All other page sections stay as server-rendered RSC.
 */

import { useRef } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { sendEvent } from "@/lib/analytics";

export default function HomeHero() {
  const { t } = useLanguage();
  const firedPlayEvent = useRef(false);

  const handlePlay = () => {
    if (firedPlayEvent.current) return;
    firedPlayEvent.current = true;
    sendEvent("video_play", { video: "happy_customers_loop", location: "homepage_hero" });
  };

  return (
    <section className="relative bg-brand-navy text-white overflow-hidden lg:aspect-video">
      {/* Video plays BEHIND the headline at every width (owner,
          2026-09-27). From lg up the hero is exactly 16:9, the video's own
          shape, so object-cover crops nothing ("can't view many of the
          pics"). Below lg the text needs more height than a 16:9 strip,
          so the video covers a taller box and trims the sides; center
          position keeps the people in frame. */}
      <video
        autoPlay
        muted
        loop
        playsInline
        controls
        preload="metadata"
        poster="/videos/happy-customers-loop-poster.jpg"
        aria-label="Love Auto Group customers and their cars"
        onPlay={handlePlay}
        className="absolute inset-0 w-full h-full object-cover object-center opacity-[.8]"
      >
        <source src="/videos/happy-customers-loop.mp4" type="video/mp4" />
      </video>
      {/* Scrim: strongest at the bottom-left where the headline sits, clear
          toward the top-right so the video still reads. */}
      <div
        className="absolute inset-0 pointer-events-none bg-gradient-to-t lg:bg-gradient-to-tr from-[#0a0a0a]/90 from-10% via-[#0a0a0a]/40 via-50% to-transparent to-80%"
        aria-hidden="true"
      />
      <div className="relative lg:h-full min-h-[560px] lg:min-h-0 max-w-7xl mx-auto px-4 sm:px-6 pt-24 pb-16 lg:pt-0 lg:pb-20 flex flex-col justify-end">
        <div className="max-w-2xl border-l-2 sm:border-l-[3px] border-brand-red pl-4 sm:pl-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-red-light">
            Villa Park, Illinois &middot; Family Owned Since 2014
          </p>
          <h1
            className="mt-3 font-heading font-extrabold leading-[0.98] text-[clamp(2rem,7vw,4.25rem)]"
          >
            {t.hero.headline}
            <br />
            <span className="text-brand-red">{t.hero.headlineSub}</span>
          </h1>
          <p className="mt-4 sm:mt-5 text-sm sm:text-base text-ink-300 leading-relaxed max-w-lg">
            {t.hero.subtext}
          </p>
          <div className="mt-6 sm:mt-7 flex flex-col sm:flex-row gap-3">
            <Link
              href="/inventory"
              className="group inline-flex items-center justify-center gap-2.5 bg-brand-red hover:bg-brand-red-dark text-white px-6 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em] transition-colors"
            >
              {t.hero.cta}
              <svg
                className="w-4 h-4 transition-transform duration-150 group-hover:translate-x-1"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
            <Link
              href="/financing"
              className="inline-flex items-center justify-center border border-white/35 hover:border-white hover:bg-white/[.06] text-white px-6 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em] transition-colors"
            >
              {t.hero.ctaFinancing}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
