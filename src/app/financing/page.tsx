import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Financing',
  description:
    'Get pre-approved for auto financing in minutes. Love Auto Group works with multiple lenders to find the best rate for your situation.',
};

export default function FinancingPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 md:py-20">
      <div className="text-center mb-12">
        <h1
          className="text-3xl md:text-4xl font-bold text-gray-900"
          style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}
        >
          Get Pre-Approved in Minutes
        </h1>
        <p className="mt-3 text-gray-500 text-lg max-w-2xl mx-auto">
          Quick, easy, and it will not affect your credit score. We work with multiple
          lenders to find the best rate for your situation.
        </p>
      </div>

      {/* Trust signals */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { icon: '🔒', title: 'Secure & Encrypted', desc: 'Your information is protected' },
          { icon: '✓', title: 'No Obligation', desc: 'See your options with no commitment' },
          { icon: '⚡', title: 'Quick Decision', desc: 'Get a response within hours' },
        ].map((item) => (
          <div key={item.title} className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-center">
            <span className="text-2xl">{item.icon}</span>
            <p className="font-semibold text-gray-900 text-sm mt-2">{item.title}</p>
            <p className="text-gray-500 text-xs mt-1">{item.desc}</p>
          </div>
        ))}
      </div>

      {/* Form */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 md:p-8 shadow-sm">
        <h2 className="font-bold text-gray-900 text-xl mb-6" style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>
          Pre-Approval Application
        </h2>
        <form className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input type="text" id="fullName" name="fullName" required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:ring-red-500" />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input type="tel" id="phone" name="phone" required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:ring-red-500" />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input type="email" id="email" name="email" required
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:ring-red-500" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="creditRange" className="block text-sm font-medium text-gray-700 mb-1">Estimated Credit Score</label>
              <select id="creditRange" name="creditRange"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:ring-red-500">
                <option value="">Select range</option>
                <option value="excellent">Excellent (720+)</option>
                <option value="good">Good (660-719)</option>
                <option value="fair">Fair (600-659)</option>
                <option value="poor">Needs Work (below 600)</option>
                <option value="no_credit">No Credit History</option>
              </select>
            </div>
            <div>
              <label htmlFor="monthlyBudget" className="block text-sm font-medium text-gray-700 mb-1">Monthly Budget</label>
              <select id="monthlyBudget" name="monthlyBudget"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:ring-red-500">
                <option value="">Select range</option>
                <option value="200">Up to $200/mo</option>
                <option value="300">$200-$300/mo</option>
                <option value="400">$300-$400/mo</option>
                <option value="500">$400-$500/mo</option>
                <option value="500+">$500+/mo</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="vehicleInterest" className="block text-sm font-medium text-gray-700 mb-1">Vehicle of Interest (optional)</label>
            <input type="text" id="vehicleInterest" name="vehicleInterest"
              placeholder="e.g., 2019 Lexus RX 350"
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:ring-red-500" />
          </div>

          <button
            type="submit"
            className="w-full bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-lg text-base font-semibold transition-colors"
          >
            Submit Pre-Approval Application
          </button>

          <p className="text-xs text-gray-400 text-center">
            By submitting this form, you agree to be contacted by Love Auto Group regarding your financing inquiry.
            Your information is secure and will not be shared with third parties.
          </p>
        </form>
      </div>

      {/* Call CTA */}
      <div className="mt-8 text-center">
        <p className="text-gray-500">
          Prefer to talk? Call us at{' '}
          <a href={`tel:${SITE_CONFIG.phoneRaw}`} className="text-red-600 font-semibold hover:text-red-700">
            {SITE_CONFIG.phone}
          </a>
        </p>
      </div>
    </div>
  );
}
