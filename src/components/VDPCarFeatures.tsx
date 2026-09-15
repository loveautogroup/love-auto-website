"use client";

/**
 * The car's own feature list, in the VDP right column.
 *
 * Owner, 2026-09-15: "Lets erase our recon checklist from all ads on the
 * website. Instead lets place a list of features of the car." The checklist it
 * replaced was the same nine lines on every vehicle.
 *
 * The list is `vehicle.features` as Railway publishes it
 * (vehicle_facts.public_features): features typed on the record, equipment
 * read off this car and confirmed Yes, and factory-standard decode items. Never
 * an optional item or a recon line, because every line is an advertising claim.
 *
 * A car with nothing on record shows NO card. A generic list in its place is
 * exactly what this replaced.
 */

import { useLanguage } from "@/context/LanguageContext";

export default function VDPCarFeatures({ features }: { features: string[] }) {
  const { t } = useLanguage();
  const items = (features ?? []).filter((f) => typeof f === "string" && f.trim());
  if (items.length === 0) return null;

  return (
    <section
      className="bg-white rounded-xl border border-brand-gray-200 p-5"
      aria-labelledby="car-features-heading"
    >
      <div className="mb-4">
        <h2
          id="car-features-heading"
          className="text-sm font-bold text-brand-gray-900 uppercase tracking-wide"
        >
          {t.vdp.carFeaturesTitle}
        </h2>
        <p className="text-xs text-brand-gray-500 mt-0.5">{t.vdp.carFeaturesSub}</p>
      </div>

      <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2" role="list">
        {items.map((item) => (
          <li key={item} className="flex items-start gap-2 text-sm text-brand-gray-700">
            <svg
              className="shrink-0 mt-0.5 w-4 h-4 text-brand-red"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2.5}
              stroke="currentColor"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
