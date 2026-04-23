"use client";

import { useState } from "react";
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
  /** Optional warranty copy from the merchandising overlay. */
  warranty?: string;
}

function generateFAQs(vehicle: Vehicle, warranty?: string) {
  const yearMakeModel = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const formattedMileage = new Intl.NumberFormat("en-US").format(vehicle.mileage);
  const formattedPrice = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(vehicle.price);

  const faqs: { question: string; answer: string }[] = [];

  // 1. Drivetrain — most-asked spec for Chicago-area shoppers
  faqs.push({
    question: `Is this ${yearMakeModel} all-wheel drive?`,
    answer:
      vehicle.drivetrain === "AWD"
        ? `Yes — this ${yearMakeModel} has all-wheel drive (AWD), which is a real advantage for Chicago-area winters and is one of the reasons we keep these in inventory.`
        : vehicle.drivetrain === "4WD"
          ? `This ${yearMakeModel} has four-wheel drive (4WD). 4WD is engaged on demand — different from a full-time AWD system but excellent for off-road and severe-weather conditions.`
          : vehicle.drivetrain === "RWD"
            ? `No — this ${yearMakeModel} is rear-wheel drive (RWD). It's a great driver's setup but you'll want quality winter tires for Chicago-area snow.`
            : `This ${yearMakeModel} is front-wheel drive (FWD). Fuel-efficient and predictable in most conditions; quality all-season or winter tires are recommended for Illinois winters.`,
  });

  // 2. Mileage — second-most-asked
  faqs.push({
    question: `How many miles does this ${yearMakeModel} have?`,
    answer: `This ${yearMakeModel} currently shows ${formattedMileage} miles on the odometer. ${
      vehicle.mileage < 60000
        ? "That's well below average for the model year — a low-mileage example."
        : vehicle.mileage < 120000
          ? "That's typical for the model year and well within the useful service life of this vehicle."
          : "Higher-mileage examples like this one are priced to reflect the additional miles. The drivetrain has been inspected and is operating within spec — happy to walk you through what we checked."
    }`,
  });

  // 3. Carfax availability
  faqs.push({
    question: `Can I see a Carfax report on this ${yearMakeModel}?`,
    answer:
      "Yes. Love Auto Group is a Carfax Advantage Dealer, which means we provide a free Carfax history report on every vehicle in our inventory. The report shows accident history, service records, ownership chain, and title status. You can pull it directly from the CARFAX badge on this vehicle's photo.",
  });

  // 4. Warranty / as-is
  faqs.push({
    question: `Does this ${yearMakeModel} come with a warranty?`,
    answer: warranty
      ? `Yes — this ${yearMakeModel} comes with our ${warranty}. Extended coverage options are also available; ask us at the lot or by phone.`
      : `This ${yearMakeModel} is sold as-is. We've inspected the vehicle for known issues on the platform and disclose what we find — but for vehicles in this price range, we don't add warranty coverage that would otherwise inflate the price. Extended third-party warranty options are available if you'd like one.`,
  });

  // 5. Pricing / financing
  faqs.push({
    question: `What's the price and can I finance this ${yearMakeModel}?`,
    answer: `This ${yearMakeModel} is priced at ${formattedPrice}. We work with multiple lenders including options for buyers with less-than-perfect credit. Our quick estimator on this page shows monthly payments by down payment, term, and credit tier — or stop by and we'll run an actual approval in about 15 minutes.`,
  });

  // 6. Test drive / location
  faqs.push({
    question: `Where can I see this ${yearMakeModel} in person?`,
    answer:
      "We're at 735 N Yale Ave, Villa Park, IL 60181 — easy to reach from Lombard, Elmhurst, Oak Brook, Glen Ellyn, Addison, and the broader DuPage County area. Test drives are walk-in friendly during business hours; call (630) 359-3643 to confirm the vehicle is on the lot before you head over.",
  });

  return faqs;
}

export default function VDPFAQ({ vehicle, warranty }: VDPFAQProps) {
  const faqs = generateFAQs(vehicle, warranty);
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
          Common Questions About This Vehicle
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
