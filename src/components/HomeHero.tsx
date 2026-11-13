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
 * Owner, 2026-11-12: the video moved out of the hero into its own band
 * partway down the homepage (HomeCustomerVideo). The hero is text only now.
 *
 * Extracted from app/page.tsx so it can consume useLanguage() for EN/ES
 * translations. All other page sections stay as server-rendered RSC.
 */

import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

export default function HomeHero() {
  const { t } = useLanguage();

  return (
    <section className="relative bg-[#0a0a0a] text-white overflow-hidden">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-8 pb-12 lg:pt-16 lg:pb-16 flex flex-col justify-end">
        <div className="max-w-2xl border-l-2 sm:border-l-[3px] border-brand-red pl-4 sm:pl-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-red-light">
            Villa Park, Illinois &middot; In Business Since 2014
          </p>
          <h1
            className="mt-3 font-heading font-extrabold leading-[0.98] text-[clamp(2rem,7vw,4.25rem)] lg:text-[clamp(2.75rem,4.2vw,4.5rem)]"
          >
            {t.hero.headline}
            <br />
            <span className="text-brand-red">{t.hero.headlineSub}</span>
          </h1>
          <p className="mt-4 sm:mt-5 text-sm sm:text-base lg:text-lg text-ink-300 leading-relaxed max-w-xl">
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
              href="/financing/"
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
