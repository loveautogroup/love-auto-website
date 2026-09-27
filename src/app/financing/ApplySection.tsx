"use client";

/**
 * ApplySection — tab switcher between the full Credit Application (SSN,
 * encrypted, S27) and the Quick Pre-Qualify short form (no SSN).
 * The hero's "Quick Pre-Qualify" button links to #apply with ?mode=prequal
 * handled via the hash (#prequal) so the right tab opens.
 */

import { useEffect, useState } from "react";
import FinancingForm from "./FinancingForm";
import QuickPreQualifyForm from "./QuickPreQualifyForm";

export default function ApplySection() {
  const [tab, setTab] = useState<"full" | "prequal">("full");

  useEffect(() => {
    const pick = () => {
      if (window.location.hash === "#prequal") setTab("prequal");
      else if (window.location.hash === "#apply") setTab("full");
    };
    pick();
    window.addEventListener("hashchange", pick);
    return () => window.removeEventListener("hashchange", pick);
  }, []);

  const tabClass = (active: boolean) =>
    `flex-1 sm:flex-none px-5 py-3.5 text-[12px] font-bold uppercase tracking-[0.07em] border-b-2 transition-colors ${
      active
        ? "border-brand-red text-brand-red"
        : "border-transparent text-brand-gray-500 hover:text-brand-gray-900 hover:border-brand-gray-300"
    }`;

  return (
    <div>
      <div
        className="flex gap-0 mb-8 border-b border-ink-200"
        role="tablist"
        aria-label="Application type"
      >
        <button type="button" role="tab" aria-selected={tab === "full"}
          className={tabClass(tab === "full")} onClick={() => setTab("full")}>
          Full Credit Application
        </button>
        <button type="button" role="tab" aria-selected={tab === "prequal"}
          className={tabClass(tab === "prequal")} onClick={() => setTab("prequal")}>
          Quick Pre-Qualify (no SSN)
        </button>
      </div>
      {tab === "full" ? <FinancingForm /> : <QuickPreQualifyForm />}
    </div>
  );
}
