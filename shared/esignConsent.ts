/**
 * ESIGN / UETA consent copy — ONE source, rendered by the customer page
 * (src/app/sign/[id]/SignFlow.tsx) and hashed by the server at consent time
 * (functions/api/sign/[id].ts), so the record says exactly which words the
 * customer agreed to. Bump ESIGN_CONSENT_VERSION whenever a word changes.
 *
 * Elements (Diane, 2026-09-02; 15 U.S.C. 7001(c)(1)):
 *   (B)(i)   the right to withdraw consent, how, and that it costs nothing
 *   (B)(ii)  scope — this transaction's listed documents only
 *   (B)(iii) how to update the contact information we use
 *   (B)(iv)  how to get a paper copy, and that it is free
 *   (C)(i)   hardware/software needed to access and keep the records
 *   (C)(ii)  a demonstration that the customer can open the format we use —
 *            the customer reads a word out of a small PDF on this page
 */

// .2 (Diane, same day): dropped "we will email you a PDF within one business
// day" — nothing in the code sends it, and a promise in a consent that is not
// kept is its own misrepresentation (815 ILCS 505/2). The copy now promises
// only what the system and the dealer actually do.
export const ESIGN_CONSENT_VERSION = "2026-09-02.2";

export const ESIGN_DEMO_PDF_PATH = "/esign/can-you-read-this.pdf";

export interface ConsentSection {
  heading: string;
  body: string;
}

export const ESIGN_CONSENT_SECTIONS: readonly ConsentSection[] = [
  {
    heading: "What you are agreeing to sign electronically",
    body:
      "Only the documents listed on this page, for this one vehicle purchase from Love Auto Group, Inc., 735 N Yale Ave Unit A, Villa Park, IL 60181. This consent does not cover any other transaction or any future paperwork. Under the federal ESIGN Act and the Illinois Uniform Electronic Transactions Act, a signature you draw here has the same legal effect as one you write in ink.",
  },
  {
    heading: "You can change your mind and sign on paper",
    body:
      "You may withdraw this consent at any time before you sign a document, at no cost. To withdraw, close this page and call or text us at (630) 359-3643, or come to the lot. We will prepare the same documents on paper for you to sign in person. Withdrawing does not affect anything you have already signed.",
  },
  {
    heading: "Copies are free",
    body:
      "Love Auto Group keeps every document you sign here, together with your signature. You may ask for a copy of any of them at any time, on paper or as a PDF, free of charge, by calling or texting (630) 359-3643, by emailing loveautogroup@gmail.com, or in person at the lot.",
  },
  {
    heading: "Keeping your contact details current",
    body:
      "We reach you at the email address and phone number we have on file for you. If either changes, tell us by calling or texting (630) 359-3643 or by emailing loveautogroup@gmail.com, and we will update our records.",
  },
  {
    heading: "What you need to sign and to keep your copies",
    body:
      "A phone, tablet or computer with a current version of Chrome, Safari, Edge or Firefox, JavaScript turned on, and an internet connection; a screen and a finger, stylus or mouse to draw your signature; an email account that can receive attachments; and a PDF reader (the one built into your phone or browser is fine). To confirm your device can open a PDF copy, open the short test file below and type the word it shows.",
  },
];

/** The checkbox statement. Rendered verbatim and hashed with the sections. */
export const ESIGN_CONSENT_STATEMENT =
  "I have read the five points above. I consent to sign the documents listed on this page electronically, and I understand I can withdraw this consent before signing, at no cost, and get free paper copies at any time.";

/** Everything the customer agrees to, in a stable order, for hashing. */
export function esignConsentText(): string {
  return [
    `ESIGN consent v${ESIGN_CONSENT_VERSION}`,
    ...ESIGN_CONSENT_SECTIONS.map((s) => `${s.heading}\n${s.body}`),
    ESIGN_CONSENT_STATEMENT,
  ].join("\n\n");
}
