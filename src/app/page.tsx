import Link from 'next/link';
import VehicleCard from '@/components/ui/VehicleCard';
import { FEATURED_VEHICLES } from '@/data/featured-vehicles';
import { SITE_CONFIG, TRUST_PILLARS } from '@/lib/constants';

/* ── Icon helper ────────────────────────────────────────────── */
function TrustIcon({ icon }: { icon: string }) {
  const cls = 'w-8 h-8 text-red-600';
  if (icon === 'shield-check') {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    );
  }
  if (icon === 'tag') {
    return (
      <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
      </svg>
    );
  }
  return (
    <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );
}

/* ── Star rating ────────────────────────────────────────────── */
function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          className={`w-5 h-5 ${i <= Math.round(rating) ? 'text-yellow-400' : 'text-gray-300'}`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      ))}
    </div>
  );
}

/* ── Page ───────────────────────────────────────────────────── */
export default function HomePage() {
  return (
    <>
      {/* ═══════ HERO ═══════ */}
      <section className="relative bg-gray-900 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(circle at 25% 50%, #dc2626 0%, transparent 50%), radial-gradient(circle at 75% 50%, #dc2626 0%, transparent 50%)',
            }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 md:py-28 lg:py-36">
          <div className="max-w-2xl">
            <p className="text-red-400 font-semibold text-sm uppercase tracking-wider mb-3">
              Villa Park, IL
            </p>
            <h1
              className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight"
              style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}
            >
              Quality Vehicles You Can{' '}
              <span className="text-red-500">Trust</span>
            </h1>
            <p className="mt-5 text-lg text-gray-300 leading-relaxed max-w-xl">
              Every vehicle at Love Auto Group is carefully selected, fully reconditioned,
              and thoroughly inspected. Family owned since 2014, we make buying a used
              car simple, honest, and stress-free.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <Link
                href="/inventory"
                className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-lg text-base font-semibold transition-colors"
              >
                Browse Inventory
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
              <Link
                href="/financing"
                className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white px-8 py-3.5 rounded-lg text-base font-semibold border border-white/20 transition-colors"
              >
                Get Pre-Approved
              </Link>
            </div>

            <div className="mt-10 flex items-center gap-4 text-sm text-gray-400">
              <Stars rating={SITE_CONFIG.googleReviews.rating} />
              <span>
                <strong className="text-white">{SITE_CONFIG.googleReviews.rating}</strong> from{' '}
                {SITE_CONFIG.googleReviews.count}+ Google reviews
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ QUICK SEARCH BAR ═══════ */}
      <section className="relative -mt-6 z-10 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-6">
          <form action="/inventory" method="GET" className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <select name="make" className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 focus:border-red-500 focus:ring-red-500" defaultValue="">
              <option value="">Any Make</option>
              <option>Lexus</option>
              <option>Subaru</option>
              <option>Acura</option>
              <option>Mazda</option>
              <option>Toyota</option>
              <option>Honda</option>
            </select>
            <select name="maxPrice" className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 focus:border-red-500 focus:ring-red-500" defaultValue="">
              <option value="">Any Price</option>
              <option value="10000">Under $10,000</option>
              <option value="15000">Under $15,000</option>
              <option value="20000">Under $20,000</option>
              <option value="25000">Under $25,000</option>
            </select>
            <select name="bodyStyle" className="block w-full rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-700 focus:border-red-500 focus:ring-red-500" defaultValue="">
              <option value="">Any Style</option>
              <option>Sedan</option>
              <option>SUV</option>
              <option>Truck</option>
              <option>Coupe</option>
              <option>Hatchback</option>
            </select>
            <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg px-6 py-3 text-sm transition-colors flex items-center justify-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search
            </button>
          </form>
        </div>
      </section>

      {/* ═══════ FEATURED VEHICLES ═══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>
              Featured Vehicles
            </h2>
            <p className="mt-2 text-gray-500">Hand-picked from our current inventory</p>
          </div>
          <Link href="/inventory" className="hidden sm:flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
            View All
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED_VEHICLES.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} />
          ))}
        </div>
        <div className="mt-8 text-center sm:hidden">
          <Link href="/inventory" className="inline-flex items-center gap-1 text-sm font-semibold text-red-600">
            View All Inventory
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ═══════ TRUST PILLARS ═══════ */}
      <section className="bg-gray-50 border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 text-center mb-12" style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>
            Why Love Auto Group?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {TRUST_PILLARS.map((pillar) => (
              <div key={pillar.title} className="text-center">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-red-50 rounded-2xl mb-4">
                  <TrustIcon icon={pillar.icon} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2" style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>
                  {pillar.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════ GOOGLE REVIEWS ═══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>
            What Our Customers Say
          </h2>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Stars rating={SITE_CONFIG.googleReviews.rating} />
            <span className="text-sm text-gray-500">
              {SITE_CONFIG.googleReviews.rating} stars from {SITE_CONFIG.googleReviews.count}+ reviews on Google
            </span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Michael R.', text: 'Best car buying experience I have ever had. Jeremiah was upfront about everything and the car was in amazing condition. No pressure, no games. I will be back for my next vehicle.', date: 'March 2026' },
            { name: 'Sarah K.', text: 'Bought a Subaru Forester and it was exactly as described. You can tell they put real work into reconditioning their cars. The whole process was quick and straightforward.', date: 'February 2026' },
            { name: 'David L.', text: 'Family owned and it shows. They treated us like neighbors, not just customers. Fair price, clean vehicle, no hidden fees. Already recommended them to two friends.', date: 'January 2026' },
          ].map((review) => (
            <div key={review.name} className="bg-white border border-gray-200 rounded-xl p-6">
              <Stars rating={5} />
              <p className="mt-4 text-gray-600 text-sm leading-relaxed">&ldquo;{review.text}&rdquo;</p>
              <div className="mt-4 flex items-center gap-2">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-semibold text-xs">{review.name.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{review.name}</p>
                  <p className="text-xs text-gray-400">{review.date}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════ FINANCING CTA ═══════ */}
      <section className="bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl md:text-3xl font-bold text-white" style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>
              Get Pre-Approved in Minutes
            </h2>
            <p className="mt-3 text-gray-400 leading-relaxed">
              Quick, easy, and it will not affect your credit score. We work with multiple lenders to find the best rate for your situation.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-3">
              <Link href="/financing" className="inline-flex items-center justify-center bg-red-600 hover:bg-red-700 text-white px-8 py-3.5 rounded-lg text-base font-semibold transition-colors">
                Apply for Financing
              </Link>
              <a href={`tel:${SITE_CONFIG.phoneRaw}`} className="inline-flex items-center justify-center bg-white/10 hover:bg-white/20 text-white px-8 py-3.5 rounded-lg text-base font-semibold border border-white/20 transition-colors">
                Call {SITE_CONFIG.phone}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ LOCATION & HOURS ═══════ */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-montserrat), sans-serif' }}>
              Visit Us in Villa Park
            </h2>
            <p className="mt-3 text-gray-500 leading-relaxed">
              Located on Yale Avenue in Villa Park, just minutes from Elmhurst, Lombard, and Addison. Stop by for a test drive or just to see what we have on the lot.
            </p>
            <div className="mt-6 space-y-3">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-600 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-gray-700">{SITE_CONFIG.address.full}</span>
              </div>
              <div className="flex items-center gap-3">
                <svg className="w-5 h-5 text-red-600 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <a href={`tel:${SITE_CONFIG.phoneRaw}`} className="text-gray-700 hover:text-red-600 transition-colors font-medium">{SITE_CONFIG.phone}</a>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="font-semibold text-gray-900 mb-2">Hours</h3>
              <div className="space-y-1 text-sm">
                {Object.entries(SITE_CONFIG.hours).map(([day, hours]) => (
                  <div key={day} className="flex justify-between max-w-xs">
                    <span className="text-gray-500 capitalize">{day}</span>
                    <span className={hours === 'Closed' ? 'text-red-500 font-medium' : 'text-gray-700'}>{hours}</span>
                  </div>
                ))}
              </div>
            </div>
            <Link href="/contact" className="inline-flex items-center gap-2 mt-6 text-sm font-medium text-red-600 hover:text-red-700 transition-colors">
              Get Directions
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </Link>
          </div>
          <div className="aspect-[4/3] bg-gray-200 rounded-xl overflow-hidden flex items-center justify-center">
            <div className="text-center text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="text-sm">Google Maps embed goes here</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
