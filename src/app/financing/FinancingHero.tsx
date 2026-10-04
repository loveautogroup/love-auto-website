"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function FinancingHero() {
  const { t } = useLanguage();
  const f = t.financing;
  return (
    <section className="bg-brand-navy text-white py-14 md:py-20 border-b border-white/[.14]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-brand-red-light">
          {f.eyebrow}
        </p>
        <h1 className="mt-3 font-heading font-extrabold leading-[0.98] text-[clamp(2rem,5vw,3.25rem)]">
          {f.heading}
        </h1>
        <p className="mt-5 text-base sm:text-lg text-ink-300 leading-relaxed max-w-2xl mx-auto">
          {f.subtext}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="#apply"
            className="inline-flex items-center justify-center gap-2.5 bg-brand-red hover:bg-brand-red-dark text-white px-7 py-3.5 text-[12.5px] font-bold uppercase tracking-[0.08em] transition-colors"
          >
            {f.ctaFull}
          </a>
        </div>
        <p className="mt-3 text-sm text-ink-400">{f.softInquiry}</p>
      </div>
    </section>
  );
}
