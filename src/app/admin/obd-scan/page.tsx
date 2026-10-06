import type { Metadata } from "next";
import ObdScanHelper from "./ObdScanHelper";
import AdminBackLink from "@/components/AdminBackLink";

export const metadata: Metadata = {
  title: "OBD Scan Helper — Admin | Love Auto Group",
  robots: { index: false, follow: false },
};

export default function ObdScanPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <AdminBackLink />
      <h1 className="text-3xl font-bold text-brand-gray-900 mb-2">
        OBD Scan Helper
      </h1>
      <p className="text-brand-gray-500 mb-8 max-w-3xl">
        Snap the scan tool screen, confirm the codes it read, and get a
        researched brief for this exact vehicle: likely causes, what to check
        first, typical fix and cost, and any TSB or recall, with links to the
        sources. A research aid for the shop, not a diagnosis. Verify before
        ordering parts.
      </p>
      <ObdScanHelper />
    </main>
  );
}
