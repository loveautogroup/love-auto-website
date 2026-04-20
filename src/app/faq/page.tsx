import type { Metadata } from "next";
import Link from "next/link";
import { SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Used Car FAQ, Financing and Trade-Ins | Love Auto Group",
  description:
    "Questions about financing, trade-ins, warranties, and our inspection process at Love Auto Group in Villa Park, IL. Get the answers before you visit.",
  alternates: { canonical: "https://loveautogroup.pages.dev/faq" },
};

const faqs = [
  {
    question: "What types of vehicles does Love Auto Group sell?",
    answer:
      "We specialize in quality Japanese vehicles, including Lexus, Subaru, Acura, and Mazda. We also carry other reliable makes when they meet our standards. Every vehicle on our lot is in the $4,500 to $18,000 price range.",
  },
  {
    question: "Are your vehicles inspected before sale?",
    answer:
      "Yes. Every vehicle we sell is thoroughly inspected and fully reconditioned by our in-house team before it goes on the lot. If something needs fixing, it gets fixed right. We don't cut corners.",
  },
  {
    question: "Do you offer financing?",
    answer:
      "We work with multiple lenders to help you find financing that fits your budget, including options for buyers with less-than-perfect credit. You can get pre-approved right on our website with no impact to your credit score.",
  },
  {
    question: "Can I trade in my current vehicle?",
    answer:
      "Absolutely. We accept trade-ins and also buy vehicles outright, even if you're not purchasing from us. Visit our Sell Your Car page or stop by the lot for a fair offer.",
  },
  {
    question: "Do you offer warranties?",
    answer:
      "We offer optional extended warranty plans on our vehicles. Ask us about coverage options when you visit the lot or give us a call at (630) 359-3643.",
  },
  {
    question: "Where are you located?",
    answer:
      "We're at 735 N Yale Ave in Villa Park, IL 60181. Easy to get to from anywhere in the western suburbs and DuPage County.",
  },
  {
    question: "What are your business hours?",
    answer:
      "Monday 2PM to 7PM, Tuesday through Friday 11AM to 7PM, Saturday 12PM to 7PM. We're closed on Sundays.",
  },
  {
    question: "Can I schedule a test drive?",
    answer:
      "Yes. You can schedule a test drive by calling us at (630) 359-3643 or by using the contact form on any vehicle listing page. Walk-ins are always welcome too.",
  },
  {
    question: "Do you provide vehicle history reports?",
    answer:
      "Yes. We can provide a vehicle history report for any vehicle on our lot. Just ask when you visit or call us.",
  },
  {
    question: "How do you price your vehicles?",
    answer:
      "Our prices are competitive and clearly listed. We research the market to make sure you're getting a fair deal. The price you see is the price you pay. No hidden fees, no bait-and-switch.",
  },
  {
    question: "Can I buy a vehicle online and have it delivered?",
    answer:
      "We prefer you come see the vehicle in person before purchasing, but we're happy to work with out-of-area buyers on a case-by-case basis. Give us a call to discuss options.",
  },
  {
    question: "What do I need to bring to purchase a vehicle?",
    answer:
      "Bring a valid driver's license and proof of insurance. If you're financing, we'll walk you through any additional paperwork. If you're paying cash or with a cashier's check, that's all you need.",
  },
];

export default function FAQPage() {
  // FAQ structured data for Google rich results
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <section className="bg-brand-navy text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">
            Frequently Asked Questions
          </h1>
          <p className="mt-4 text-lg text-brand-gray-300">
            Everything you need to know about buying from Love Auto Group
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="bg-white rounded-xl border border-brand-gray-200 p-6"
            >
              <h2 className="text-lg font-bold text-brand-gray-900">
                {faq.question}
              </h2>
              <p className="mt-3 text-brand-gray-600 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-16 bg-brand-red rounded-2xl p-8 md:p-12 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            Still Have Questions?
          </h2>
          <p className="text-red-100 mb-6 max-w-xl mx-auto">
            We're happy to help. Give us a call or send us a message.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center bg-white text-brand-red px-8 py-3 rounded-xl font-bold hover:bg-brand-gray-100 transition-colors"
            >
              Contact Us
            </Link>
            <a
              href={`tel:${SITE_CONFIG.phoneRaw}`}
              className="inline-flex items-center justify-center border-2 border-white/30 hover:bg-white/10 text-white px-8 py-3 rounded-xl font-semibold transition-colors"
            >
              Call {SITE_CONFIG.phone}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
