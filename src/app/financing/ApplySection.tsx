"use client";

/**
 * ApplySection — the full Credit Application (SSN, encrypted, S27) is the
 * only application on /financing. The Quick Pre-Qualify short form and its
 * tab were removed 2026-10-04 (owner: it serves no purpose anymore).
 * Old #prequal links just land on the page, which shows the full form.
 */

import FinancingForm from "./FinancingForm";

export default function ApplySection() {
  return (
    <div>
      <FinancingForm />
    </div>
  );
}
