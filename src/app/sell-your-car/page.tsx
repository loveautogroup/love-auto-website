import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import { TrackedPhoneLink } from "@/components/TrackedLink";
import TradeInForm from "./TradeInForm";
import SellHero from "./SellHero";
import { FAQSchema } from "@/components/StructuredData";

const FAQS = [
  {
    question: "How does selling my car to Love Auto Group work?",
    answer:
      "Fill out the form with your VIN, mileage and photos. We review what you send and then call you to talk about an offer. If the offer works for you, we set a time for you to bring the car in.",
  },
  {
    question: "What kinds of cars do you look at?",
    answer:
      "We look at any make and model. We especially like Japanese makes such as Subaru, Lexus, Honda, Acura, Mazda and Toyota. Whether we make an offer depends on the car, its condition and what we see in the local market.",
  },
  {
    question: "Can I trade in my car instead of selling it?",
    answer:
      "Yes. If you are buying a car from us, the value of your trade can go toward the price. If you only want to sell, we can buy the car outright. Tell us which you prefer when we call.",
  },
  {
    question: "What should I bring when I come in?",
    answer:
      "Bring the title if you have it, a valid photo ID, all the keys you have and your loan payoff information if the car is financed. If you are missing something, call us before you come and we will tell you what to expect.",
  },
  {
    question: "Can I sell a car that still has a loan on it?",
    answer:
      "In many cases, yes. We can work with your lender to pay off the loan as part of the deal. Bring your lender name and a recent payoff amount, and we will walk you through how it works for your situation.",
  },
  {
    question: "Do I have to accept the offer?",
    answer:
      "No. Sending your car's details carries no obligation. You decide whether to move forward after we talk.",
  },
  {
    question: "Where are you located and when are you open?",
    answer:
      "We are at 735 N Yale Ave, Unit A, Villa Park, IL 60181. Our hours are Tuesday to Saturday, 2 to 6 PM. We are closed Sunday and Monday, and we can meet at other times by appointment. Call or text (630) 359-3643.",
  },
];

export const metadata: Metadata = {
  title: "Sell or Trade Your Car in Villa Park | Love Auto Group",
  description:
    "Sell or trade your car to Love Auto Group in Villa Park, IL. Send your VIN and photos, and we will review them and call you about an offer.",
  alternates: { canonical: "https://www.loveautogroup.net/sell-your-car/" },
};

export default function SellYourCarPage() {
  return (
    <>
      <FAQSchema items={FAQS} />
      <SellHero />

      <section className="max-w-4xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12">
          <TradeInForm />

          <div className="space-y-6">
            <div className="bg-white border border-ink-200 p-6">
              <h2 className="font-heading font-bold text-brand-gray-900 mb-3">
                Why Sell to Us?
              </h2>
              <ul className="space-y-3">
                {[
                  "Offers based on the local market",
                  "No obligation. Send your details and decide.",
                  "We call you after we review your photos",
                  "We handle all the paperwork",
                  "We look at any make and model",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2 text-sm text-brand-gray-700"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-brand-green shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-ink-200 p-6">
              <h3 className="font-heading font-bold text-brand-gray-900 mb-2">
                Prefer to Call?
              </h3>
              <p className="text-sm text-brand-gray-600 mb-3">
                We&apos;re happy to discuss your vehicle over the phone.
              </p>
              <TrackedPhoneLink
                location="sell_your_car"
                href={`tel:${SITE_CONFIG.phoneRaw}`}
                className="inline-flex items-center gap-2 text-brand-red hover:text-brand-red-dark font-semibold"
              >
                {SITE_CONFIG.phone}
              </TrackedPhoneLink>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto px-4 pb-16 text-brand-gray-700 leading-relaxed">
        <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-3">
          How Selling Your Car to Us Works
        </h2>
        <p className="mb-4">
          Love Auto Group is a family owned dealership at 735 N Yale Ave in
          Villa Park, IL, and we have been selling cars since 2014. When you
          sell or trade a car to us, you deal with the people who decide on
          the offer. There are three steps.
        </p>
        <ol className="list-decimal pl-6 space-y-2 mb-6">
          <li>
            <strong>Send your details.</strong> Use the form above to give us
            your VIN, your mileage and a few photos of the car.
          </li>
          <li>
            <strong>We review it.</strong> We look at the photos and the
            vehicle information and compare them to what we see in the local
            market.
          </li>
          <li>
            <strong>We call you about an offer.</strong> If it makes sense for
            both sides, we set a time for you to bring the car by.
          </li>
        </ol>

        <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-3">
          What We Buy
        </h2>
        <p className="mb-6">
          We look at any make and model. Japanese makes are what we know best,
          so Subaru, Lexus, Honda, Acura, Mazda and Toyota are the cars we
          are most likely to want. A car with high mileage or a mechanical
          problem is still worth sending us. Whether we make an offer depends
          on the car and its condition, and we will tell you plainly if it is
          not a fit for us.
        </p>

        <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-3">
          Trade In or Sell Outright
        </h2>
        <p className="mb-4">
          You have two options, and you can tell us which one you want when we
          call.
        </p>
        <ul className="list-disc pl-6 space-y-2 mb-6">
          <li>
            <strong>Trade in.</strong> If you are buying a car from our lot,
            the value of your trade goes toward the price of the car you
            choose, and it all happens in one visit. Buyers pay the price plus
            tax, title and license. We charge no dealer fees.
          </li>
          <li>
            <strong>Sell outright.</strong> If you only want to sell, we can
            buy your car without you buying one from us.
          </li>
        </ul>

        <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-3">
          What to Bring
        </h2>
        <ul className="list-disc pl-6 space-y-2 mb-4">
          <li>The title, if you have it in hand</li>
          <li>A valid photo ID</li>
          <li>All of the keys and remotes you have</li>
          <li>
            Your lender name and a recent payoff amount, if the car is
            financed
          </li>
        </ul>
        <p className="mb-6">
          If you do not have the title or you are not sure about something,
          call us first. We will tell you what to expect before you make the
          trip.
        </p>

        <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-3">
          If You Still Owe Money on the Car
        </h2>
        <p className="mb-6">
          A loan does not rule out a sale. In many cases we can work with your
          lender to pay off the balance as part of the deal. If the offer is
          more than the payoff, the difference goes to you. If it is less, you
          would need to cover the gap, and we will go over those numbers with
          you before anything is signed.
        </p>

        <h2 className="font-heading font-extrabold text-2xl text-brand-gray-900 mb-4">
          Frequently Asked Questions
        </h2>
        <div className="space-y-5 mb-8">
          {FAQS.map((f) => (
            <div key={f.question}>
              <h3 className="font-heading font-bold text-brand-gray-900 mb-1">
                {f.question}
              </h3>
              <p>{f.answer}</p>
            </div>
          ))}
        </div>

        <p>
          Prefer to talk first? Call or text{" "}
          <TrackedPhoneLink
            location="sell_your_car_content"
            href={`tel:${SITE_CONFIG.phoneRaw}`}
            className="text-brand-red hover:text-brand-red-dark font-semibold"
          >
            {SITE_CONFIG.phone}
          </TrackedPhoneLink>
          . We are open Tuesday to Saturday, 2 to 6 PM, closed Sunday and
          Monday. Other times by appointment. Illinois dealer license
          DL5428.
        </p>
      </section>
    </>
  );
}
