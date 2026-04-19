import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service | Love Auto Group in Villa Park, IL",
  description:
    "Review the terms of service for Love Auto Group in Villa Park, IL. Your use of our website and services is governed by the terms outlined on this page.",
  alternates: { canonical: "https://loveautogroup.com/terms" },
};

export default function TermsPage() {
  return (
    <>
      <section className="bg-brand-navy text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Terms of Service</h1>
          <p className="mt-4 text-lg text-brand-gray-300">
            Last updated: April 17, 2026
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none prose-headings:text-brand-gray-900 prose-headings:font-bold prose-p:text-brand-gray-700 prose-p:leading-relaxed">
          <p>
            Welcome to the {SITE_CONFIG.name} website. By accessing or using our
            website at {SITE_CONFIG.url}, you agree to be bound by these Terms
            of Service. If you do not agree with these terms, please do not use
            our website.
          </p>

          <h2 className="mt-10 mb-4">Use of This Website</h2>
          <p>
            This website is provided for informational purposes and to
            facilitate communication between you and {SITE_CONFIG.name}. You may
            browse vehicle inventory, submit inquiries, apply for financing
            pre-approval, and access other features we make available.
          </p>
          <p>
            You agree to use this website only for lawful purposes and in a
            manner that does not infringe on the rights of others or restrict
            their use of the site.
          </p>

          <h2 className="mt-10 mb-4">Vehicle Listings and Pricing</h2>
          <p>
            We make every effort to ensure that vehicle listings, descriptions,
            photos, and pricing on our website are accurate and up to date.
            However, errors can occur, and vehicle availability changes
            frequently. All vehicles are subject to prior sale.
          </p>
          <p>
            Prices displayed on this website do not include tax, title,
            registration, or documentation fees unless explicitly stated. The
            final purchase price will be determined at the time of sale and may
            differ from the listed price due to applicable fees, promotions, or
            corrections.
          </p>
          <p>
            Listings on this website do not constitute a binding offer to sell
            any vehicle at the listed price. {SITE_CONFIG.name} reserves the
            right to correct pricing errors and update listings at any time.
          </p>

          <h2 className="mt-10 mb-4">Financing</h2>
          <p>
            Financing pre-approval submissions made through this website are
            requests for information only and do not constitute a binding loan
            agreement. All financing is subject to lender approval, verification
            of information, and execution of final loan documents. Rates, terms,
            and approval are determined by the lending institution.
          </p>

          <h2 className="mt-10 mb-4">Trade-In and Vehicle Purchase Offers</h2>
          <p>
            Any trade-in valuations or vehicle purchase offers discussed through
            this website are preliminary estimates only. Final offers are
            contingent on in-person inspection of the vehicle and may differ from
            any online estimates.
          </p>

          <h2 className="mt-10 mb-4">Intellectual Property</h2>
          <p>
            All content on this website, including text, images, logos, and
            design, is the property of {SITE_CONFIG.name} or its content
            providers and is protected by applicable copyright and trademark
            laws. You may not reproduce, distribute, or use any content from
            this website without our written permission.
          </p>

          <h2 className="mt-10 mb-4">Disclaimer of Warranties</h2>
          <p>
            This website is provided &quot;as is&quot; and &quot;as available&quot; without
            warranties of any kind, either express or implied. We do not warrant
            that the website will be uninterrupted, error-free, or free of
            viruses or other harmful components.
          </p>

          <h2 className="mt-10 mb-4">Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by law, {SITE_CONFIG.name} shall not
            be liable for any damages arising from your use of this website,
            including but not limited to direct, indirect, incidental, or
            consequential damages. This limitation applies regardless of the
            theory of liability.
          </p>

          <h2 className="mt-10 mb-4">Third-Party Links</h2>
          <p>
            Our website may contain links to third-party websites for your
            convenience. We do not control or endorse these sites and are not
            responsible for their content or practices.
          </p>

          <h2 className="mt-10 mb-4">Governing Law</h2>
          <p>
            These Terms of Service are governed by the laws of the State of
            Illinois. Any disputes arising from these terms or your use of the
            website shall be resolved in the courts of DuPage County, Illinois.
          </p>

          <h2 className="mt-10 mb-4">Changes to These Terms</h2>
          <p>
            We may update these Terms of Service at any time. Changes will be
            posted on this page with an updated date. Your continued use of the
            website after changes are posted constitutes your acceptance of the
            revised terms.
          </p>

          <h2 className="mt-10 mb-4">Contact Us</h2>
          <p>
            If you have questions about these Terms of Service, contact us at:
          </p>
          <p>
            {SITE_CONFIG.name}
            <br />
            {SITE_CONFIG.address.full}
            <br />
            Phone: {SITE_CONFIG.phone}
            <br />
            Email: {SITE_CONFIG.email}
          </p>
        </div>
      </section>
    </>
  );
}
