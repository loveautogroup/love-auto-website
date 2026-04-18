import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'FAQ',
  description:
    'Frequently asked questions about buying a used car from Love Auto Group in Villa Park, IL. Financing, trade-ins, warranties, and more.',
};

const faqs = [
  {
    q: 'Do you offer financing?',
    a: 'Yes. We work with multiple lenders to find competitive rates for all credit situations. You can apply for pre-approval right on our website and it will not affect your credit score.',
  },
  {
    q: 'Are your vehicles inspected before sale?',
    a: 'Every vehicle is thoroughly inspected and fully reconditioned by our in-house team before it goes on the lot. We do not sell vehicles with hidden problems.',
  },
  {
    q: 'Do you accept trade-ins?',
    a: 'Absolutely. We will give you a fair market offer on your trade-in. You can submit your vehicle details on our Sell Your Car page or bring it by the lot for an in-person appraisal.',
  },
  {
    q: 'What brands do you specialize in?',
    a: 'We focus on quality Japanese makes like Lexus, Subaru, Acura, and Mazda because of their reliability and long-term value. We also carry other makes when we find the right vehicles.',
  },
  {
    q: 'Can I schedule a test drive?',
    a: 'Yes. You can schedule a test drive from any vehicle page on our website, or just give us a call and we will have the car ready when you arrive.',
  },
  {
    q: 'Do you offer warranties?',
    a: 'We offer extended warranty options on most of our vehicles. Ask us about available coverage when you visit.',
  },
  {
    q: 'What are your hours?',
    a: 'Monday 2-7pm, Tuesday through Friday 11am-7pm, Saturday 12-7pm. We are closed on Sundays.',
  },
  {
    q: 'Where are you located?',
    a: `We are at ${SITE_CONFIG.address.full}, in the heart of DuPage County. Easy to reach from Elmhurst, Lombard, Addison, and surrounding areas.`,
  },
];

/* JSON-LD FAQ schema */
function FAQSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
  );
}

export default function FAQPage() {
  return (
    <>
      <FAQSchema />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 md:py-20">
        <h1
          className="text-3xl md:text-4xl font-bold text-gray-900"
          style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}
        >
          Frequently Asked Questions
        </h1>
        <p className="mt-2 text-gray-500">
          Everything you need to know about buying from Love Auto Group.
        </p>

        <div className="mt-10 space-y-6">
          {faqs.map((faq, i) => (
            <div key={i} className="border-b border-gray-200 pb-6 last:border-0">
              <h2 className="font-semibold text-gray-900 text-lg">{faq.q}</h2>
              <p className="mt-2 text-gray-600 leading-relaxed">{faq.a}</p>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-gray-50 border border-gray-200 rounded-xl p-6 text-center">
          <p className="font-semibold text-gray-900">Still have questions?</p>
          <p className="text-gray-500 text-sm mt-1">
            Give us a call at{' '}
            <a href={`tel:${SITE_CONFIG.phoneRaw}`} className="text-red-600 font-semibold hover:text-red-700">
              {SITE_CONFIG.phone}
            </a>{' '}
            or visit us at the lot.
          </p>
        </div>
      </div>
    </>
  );
}
