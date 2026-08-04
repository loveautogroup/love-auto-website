"use client";

// CRM Phase 1 — Lead form supplemental note (auto-assistant + email opt-out).
// Sits directly below the SMS-consent checkbox on /contact and other lead forms.
// The SMS consent + Privacy Policy / Terms links live on the checkbox itself
// (Nextiva 10DLC required wording); this is only the informational follow-up.
//
// This text is NOT part of the hashed TCPA consent registry
// (src/lib/consent-language.ts) — it's a separate, Diane-approved
// informational disclosure. Translated for the Spanish site pass (2026-08);
// if the English wording changes again, re-check with Diane before editing
// the Spanish copy too.

import { useLanguage } from "@/context/LanguageContext";

export function LeadFormConsent() {
  const { t } = useLanguage();
  const phone = "(630) 359-3643";
  const parts = t.leadForm.consentNote.split("{phone}");

  return (
    <p className="text-xs text-gray-600 leading-relaxed mb-3 max-w-md">
      {parts[0]}
      <a href="tel:+16303593643" className="underline">
        {phone}
      </a>
      {parts[1]}
    </p>
  );
}
