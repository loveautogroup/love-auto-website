"use client";

import { useLanguage } from "@/context/LanguageContext";
import { SITE_CONFIG } from "@/lib/constants";

export default function AboutHero() {
  const { t } = useLanguage();
  const a = t.about;
  return (
    <section className="bg-brand-navy text-white py-16">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold">{a.heading}</h1>
        <p className="mt-4 text-lg text-brand-gray-300">
          {a.subtext.replace("{year}", String(SITE_CONFIG.established))}
        </p>
      </div>
    </section>
  );
}
