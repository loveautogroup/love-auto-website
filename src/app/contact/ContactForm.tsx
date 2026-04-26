"use client";

/**
 * /contact page form. Thin wrapper around the shared LeadForm component
 * so the same submission logic powers /contact, VDP modals, and the
 * sticky CTA. Posts to https://dms.loveautogroup.net/api/v1/public/leads.
 */

import LeadForm from "@/components/LeadForm";

export default function ContactForm() {
  return (
    <div className="bg-white rounded-xl border border-brand-gray-200 p-6">
      <LeadForm source="website-contact" submitLabel="Send message" />
    </div>
  );
}
