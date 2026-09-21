"use client";

/**
 * Hero + sidebar copy for /waitlist, bilingual via useLanguage. One component
 * with a `sidebar` switch so the strings live in one place (t.waitlistPage).
 */
import { useLanguage } from "@/context/LanguageContext";
import { SITE_CONFIG } from "@/lib/constants";

export default function WaitlistIntro({ sidebar = false }: { sidebar?: boolean }) {
  const { t } = useLanguage();
  const w = t.waitlistPage;

  if (sidebar) {
    return (
      <div className="space-y-6">
        <div className="bg-white rounded-xl border border-brand-gray-200 p-6">
          <h2 className="font-bold text-brand-gray-900 mb-3">{w.whyTitle}</h2>
          <ol className="space-y-3">
            {w.why.map((item, i) => (
              <li key={item} className="flex items-start gap-3 text-sm text-brand-gray-700">
                <span className="shrink-0 w-6 h-6 rounded-full bg-brand-red text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                {item}
              </li>
            ))}
          </ol>
        </div>
        <div className="bg-white rounded-xl border border-brand-gray-200 p-6">
          <h3 className="font-bold text-brand-gray-900 mb-2">{w.callTitle}</h3>
          <p className="text-sm text-brand-gray-600 mb-3">{w.callBody}</p>
          <a href={`tel:${SITE_CONFIG.phoneRaw}`} className="inline-flex items-center gap-2 text-brand-red hover:text-brand-red-dark font-semibold">
            {SITE_CONFIG.phone}
          </a>
        </div>
      </div>
    );
  }

  return (
    <section className="bg-brand-navy text-white">
      <div className="max-w-4xl mx-auto px-4 py-14">
        <p className="text-xs font-semibold uppercase tracking-widest text-brand-red mb-3">{w.eyebrow}</p>
        <h1 className="text-3xl sm:text-4xl font-bold mb-4">{w.heading}</h1>
        <p className="text-brand-gray-300 max-w-2xl">{w.sub}</p>
      </div>
    </section>
  );
}
