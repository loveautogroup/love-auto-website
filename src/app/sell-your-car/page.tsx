import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Sell Your Car',
  description:
    'Sell your car to Love Auto Group. Get a fair offer with no hassle. We buy quality used vehicles in Villa Park, IL.',
};

export default function SellYourCarPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-20">
      <div className="text-center mb-12">
        <h1
          className="text-3xl md:text-4xl font-bold text-gray-900"
          style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}
        >
          Sell Your Car to Love Auto Group
        </h1>
        <p className="mt-3 text-gray-500 text-lg max-w-2xl mx-auto">
          Fair offers, no hassle. Tell us about your vehicle and we will get back
          to you with an offer, usually within a few hours.
        </p>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">
        <form className="space-y-5">
          <h2 className="font-bold text-gray-900 text-lg mb-2" style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>
            Vehicle Information
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input type="number" id="year" name="year" min="1990" max="2026" required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:ring-red-500" />
            </div>
            <div>
              <label htmlFor="make" className="block text-sm font-medium text-gray-700 mb-1">Make</label>
              <input type="text" id="make" name="make" required placeholder="e.g., Subaru"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:ring-red-500" />
            </div>
            <div>
              <label htmlFor="model" className="block text-sm font-medium text-gray-700 mb-1">Model</label>
              <input type="text" id="model" name="model" required placeholder="e.g., Forester"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:ring-red-500" />
            </div>
            <div>
              <label htmlFor="trim" className="block text-sm font-medium text-gray-700 mb-1">Trim</label>
              <input type="text" id="trim" name="trim" placeholder="e.g., Limited"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:ring-red-500" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="mileage" className="block text-sm font-medium text-gray-700 mb-1">Mileage</label>
              <input type="number" id="mileage" name="mileage" required placeholder="e.g., 68000"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:ring-red-500" />
            </div>
            <div>
              <label htmlFor="condition" className="block text-sm font-medium text-gray-700 mb-1">Condition</label>
              <select id="condition" name="condition" required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:ring-red-500">
                <option value="">Select condition</option>
                <option value="excellent">Excellent</option>
                <option value="good">Good</option>
                <option value="fair">Fair</option>
                <option value="poor">Poor</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">Additional Details (optional)</label>
            <textarea id="comments" name="comments" rows={3}
              placeholder="Any modifications, damage, or other details we should know about?"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:ring-red-500 resize-none" />
          </div>

          <hr className="border-gray-200" />

          <h2 className="font-bold text-gray-900 text-lg" style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>
            Your Contact Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input type="text" id="name" name="name" required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:ring-red-500" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" id="phone" name="phone" required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:ring-red-500" />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" id="email" name="email" required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:ring-red-500" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-lg text-base font-semibold transition-colors"
          >
            Get My Offer
          </button>
        </form>
      </div>

      <div className="mt-8 text-center">
        <p className="text-gray-500">
          Questions? Call us at{' '}
          <a href={`tel:${SITE_CONFIG.phoneRaw}`} className="text-red-600 font-semibold hover:text-red-700">
            {SITE_CONFIG.phone}
          </a>
        </p>
      </div>
    </div>
  );
}
