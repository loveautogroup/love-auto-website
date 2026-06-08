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
    `flex-1 py-3 rounded-lg text-sm font-semibold transition-colors ${
      active
        ? "bg-brand-red text-white"
        : "bg-white text-brand-gray-700 border border-brand-gray-200 hover:border-brand-red"
    }`;

  return (
    <div>
      <div className="flex gap-3 mb-6" role="tablist" aria-label="Application type">
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
