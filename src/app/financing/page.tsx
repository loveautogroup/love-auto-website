import type { Metadata } from "next";
import FinancingHero from "./FinancingHero";
import ApplySection from "./ApplySection";

export const metadata: Metadata = {
  title: "Used Car Financing, All Credit Welcome | Love Auto Group",
  description:
    "All credit welcome. Multiple lenders, competitive rates, and fast decisions. Apply online with Love Auto Group in Villa Park, IL.",
  alternates: { canonical: "https://www.loveautogroup.net/financing/" },
};

export default function FinancingPage() {
  return (
    <>
      <FinancingHero />

      <section
        id="apply"
        className="max-w-5xl mx-auto px-4 py-12 scroll-mt-20"
      >
{/* In-house full credit application (S27, SSN encrypted), replacing the
            old DealerCenter iframe per Jeremiah's call. The Quick Pre-Qualify
            form was removed 2026-10-04. */}
        <ApplySection />
      </section>
    </>
  );
}
