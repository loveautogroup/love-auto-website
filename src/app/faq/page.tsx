import type { Metadata } from "next";
import { FAQHero, FAQCta } from "./FAQHero";

export const metadata: Metadata = {
  title: "Used Car FAQ, Financing and Trade-Ins | Love Auto Group",
  description:
    "Questions about dealer fees, financing, trade-ins and warranties at Love Auto Group in Villa Park, IL. Get the answers before you visit.",
  alternates: { canonical: "https://www.loveautogroup.net/faq/" },
};

const faqs = [
  {
    question: "What types of vehicles does Love Auto Group sell?",
    answer:
      "We're a family-owned independent used car dealer in Villa Park, IL. We focus on Japanese makes like Lexus, Subaru, Acura, Honda, Toyota and Mazda, and we also carry other makes. Most of our cars are priced between $4,500 and $20,000.",
  },
  {
    question: "Do you offer financing?",
    answer:
      "Yes. Many of our buyers finance through their own bank or credit union. We can also send your application to a lender we work with, including for buyers with less-than-perfect credit. You can apply for financing right on our website.",
  },
  {
    question: "Can I trade in my current vehicle?",
    answer:
      "Absolutely. We accept trade-ins and also buy vehicles outright, even if you're not purchasing from us. Visit our Sell Your Car page or stop by the lot for a fair offer.",
  },
  {
    question: "Do your cars come with a warranty?",
    answer:
      "Cars with under 150,000 miles come with a warranty. Cars with more than 150,000 miles are sold as-is. Ask us about the coverage on a specific car when you visit or call (630) 359-3643.",
  },
  {
    question: "Do you charge dealer fees?",
    answer:
      "No. You pay the listed price plus tax, title and license. We do not add a doc fee or any other dealer fee.",
  },
  {
    question: "Can I use my own bank or credit union?",
    answer:
      "Yes, and many of our buyers do. Get pre-approved with your bank or credit union, bring the approval with you and we will work with your lender to finish the sale.",
  },
  {
    question: "Where are you located?",
    answer:
      "We're at 735 N Yale Ave in Villa Park, IL 60181. Easy to get to from anywhere in the western suburbs and DuPage County.",
  },
  {
    question: "What are your business hours?",
    answer:
      "Tuesday through Saturday, 2PM to 6PM. We're closed on Sundays and Mondays. Appointments are available outside of office hours, so call 630-359-3643 to set one up.",
  },
  {
    question: "Can I schedule a test drive?",
    answer:
      "Yes. You can schedule a test drive by calling us at (630) 359-3643 or by using the contact form on any vehicle listing page. Walk-ins are welcome during business hours too.",
  },
  {
    question: "Do you provide vehicle history reports?",
    answer:
      "Yes. Cars that show the CARFAX badge on their page come with a free CARFAX report you can open right there. For any other car on our lot, just ask and we will provide a vehicle history report.",
  },
  {
    question: "How do you price your vehicles?",
    answer:
      "We price every car against what similar cars are selling for in the area, and the price is listed on every car's page. You pay that price plus tax, title and license. There are no dealer fees and no hidden charges.",
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
  {
    question: "Why does Love Auto Group focus on Japanese makes?",
    answer:
      "Japanese makes like Lexus, Subaru, Acura, Honda and Mazda consistently rank high in reliability and hold their value well over time. Over a decade of buying and selling these specific brands, we've learned exactly what to look for and what to avoid on each model. That expertise lets us price competitively and stand behind every vehicle with confidence.",
  },
  {
    question: "Do you have AWD cars for Illinois winters?",
    answer:
      "Yes. AWD SUVs and wagons are a big part of what we stock. Subaru Forester and Outback, Acura MDX, Lexus RX 350, Honda CR-V and Mazda CX-5 are regulars on our lot. Check the current inventory on our website or call us at (630) 359-3643 to ask what's coming in.",
  },
  {
    question: "Can I return a car after I buy it in Illinois?",
    answer:
      "Illinois does not have an automatic right-to-return law for used car purchases. Once you sign the paperwork, the vehicle is yours. We encourage every buyer to take their time, test drive thoroughly, ask for a pre-purchase inspection if you want one and never sign anything you don't fully understand. If you have questions, we'll answer them before the sale, not after.",
  },
  {
    question: "Can you help me find a specific car that's not in your inventory?",
    answer:
      "Yes. If you're looking for a specific make, model, or feature set we don't currently have, let us know. We buy cars every week and can often find what you're looking for. Call (630) 359-3643 or use our contact form to tell us what you want.",
  },
  {
    question: "How long does the buying process take?",
    answer:
      "If you're paying cash or bringing your own financing, the paperwork takes about an hour from start to drive-away. If we are arranging the financing, allow two to three hours to run the application, review the terms and finalize the deal. We work to make it as efficient as possible while making sure you understand every document before you sign.",
  },
  {
    question: "Do you sell vehicles with high mileage?",
    answer:
      "Yes, and we think it's a smart way to buy. A well-maintained vehicle at 150,000 to 200,000 miles often has another 100,000 miles of service life ahead. We can pull the Carfax so you can see the service history before you decide. The value is better than low-mileage alternatives for most buyers.",
  },
  {
    question: "Do you work with buyers who have bankruptcy or repossession on their credit?",
    answer:
      "Yes. Bankruptcy or repossession on your record doesn't automatically rule you out. Many buyers finance through their own bank or credit union, and we can also send your application to a lender that looks at challenged credit. A steady income, a down payment and an honest conversation about your situation go a long way. Start with our online credit application or call us directly.",
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

      <FAQHero />

      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="border-t border-ink-200">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border-b border-ink-200 py-6"
            >
              <h2 className="font-heading font-bold text-lg text-brand-gray-900">
                {faq.question}
              </h2>
              <p className="mt-3 text-brand-gray-600 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <FAQCta />
        </div>
      </section>
    </>
  );
}
