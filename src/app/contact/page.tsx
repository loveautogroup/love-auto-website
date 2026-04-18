import type { Metadata } from 'next';
import { SITE_CONFIG } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Contact Love Auto Group in Villa Park, IL. Call (630) 359-3643, visit us at 735 N Yale Ave, or send us a message.',
};

export default function ContactPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 md:py-20">
      <h1
        className="text-3xl md:text-4xl font-bold text-gray-900"
        style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}
      >
        Contact Us
      </h1>
      <p className="mt-2 text-gray-500 text-lg">
        We would love to hear from you. Reach out anytime.
      </p>

      <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Contact form */}
        <div>
          <h2 className="font-bold text-gray-900 text-xl mb-6" style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>
            Send Us a Message
          </h2>
          <form className="space-y-5">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              <input
                type="text" id="name" name="name" required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:ring-red-500"
                placeholder="Your name"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel" id="phone" name="phone" required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="(555) 123-4567"
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email" id="email" name="email" required
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:ring-red-500"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                id="message" name="message" rows={5} required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-red-500 focus:ring-red-500 resize-none"
                placeholder="How can we help you?"
              />
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto bg-red-600 hover:bg-red-700 text-white px-8 py-3 rounded-lg text-sm font-semibold transition-colors"
            >
              Send Message
            </button>
          </form>
        </div>

        {/* Contact info + map */}
        <div>
          <h2 className="font-bold text-gray-900 text-xl mb-6" style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>
            Find Us
          </h2>

          <div className="space-y-4 mb-8">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">Address</p>
                <p className="text-gray-600 text-sm">{SITE_CONFIG.address.full}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">Phone</p>
                <a href={`tel:${SITE_CONFIG.phoneRaw}`} className="text-red-600 hover:text-red-700 text-sm">{SITE_CONFIG.phone}</a>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium text-gray-900">Business Hours</p>
                <div className="text-sm text-gray-600 space-y-0.5 mt-1">
                  {Object.entries(SITE_CONFIG.hours).map(([day, hours]) => (
                    <div key={day} className="flex gap-4">
                      <span className="capitalize w-24">{day}</span>
                      <span className={hours === 'Closed' ? 'text-red-500' : ''}>{hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Map placeholder */}
          <div className="aspect-[4/3] bg-gray-200 rounded-xl overflow-hidden flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm">Google Maps embed</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
