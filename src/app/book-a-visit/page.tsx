import type { Metadata } from "next";
import { BreadcrumbSchema } from "@/components/StructuredData";
import SiteBreadcrumb from "@/components/SiteBreadcrumb";
import { TrackedPhoneLink } from "@/components/TrackedLink";
import { SITE_CONFIG } from "@/lib/constants";
import BookVisitForm from "./BookVisitForm";

/**
 * /book-a-visit/ -- the landing page behind the Google Business Profile "Book"
 * button. Google offers this dealer only a booking LINK (no integrated
 * provider), so this page itself takes the request.
 *
 * LEAD-ONLY. Nothing is booked here. The form posts to /api/leads and lands in
 * the DMS leads pipeline as source "website-book-visit"; the owner confirms by
 * call or text. Do not add calendar booking or auto-confirm.
 */

const PAGE_URL = "https://www.loveautogroup.net/book-a-visit/";
const TITLE = "Book a Visit | Love Auto Group, Villa Park IL";
const DESCRIPTION =
  "Request a visit to Love Auto Group in Villa Park, IL. Pick a day and time and we'll call or text to confirm. No dealer fees. Free CARFAX on marked cars.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: PAGE_URL },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: PAGE_URL,
    type: "website",
    siteName: "Love Auto Group",
  },
};

export default function BookAVisitPage() {
  return (
    <>
      <BreadcrumbSchema
        items={[
          { name: "Home", url: "https://www.loveautogroup.net/" },
          { name: "Book a Visit", url: PAGE_URL },
        ]}
      />
      <SiteBreadcrumb trail={[{ label: "Book a Visit" }]} />

      <section className="bg-brand-navy text-white py-12 md:py-16 border-b border-white/[.14]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-heading font-extrabold leading-[0.98] text-[clamp(2rem,5vw,3.25rem)]">
            Book a Visit
          </h1>
          <span className="mt-4 inline-block w-12 h-[3px] bg-brand-red" aria-hidden="true" />
          <p className="mt-5 text-base sm:text-lg text-ink-300 leading-relaxed max-w-2xl mx-auto">
            Tell us the day and time that work for you. We will call or text to
            confirm. Nothing is booked until we do.
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-10">
          <BookVisitForm />

          <aside className="space-y-6" aria-label="Visit details">
            <div className="bg-white border border-ink-200 p-6">
              <h2 className="font-heading font-bold text-brand-gray-900 mb-3">
                Where we are
              </h2>
              <p className="text-brand-gray-700 text-sm leading-relaxed">
                {SITE_CONFIG.name}
                <br />
                {SITE_CONFIG.address.street}
                <br />
                {SITE_CONFIG.address.city}, {SITE_CONFIG.address.state}{" "}
                {SITE_CONFIG.address.zip}
              </p>
              <a
                href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(SITE_CONFIG.address.full)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-brand-red hover:underline mt-2 inline-block"
              >
                Get directions
              </a>
            </div>

            <div className="bg-white border border-ink-200 p-6">
              <h2 className="font-heading font-bold text-brand-gray-900 mb-3">
                Store hours
              </h2>
              <p className="text-sm text-brand-gray-700">
                Tuesday to Saturday, 2 to 6 PM. Closed Sunday and Monday.
              </p>
              <p className="text-sm text-brand-gray-500 mt-2">
                Other times by appointment. We will confirm.
              </p>
            </div>

            <div className="bg-white border border-ink-200 p-6">
              <h2 className="font-heading font-bold text-brand-gray-900 mb-3">
                Rather talk now?
              </h2>
              <p className="text-sm text-brand-gray-700">
                Call{" "}
                <TrackedPhoneLink
                  location="book_a_visit"
                  href={`tel:${SITE_CONFIG.phoneRaw}`}
                  className="text-brand-red font-semibold hover:underline"
                >
                  630-359-3643
                </TrackedPhoneLink>{" "}
                or text{" "}
                <a
                  href="sms:3129257520"
                  className="text-brand-red font-semibold hover:underline"
                >
                  312-925-7520
                </a>
                .
              </p>
            </div>

            <ul className="text-sm text-brand-gray-700 space-y-2 border-l-2 border-brand-red pl-4">
              <li>No dealer fees. Just tax, title and license.</li>
              <li>Free CARFAX on cars marked with the CARFAX badge.</li>
            </ul>
          </aside>
        </div>
      </section>
    </>
  );
}
