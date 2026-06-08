import type { Metadata } from "next";
import FinancingHero from "./FinancingHero";

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
        <iframe
          // DealerCenter moved this to a lowercase path with a trailing slash
          // (old URL = double 301). Updated 2026-06-07 (S27) while fixing the
          // CSP frame-src block that had hidden this form since May 5.
          src="https://dwssecuredforms.dealercenter.net/creditapplication/index/9079472/?themecolor=8C8C8C&formtype=l&frameId=dws_frame_0&standalone=true"
          scrolling="auto"
          style={{ height: "1093px", width: "100%" }}
          frameBorder={0}
          title="Apply for Financing — Love Auto Group"
        />
      </section>
    </>
  );
}
