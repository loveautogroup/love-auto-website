import type { Metadata } from 'next';
import Link from 'next/link';
import { SITE_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Love Auto Group is a family owned used car dealership in Villa Park, IL. Since 2014, we have been providing quality, reconditioned vehicles to the DuPage County community.',
};

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-20">
      <h1
        className="text-3xl md:text-4xl font-bold text-gray-900"
        style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}
      >
        About Love Auto Group
      </h1>

      <div className="mt-8 prose prose-gray max-w-none">
        <p className="text-lg text-gray-600 leading-relaxed">
          Love Auto Group is a family owned used car dealership in Villa Park, Illinois.
          Since 2014, we have been serving the DuPage County community with one simple mission:
          provide quality vehicles that people can trust, at prices that are fair, with a
          buying experience that is honest and stress-free.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4" style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>
          Our Approach
        </h2>
        <p className="text-gray-600 leading-relaxed">
          Every vehicle on our lot is carefully selected from dealer-only channels. We focus
          on Japanese makes like Lexus, Subaru, Acura, and Mazda because these vehicles are
          known for reliability and long-term value. Once a vehicle arrives, our in-house team
          performs a full mechanical inspection and reconditioning before it ever meets a customer.
        </p>
        <p className="text-gray-600 leading-relaxed mt-4">
          We do not sell cars with hidden problems. We do not play pricing games. The price
          you see is the price you pay. We believe that treating people right is the best
          business strategy there is.
        </p>

        <h2 className="text-2xl font-bold text-gray-900 mt-10 mb-4" style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>
          Our Commitment
        </h2>
        <p className="text-gray-600 leading-relaxed">
          Carefully selected. Fully reconditioned. Thoroughly inspected. These are not just
          words on a wall. They describe exactly what happens to every vehicle before it earns
          a spot on our lot. We stand behind what we sell because our reputation depends on it,
          and in a small community like Villa Park, reputation is everything.
        </p>

        <div className="mt-10 bg-gray-50 border border-gray-200 rounded-xl p-6 md:p-8">
          <h3 className="font-bold text-gray-900 text-lg mb-2">Visit Us</h3>
          <p className="text-gray-600">
            {SITE_CONFIG.address.full}
          </p>
          <p className="text-gray-600 mt-1">
            Phone: <a href={`tel:${SITE_CONFIG.phoneRaw}`} className="text-red-600 hover:text-red-700">{SITE_CONFIG.phone}</a>
          </p>
          <div className="mt-4">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold transition-colors"
            >
              Contact Us
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
