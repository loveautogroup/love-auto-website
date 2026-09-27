"use client";

/**
 * Full-bleed editorial "pull quote" band — the sign above the owner's
 * office door, treated as a statement rather than a testimonial card.
 *
 * The English line is the literal sign and never translated (matches the
 * existing rule in HomeHappyCustomers, which reads locale the same way —
 * the homepage server component is shared between / and /es/ with the
 * locale supplied by context, not a prop, so this reads it directly rather
 * than requiring page.tsx to thread it through).
 */

import { useLanguage } from "@/context/LanguageContext";

export default function DoorSignQuoteBand() {
  const { locale } = useLanguage();
  return (
    <section className="bg-white py-16 sm:py-24 text-center border-b border-ink-200">
      <div className="max-w-4xl mx-auto px-4">
        <div className="w-14 h-[3px] bg-brand-red mx-auto mb-8" aria-hidden="true" />
        <blockquote className="font-heading font-extrabold text-brand-gray-900 leading-[1.1] text-[clamp(1.6rem,4.4vw,3.25rem)]">
          &ldquo;Enter as strangers, leave as friends.&rdquo;
        </blockquote>
        {locale === "es" && (
          <p className="mt-3 font-heading font-bold text-brand-gray-500 text-[clamp(1rem,2vw,1.4rem)]">
            &ldquo;Entran como desconocidos, salen como amigos.&rdquo;
          </p>
        )}
        <cite className="block mt-6 text-[12px] font-semibold uppercase tracking-[0.14em] text-brand-gray-500 not-italic">
          The sign above our door
        </cite>
      </div>
    </section>
  );
}
