import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";
import ContactForm from "./ContactForm";

export const metadata: Metadata = {
  title: "Contact Love Auto Group in Villa Park, IL | Visit Us",
  description:
    "Visit Love Auto Group at 735 N Yale Ave, Villa Park, IL 60181. Call (630) 359-3643 or get directions. Open Monday through Saturday, closed Sundays.",
  alternates: { canonical: "https://loveautogroup.com/contact" },
};

export default function ContactPage() {
  return (
    <>
      <section className="bg-brand-navy text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Contact Us</h1>
          <p className="mt-4 text-lg text-brand-gray-300">
            Stop by, give us a call, or send a message. We&apos;d love to hear
            from you
          </p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact info */}
          <div>
            <h2 className="text-2xl font-bold text-brand-gray-900 mb-6">
              Get in Touch
            </h2>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-brand-red"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-brand-gray-900">Phone</h3>
                  <a
                    href={`tel:${SITE_CONFIG.phoneRaw}`}
                    className="text-brand-red hover:text-brand-red-dark text-lg font-medium"
                  >
                    {SITE_CONFIG.phone}
                  </a>
                  <p className="text-sm text-brand-gray-500 mt-0.5">
                    Call or text during business hours
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-brand-red"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-brand-gray-900">Email</h3>
                  <a
                    href={`mailto:${SITE_CONFIG.email}`}
                    className="text-brand-red hover:text-brand-red-dark"
                  >
                    {SITE_CONFIG.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-brand-red/10 rounded-xl flex items-center justify-center shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-6 h-6 text-brand-red"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-brand-gray-900">Address</h3>
                  <p className="text-brand-gray-700">
                    {SITE_CONFIG.address.street}
                    <br />
                    {SITE_CONFIG.address.city}, {SITE_CONFIG.address.state}{" "}
                    {SITE_CONFIG.address.zip}
                  </p>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(SITE_CONFIG.address.full)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-brand-red hover:underline mt-1 inline-block"
                  >
                    Get Directions →
                  </a>
                </div>
              </div>
            </div>

            {/* Hours */}
            <div className="mt-8 bg-white rounded-xl border border-brand-gray-200 p-6">
              <h3 className="font-bold text-brand-gray-900 mb-4">
                Business Hours
              </h3>
              <ul className="space-y-2">
                {SITE_CONFIG.hours.map((h) => (
                  <li key={h.day} className="flex justify-between text-sm">
                    <span className="text-brand-gray-500">{h.day}</span>
                    <span
                      className={`font-medium ${h.hours === "Closed" ? "text-brand-red" : "text-brand-gray-900"}`}
                    >
                      {h.hours}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Map */}
            <div className="mt-6 bg-brand-gray-200 rounded-xl aspect-video flex items-center justify-center">
              <div className="text-center text-brand-gray-500">
                <p className="font-medium">Google Maps Embed</p>
                <p className="text-sm">{SITE_CONFIG.address.full}</p>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div>
            <h2 className="text-2xl font-bold text-brand-gray-900 mb-6">
              Send Us a Message
            </h2>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
