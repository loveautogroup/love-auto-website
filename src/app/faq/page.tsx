import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";

// ============================================================================
// FAQ Page — Used Car Buying Questions with JSON-LD Structured Data
// ============================================================================

export const metadata: Metadata = {
  title: "FAQ | Used Car Buying Questions | Love Auto Group Villa Park IL",
  description:
    "Answers to common questions about buying used cars, financing, trade-ins, and test drives at Love Auto Group in Villa Park, IL.",
  openGraph: {
    title: "Frequently Asked Questions | Love Auto Group",
    description:
      "Find answers about used car financing, trade-ins, inspections, and more at Love Auto Group Villa Park.",
    type: "website",
  },
};

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: "What types of vehicles does Love Auto Group sell?",
    answer:
      "We carry a wide selection of pre-owned cars, trucks, SUVs, and minivans from popular brands like Toyota, Honda, Ford, Chevrolet, Hyundai, and more. Our inventory changes frequently, so check our online listings or call (630) 359-3643 for the latest availability.",
  },
  {
    question: "Do you offer financing for used cars?",
    answer:
      "Yes. We work with multiple banks and credit unions to find you the best rate and terms available. We submit your application to several lenders at once so you get competitive offers without having to shop around yourself.",
  },
  {
    question: "Which banks and credit unions do you work with?",
    answer:
      "We partner with a network of trusted local and national banks as well as credit unions. Our relationships with multiple lenders allow us to find financing options for a wide range of credit profiles. Ask our team for specific lender details.",
  },
  {
    question: "Can I get financing if my credit is not perfect?",
    answer:
      "Yes. Because we work with multiple lenders, we can often find financing solutions for customers who are rebuilding their credit or are first-time buyers. Our finance team will work with you to explore all available options.",
  },
  {
    question: "Will applying for financing affect my credit score?",
    answer:
      "Our initial pre-approval process is designed to give you an idea of your options. When you decide to move forward, the lender will run a standard credit inquiry as part of the loan approval process. Our team can explain exactly what to expect at each step.",
  },
  {
    question: "How much of a down payment do I need?",
    answer:
      "Down payment requirements vary depending on the vehicle and financing option. We try to keep down payments as affordable as possible and can work with you to find a plan that fits your budget. Call us at (630) 359-3643 to discuss your specific situation.",
  },
  {
    question: "Do you accept trade-ins?",
    answer:
      "Yes, we accept trade-ins. Bring your vehicle to our lot at 735 N Yale Ave, Villa Park, and we will give you a fair appraisal. The trade-in value can be applied toward your down payment or the purchase price of your next vehicle.",
  },
  {
    question: "Can I test drive a vehicle before buying?",
    answer:
      "Of course. We encourage every customer to take a test drive before making a decision. Just bring a valid driver license and proof of insurance. You can walk in during business hours or call ahead to schedule an appointment.",
  },
  {
    question: "Are your vehicles inspected before sale?",
    answer:
      "Yes. Every vehicle on our lot goes through a thorough inspection to check for mechanical issues, safety concerns, and cosmetic condition. We want you to drive away with confidence, knowing your car is safe and reliable.",
  },
  {
    question: "Do you offer any warranties on used cars?",
    answer:
      "Some vehicles may come with remaining manufacturer warranty coverage. We also offer optional extended warranty plans for additional peace of mind. Ask our team about warranty options for the specific vehicle you are interested in.",
  },
  {
    question: "What documents do I need to buy a car?",
    answer:
      "You will need a valid driver license, proof of income (such as recent pay stubs), proof of residence (a utility bill or bank statement), and proof of auto insurance. For financing, additional documents may be required depending on the lender.",
  },
  {
    question: "Can I purchase a vehicle online or over the phone?",
    answer:
      "You can start the process online by browsing our inventory and submitting a financing pre-approval application. However, we recommend visiting our dealership in person to inspect and test drive the vehicle before completing the purchase.",
  },
  {
    question: "Where is Love Auto Group located?",
    answer:
      "We are located at 735 N Yale Ave, Villa Park, IL 60181. We are easily accessible from Lombard, Addison, Elmhurst, Glen Ellyn, Wheaton, Oak Brook, and other DuPage County communities. We are just off Roosevelt Road near Route 83.",
  },
  {
    question: "What are your business hours?",
    answer:
      "We are open Monday through Saturday. Hours may vary, so please call us at (630) 359-3643 or check our website for the most up-to-date schedule. We are happy to accommodate appointments outside regular hours when possible.",
  },
  {
    question: "How do I get pre-approved for financing?",
    answer:
      "You can fill out our online pre-approval form on our financing page. Just provide your basic contact information, credit range, monthly budget, and the type of vehicle you are looking for. Our team will reach out within one business day with your options.",
  },
];

// Build FAQ JSON-LD structured data
const faqJsonLd = {
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

export default function FaqPage() {
  return (
    <>
      <StructuredData data={faqJsonLd} />

      {/* Hero */}
      <section className="bg-[#1B4F72] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-lg text-blue-100">
            Answers to common questions about buying a used car at Love Auto Group in Villa Park, IL.
          </p>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          {faqs.map((faq, index) => (
            <details
              key={index}
              className="group border-b border-gray-200 py-2"
            >
              <summary className="flex items-center justify-between cursor-pointer py-4 text-left">
                <h2 className="text-lg font-semibold text-[#1B4F72] pr-4">
                  {faq.question}
                </h2>
                <span className="text-[#1B4F72] text-2xl font-light flex-shrink-0 group-open:rotate-45 transition-transform duration-200">
                  +
                </span>
              </summary>
              <p className="text-gray-700 leading-relaxed pb-4 pl-0 sm:pl-2">
                {faq.answer}
              </p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-[#1B4F72] mb-4">
            Still Have Questions?
          </h2>
          <p className="text-gray-600 mb-6">
            Our team is happy to help. Give us a call or stop by the dealership.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="tel:+16303593643"
              className="inline-block bg-[#1B4F72] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[#154360] transition-colors"
            >
              Call (630) 359-3643
            </a>
            <a
              href="/contact"
              className="inline-block border-2 border-[#1B4F72] text-[#1B4F72] font-semibold px-8 py-3 rounded-lg hover:bg-[#1B4F72] hover:text-white transition-colors"
            >
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
