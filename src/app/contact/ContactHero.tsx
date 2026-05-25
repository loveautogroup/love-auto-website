"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function ContactHero() {
  const { t } = useLanguage();
  const c = t.contact;
  return (
    <section className="bg-brand-navy text-white py-16">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold">{c.heading}</h1>
        <p className="mt-4 text-lg text-brand-gray-300">{c.subtext}</p>
      </div>
    </section>
  );
}
