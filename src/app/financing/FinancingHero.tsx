"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function FinancingHero() {
  const { t } = useLanguage();
  const f = t.financing;
  return (
    <section className="bg-brand-navy text-white py-16">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <p className="text-brand-red uppercase tracking-wider text-sm font-bold mb-3">
          {f.eyebrow}
        </p>
        <h1 className="text-4xl md:text-5xl font-bold">{f.heading}</h1>
        <p className="mt-4 text-lg text-brand-gray-300 max-w-2xl mx-auto">
          {f.subtext}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
          <a
            href="#apply"
            className="inline-flex items-center justify-center gap-2 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors"
          >
            <span aria-hidden>📋</span> {f.ctaFull}
          </a>
          <a
            href="#apply"
            className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/30 hover:bg-white/20 text-white font-bold text-lg px-8 py-4 rounded-xl transition-colors"
          >
            <span aria-hidden>⚡</span> {f.ctaQuick}
          </a>
        </div>
        <p className="mt-3 text-sm text-brand-gray-400">{f.softInquiry}</p>
      </div>
    </section>
  );
}
