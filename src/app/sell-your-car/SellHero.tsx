"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function SellHero() {
  const { t } = useLanguage();
  const s = t.sellYourCar;
  return (
    <section className="bg-brand-navy text-white py-14 md:py-20 border-b border-white/[.14]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h1 className="font-heading font-extrabold leading-[0.98] text-[clamp(2rem,5vw,3.25rem)]">
          {s.heading}
        </h1>
        <span className="mt-4 inline-block w-12 h-[3px] bg-brand-red" aria-hidden="true" />
        <p className="mt-5 text-base sm:text-lg text-ink-300 leading-relaxed max-w-2xl mx-auto">
          {s.subtext}
        </p>
      </div>
    </section>
  );
}
