import type { Metadata } from "next";
import { SITE_CONFIG } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy | Love Auto Group in Villa Park, IL",
  description:
    "Read the Love Auto Group privacy policy. Learn how we collect, use, and protect your personal information when you visit our Villa Park, IL dealership.",
  alternates: { canonical: "https://www.loveautogroup.net/privacy-policy" },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <section className="bg-brand-navy text-white py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold">Privacy Policy</h1>
          <p className="mt-4 text-lg text-brand-gray-300">
            Last updated: April 17, 2026
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none prose-headings:text-brand-gray-900 prose-headings:font-bold prose-p:text-brand-gray-700 prose-p:leading-relaxed">
          <p>
            {SITE_CONFIG.name} (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;) operates the
            website at {SITE_CONFIG.url} and our physical dealership at{" "}
            {SITE_CONFIG.address.full}. This Privacy Policy explains how we
            collect, use, and protect your personal information when you visit
            our website or do business with us.
          </p>

          <h2 className="mt-10 mb-4">Information We Collect</h2>
          <p>We may collect the following types of information:</p>
          <p>
            <strong>Information you provide directly:</strong> When you fill out
            a contact form, financing application, trade-in inquiry, or test
            drive request, we collect the information you submit. This may
            include your name, phone number, email address, and details about
            the vehicle you&apos;re interested in. Financing applications may also
            include credit-related information such as estimated credit score
            range and monthly budget.
          </p>
          <p>
            <strong>Information collected automatically:</strong> When you visit
            our website, we may automatically collect certain technical
            information such as your IP address, browser type, device type,
            pages visited, and time spent on the site. This information is
            collected through cookies and similar technologies.
          </p>

          <h2 className="mt-10 mb-4">How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <p>
            Respond to your inquiries and requests. Process financing
            pre-approval applications. Schedule test drives and appointments.
            Provide you with information about vehicles that may interest you.
            Improve our website and customer experience. Comply with legal
            obligations.
          </p>

          <h2 className="mt-10 mb-4">How We Share Your Information</h2>
          <p>
            We do not sell your personal information to third parties. We may
            share your information with lending partners when you submit a
            financing application, as this is necessary to process your request.
            We may also share information with service providers who help us
            operate our website and business, or when required by law.
          </p>

          <h2 className="mt-10 mb-4">Cookies</h2>
          <p>
            Our website uses cookies and similar tracking technologies to improve
            your browsing experience and analyze site traffic. You can control
            cookie settings through your browser preferences. Disabling cookies
            may affect some features of the website.
          </p>

          <h2 className="mt-10 mb-4">Data Security</h2>
          <p>
            We take reasonable measures to protect your personal information
            from unauthorized access, alteration, or destruction. However, no
            method of transmission over the internet is 100% secure, and we
            cannot guarantee absolute security.
          </p>

          <h2 className="mt-10 mb-4">Third-Party Links</h2>
          <p>
            Our website may contain links to third-party websites. We are not
            responsible for the privacy practices or content of those sites. We
            encourage you to review the privacy policies of any third-party
            sites you visit.
          </p>

          <h2 className="mt-10 mb-4">Your Rights</h2>
          <p>
            You may request access to, correction of, or deletion of your
            personal information by contacting us. Illinois residents may have
            additional rights under state privacy laws. We will respond to
            verified requests in accordance with applicable law.
          </p>

          <h2 className="mt-10 mb-4">Children&apos;s Privacy</h2>
          <p>
            Our website is not intended for children under 13 years of age. We
            do not knowingly collect personal information from children under 13.
            If you believe we have collected information from a child under 13,
            please contact us immediately.
          </p>

          <h2 className="mt-10 mb-4">Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will be
            posted on this page with an updated &quot;last updated&quot; date. Your
            continued use of our website after any changes constitutes
            acceptance of the updated policy.
          </p>

          <h2 className="mt-10 mb-4">Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy or how we handle
            your information, contact us at:
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
