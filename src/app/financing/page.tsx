import type { Metadata } from "next";
import FinancingHero from "./FinancingHero";
import FinancingForm from "./FinancingForm";

export const metadata: Metadata = {
  title: "Used Car Financing, All Credit Welcome | Love Auto",
  description:
    "All credit welcome. Multiple lenders, competitive rates, and fast pre-approval. Apply online with Love Auto Group in Villa Park, IL.",
  alternates: { canonical: "https://www.loveautogroup.net/financing" },
};

export default function FinancingPage() {
  return (
    <>
      <FinancingHero />

      <section
        id="apply"
        className="max-w-5xl mx-auto px-4 py-12 scroll-mt-20"
      >
{/* In-house full credit application (S27) — replaced the DealerCenter
            iframe per Jeremiah's call. SSN/DL encrypted at rest in the DMS. */}
        <FinancingForm />
      </section>
    </>
  );
}
