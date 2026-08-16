"use client";

import { useState } from "react";
import type { Translations } from "@/lib/i18n";
import { useLanguage } from "@/context/LanguageContext";
import { Vehicle } from "@/lib/types";
import { FAQSchema } from "@/components/StructuredData";

/**
 * Per-vehicle FAQ block — renders 4-6 vehicle-specific Q/A pairs derived
 * from the vehicle's specs + merchandising overlay. Emits FAQPage JSON-LD
 * so the questions are eligible for Google's rich-result accordion in
 * SERPs (a meaningful PAA / featured-snippet capture for inventory pages).
 *
 * Mark + Charlotte's call: dynamic generation rather than per-vehicle
 * Jordan-authored Q&A. Hits the most common shopper questions consistently
 * and keeps the maintenance burden zero. Per-vehicle custom FAQs can
 * override later if Jordan wants to layer them in via the merchandising
 * admin.
 */

interface VDPFAQProps {
  vehicle: Vehicle;
}

type FaqCopy = Translations["vdp"]["faq"];

/**
 * Build the Q&A from the active dictionary.
 *
 * The copy lives in i18n so the Spanish VDP asks and answers in Spanish —
 * these strings also feed FAQSchema, so a Spanish page emitting English
 * structured data would misdescribe itself to search engines.
 *
 * fill() substitutes {model}/{miles}/{price}. The numbers are formatted with
 * the active locale so a Spanish page reads 142.849 rather than 142,849.
 */
function fill(tpl: string, vars: Record<string, string>): string {
  return Object.entries(vars).reduce(
    (out, [k, val]) => out.split(`{${k}}`).join(val),
    tpl
  );
}

function generateFAQs(vehicle: Vehicle, f: FaqCopy, locale: string) {
  const model = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const nf = new Intl.NumberFormat(locale === "es" ? "es-US" : "en-US");
  const miles = nf.format(vehicle.mileage);
  // Was maximumFractionDigits:0 with no floor, so $13,999.99 rendered as
  // "$14,000" — a HIGHER price than we charge, in FAQ text that also feeds
  // structured data. Now exact.
  const price = new Intl.NumberFormat(locale === "es" ? "es-US" : "en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Math.round(vehicle.price * 100) % 100 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(vehicle.price);

  const V = { model, miles, price };
  const faqs: { question: string; answer: string }[] = [];

  // Only answer this when the DMS actually knows the drivetrain.
  //
  // The final branch used to be a bare `else`, so ANY unknown value — and the
  // feed does send "" — produced a confident "this is front-wheel drive".
  // Stock 11331, a rear-wheel-drive Mustang, was telling shoppers it was FWD
  // in both the visible copy and the FAQ structured data Google can surface.
  // A missing spec now omits the question instead of inventing an answer.
  const drivetrainAnswer: string | null =
    vehicle.drivetrain === "AWD"
      ? f.drivetrainAwd
      : vehicle.drivetrain === "4WD"
        ? f.drivetrain4wd
        : vehicle.drivetrain === "RWD"
          ? f.drivetrainRwd
          : vehicle.drivetrain === "FWD"
            ? f.drivetrainFwd
            : null;
  if (drivetrainAnswer) {
    faqs.push({
      question: fill(f.drivetrainQ, V),
      answer: fill(drivetrainAnswer, V),
    });
  }

  const mileageTail =
    vehicle.mileage < 60000
      ? f.mileageLow
      : vehicle.mileage < 120000
        ? f.mileageTypical
        : f.mileageHigh;
  faqs.push({
    question: fill(f.mileageQ, V),
    answer: `${fill(f.mileageIntro, V)} ${mileageTail}`,
  });

  faqs.push({ question: fill(f.carfaxQ, V), answer: fill(f.carfaxA, V) });
  faqs.push({ question: fill(f.priceQ, V), answer: fill(f.priceA, V) });
  // Straight after price, where "so what's the catch" is the next thought.
  // This one also feeds FAQSchema, so it is the no-dealer-fees claim's only
  // route into Google rich results and voice/AI answers — the badges and
  // trust strip are invisible to both.
  faqs.push({ question: fill(f.feesQ, V), answer: fill(f.feesA, V) });
  faqs.push({ question: fill(f.locationQ, V), answer: fill(f.locationA, V) });

  return faqs;
}

export default function VDPFAQ({ vehicle }: VDPFAQProps) {
  const { t, locale } = useLanguage();
  const faqs = generateFAQs(vehicle, t.vdp.faq, locale);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <>
      <FAQSchema items={faqs} />
      <section
        className="bg-white border border-brand-gray-200 rounded-xl p-6 md:p-8"
        aria-labelledby="vdp-faq-heading"
      >
        <h2
          id="vdp-faq-heading"
          className="text-2xl font-bold text-brand-gray-900 mb-6"
        >
          {t.vdp.faqHeading}
        </h2>
        <ul className="divide-y divide-brand-gray-200">
          {faqs.map((faq, i) => {
            const isOpen = openIndex === i;
            return (
              <li key={i} className="py-3">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="
                    w-full text-left flex items-center justify-between gap-4
                    py-2 text-brand-gray-900 font-semibold
                    hover:text-brand-red transition-colors
                  "
                >
                  <span>{faq.question}</span>
                  <svg
                    viewBox="0 0 24 24"
                    className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {isOpen && (
                  <p className="mt-2 text-brand-gray-700 leading-relaxed">{faq.answer}</p>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
