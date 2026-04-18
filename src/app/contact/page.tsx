import type { Metadata } from "next";
import StructuredData from "@/components/StructuredData";

// ============================================================================
// Contact Page — Form, Address, Hours, and Directions
// ============================================================================

export const metadata: Metadata = {
  title: "Contact Love Auto Group | Used Car Dealer Villa Park IL | (630) 359-3643",
  description:
    "Contact Love Auto Group at (630) 359-3643 or visit us at 735 N Yale Ave, Villa Park, IL 60181. Get directions, hours, and send us a message.",
  openGraph: {
    title: "Contact Love Auto Group | Villa Park IL",
    description:
      "Call (630) 359-3643 or visit 735 N Yale Ave, Villa Park, IL 60181. We are here to help you find your next used car.",
    type: "website",
  },
};

const contactJsonLd = {
  "@context": "https://schema.org",
  "@type": "AutoDealer",
  name: "Love Auto Group",
  address: {
    "@type": "PostalAddress",
    streetAddress: "735 N Yale Ave",
    addressLocality: "Villa Park",
    addressRegion: "IL",
    postalCode: "60181",
    addressCountry: "US",
  },
  telephone: "(630) 359-3643",
  email: "loveautogroup@gmail.com",
  url: "https://www.loveautogroup.com",
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      opens: "09:00",
      closes: "19:00",
    },
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: "Saturday",
      opens: "09:00",
      closes: "17:00",
    },
  ],
};

export default function ContactPage() {
  return (
    <>
      <StructuredData data={contactJsonLd} />

      {/* Hero */}
      <section className="bg-[#1B4F72] text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Contact Love Auto Group
          </h1>
          <p className="text-lg text-blue-100">
            We are here to help. Reach out by phone, email, or visit our Villa Park dealership.
          </p>
        </div>
      </section>

      {/* Contact Info + Form Grid */}
      <section className="py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold text-[#1B4F72] mb-6">
              Send Us a Message
            </h2>
            <form className="space-y-5">
              <div>
                <label
                  htmlFor="contact-name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="contact-name"
                  name="name"
                  required
                  autoComplete="name"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4F72] focus:border-transparent"
                  placeholder="John Smith"
                />
              </div>
              <div>
                <label
                  htmlFor="contact-email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="contact-email"
                  name="email"
                  required
                  autoComplete="email"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4F72] focus:border-transparent"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label
                  htmlFor="contact-phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="contact-phone"
                  name="phone"
                  autoComplete="tel"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4F72] focus:border-transparent"
                  placeholder="(630) 000-0000"
                />
              </div>
              <div>
                <label
                  htmlFor="contact-message"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="contact-message"
                  name="message"
                  required
                  rows={5}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#1B4F72] focus:border-transparent resize-y"
                  placeholder="Tell us how we can help — ask about a vehicle, financing, or schedule a visit."
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto bg-[#1B4F72] text-white font-semibold px-8 py-3 rounded-lg hover:bg-[#154360] transition-colors"
              >
                Send Message
              </button>
            </form>
          </div>

          {/* Contact Details */}
          <div className="space-y-8">
            {/* Address & Phone */}
            <div>
              <h2 className="text-2xl font-bold text-[#1B4F72] mb-6">
                Dealership Info
              </h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#1B4F72] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-800">Address</p>
                    <p className="text-gray-600">735 N Yale Ave</p>
                    <p className="text-gray-600">Villa Park, IL 60181</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#1B4F72] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-800">Phone</p>
                    <a
                      href="tel:+16303593643"
                      className="text-[#1B4F72] hover:underline"
                    >
                      (630) 359-3643
                    </a>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-[#1B4F72] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-gray-800">Email</p>
                    <a
                      href="mailto:loveautogroup@gmail.com"
                      className="text-[#1B4F72] hover:underline"
                    >
                      loveautogroup@gmail.com
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div>
              <h3 className="text-xl font-bold text-[#1B4F72] mb-4">
                Business Hours
              </h3>
              <div className="bg-gray-50 rounded-lg p-5 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-700">Monday - Friday</span>
                  <span className="font-medium text-gray-800">9:00 AM - 7:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Saturday</span>
                  <span className="font-medium text-gray-800">9:00 AM - 5:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700">Sunday</span>
                  <span className="font-medium text-gray-800">Closed</span>
                </div>
              </div>
            </div>

            {/* Map Placeholder */}
            <div>
              <h3 className="text-xl font-bold text-[#1B4F72] mb-4">
                Find Us on the Map
              </h3>
              <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <svg className="w-12 h-12 mx-auto mb-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  <p className="font-medium">Interactive Map</p>
                  <a
                    href="https://www.google.com/maps/place/735+N+Yale+Ave,+Villa+Park,+IL+60181"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#1B4F72] hover:underline text-sm"
                  >
                    View on Google Maps
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Driving Directions */}
      <section className="bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1B4F72] mb-8 text-center">
            Driving Directions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg text-[#1B4F72] mb-2">
                From I-290 (Eisenhower Expressway)
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Exit at Route 83 (Kingery Highway). Head south on Route 83 to Roosevelt Road. Turn west (right) on Roosevelt Road, then turn north (right) on Yale Ave. The dealership is on the right.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg text-[#1B4F72] mb-2">
                From I-355 (Veterans Memorial Tollway)
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Exit at Roosevelt Road and head east. Continue east on Roosevelt Road through Glen Ellyn and Lombard. Turn north (left) on Yale Ave. The dealership is on the right.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg text-[#1B4F72] mb-2">
                From I-88 (Reagan Memorial Tollway)
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Exit at Route 83 and head north. Continue north on Route 83 to Roosevelt Road. Turn west (left) on Roosevelt Road, then turn north (right) on Yale Ave. We are on the right side.
              </p>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h3 className="font-semibold text-lg text-[#1B4F72] mb-2">
                From North Avenue (Route 64)
              </h3>
              <p className="text-gray-600 text-sm leading-relaxed">
                Head south on Addison Road or Route 83 to Roosevelt Road. Turn west on Roosevelt Road and then north on Yale Ave. The dealership is just a block north of Roosevelt Road on the right.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
