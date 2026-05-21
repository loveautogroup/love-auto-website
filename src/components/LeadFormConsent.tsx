// CRM Phase 1 — Lead form consent block (Diane-approved language).
// Place ABOVE the Submit button on /contact and any other lead-capture form.
//
// Don't modify the wording without Diane's sign-off.

export function LeadFormConsent() {
  return (
    <div className="text-xs text-gray-600 leading-relaxed mb-3 max-w-md">
      By submitting this form, you agree that Love Auto Group, Inc. may
      contact you by email and at the phone number you provide regarding
      your inquiry. Initial replies may be sent by our automated
      assistant; a real person on our team will always be available — just
      reply, or call us at <a href="tel:+16303593643" className="underline">(630) 359-3643</a>. We respect
      your inbox: we don't sell your information, and you can opt out of
      further emails at any time by replying UNSUBSCRIBE.
      <div className="mt-2">
        See our{" "}
        <a href="/privacy" className="underline">
          Privacy Policy
        </a>{" "}
        for how we handle your information.
      </div>
    </div>
  );
}
