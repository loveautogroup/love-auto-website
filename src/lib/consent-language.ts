// Canonical consent wording + version keys, shared by every lead/credit form.
//
// These strings MUST stay byte-identical to the DMS ConsentLanguage registry
// (seed-consent-language.mjs). Each form renders the text FROM this module and,
// on submit, sends the version key + a SHA-256 of each string it showed. The DMS
// stores those hashes; matching them to the registry proves what the customer
// saw. Changing wording = a NEW version key here AND a new registry row — never
// edit an existing string in place.

export const CONSENT_LANGUAGE = {
  "creditapp-2026-07": {
    tcpa_sms:
      "By checking this box, I consent to receive text messages from Love Auto Group at the phone number provided, including texts sent via automated systems, about my inquiry. Message and data rates may apply. Message frequency varies. Reply STOP to opt out at any time. Consent is not a condition of purchase.",
    privacy:
      "I acknowledge I have read and agree to the Privacy Policy. I understand this is an application for credit and that Love Auto Group works with multiple lenders to find financing options for me.",
    fcra_credit_auth:
      "I, the undersigned, (a) for the purpose of securing credit, certify the above representations to be correct; (b) authorize Love Auto Group Inc. and the financial institutions to whom this application is submitted, as they consider necessary and appropriate, to obtain consumer credit reports on me and to gather and verify employment history; and (c) understand that Love Auto Group Inc., and any financial institution to whom this application is submitted, will retain this application whether or not it is approved, and that it is my responsibility to notify the creditor of any change of name, address, or employment. Love Auto Group Inc. and any financial institution to whom this application is submitted may share certain non-public personal information about me with my authorization or as provided by law.",
  },
  "prequalify-2026-07": {
    tcpa_sms:
      "By checking this box, I consent to receive text messages from Love Auto Group at the phone number provided, including texts sent via automated systems, about my inquiry. Message and data rates may apply. Message frequency varies. Reply STOP to opt out at any time. Consent is not a condition of purchase.",
    privacy:
      "I acknowledge I have read and agree to the Privacy Policy. I understand this is a pre-qualification request, not an application for credit, and no credit report will be pulled. A full credit application with written authorization comes later if I decide to proceed.",
  },
  "v2-2026-06-sms": {
    tcpa_sms:
      "By checking the box, and submitting this form, you consent to receive text messages (SMS) to provide you support, and general information from Love Auto Group. Message frequency may vary. Message and data rates may apply. You can reply STOP to opt out of further messaging.",
  },
} as const;

export type ConsentVersionKey = keyof typeof CONSENT_LANGUAGE;

// SHA-256 → lowercase hex, via Web Crypto (browser + edge runtime).
export async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Hash every consent string for a version → { consentType: sha256 }.
export async function consentHashesFor(
  versionKey: ConsentVersionKey
): Promise<Record<string, string>> {
  const entries = Object.entries(CONSENT_LANGUAGE[versionKey]) as [string, string][];
  const out: Record<string, string> = {};
  for (const [type, text] of entries) out[type] = await sha256Hex(text);
  return out;
}
