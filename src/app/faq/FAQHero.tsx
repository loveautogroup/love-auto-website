"use client";

import { useLanguage } from "@/context/LanguageContext";

export function FAQHero() {
  const { t } = useLanguage();
  const f = t.faq;
  return (
    <section className="bg-brand-navy text-white py-16">
      <div className="max-w-4xl mx-auto px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold">{f.heading}</h1>
        <p className="mt-4 text-lg text-brand-gray-300">{f.subtext}</p>
      </div>
    </section>
  );
}

export function FAQCta() {
  const { t } = useLanguage();
  const f = t.faq;
  return (
    <div className="bg-brand-red rounded-2xl p-8 text-white text-center">
      <h2 className="text-2xl font-bold mb-2">{f.stillHaveQuestions}</h2>
      <p className="text-white/80 mb-6">{f.stillSubtext}</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <a
          href="tel:+16303593643"
          className="inline-flex items-center justify-center gap-2 bg-white text-brand-red font-bold px-6 py-3 rounded-xl hover:bg-white/90 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          (630) 359-3643
        </a>
        <a
          href="/contact"
          className="inline-flex items-center justify-center gap-2 border-2 border-white/50 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
        >
          Send a Message
        </a>
      </div>
    </div>
  );
}
