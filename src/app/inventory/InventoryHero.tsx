"use client";

import { useLanguage } from "@/context/LanguageContext";

export default function InventoryHero() {
  const { t } = useLanguage();
  const inv = t.inventory;
  return (
    <section className="bg-brand-navy text-white py-10">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl md:text-4xl font-bold">{inv.heading}</h1>
        <p className="mt-2 text-brand-gray-300">{inv.subheading}</p>
      </div>
    </section>
  );
}
