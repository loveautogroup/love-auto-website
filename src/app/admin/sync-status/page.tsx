import type { Metadata } from "next";
import SyncStatus from "./SyncStatus";
import AdminBackLink from "@/components/AdminBackLink";

export const metadata: Metadata = {
  title: "Website Inventory Status — Admin | Love Auto Group",
  robots: { index: false, follow: false },
};

export default function SyncStatusPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <AdminBackLink />
      <h1 className="text-3xl font-bold text-brand-gray-900 mb-2">
        Website Inventory Status
      </h1>
      <p className="text-brand-gray-500 mb-8 max-w-3xl">
        Is the website showing the current lot right now, and if not, why.
        Checks three things that fail independently: whether visitors are
        getting live DMS data, whether the deployed car pages still match the
        lot, and whether the marketplace feeds are publishing. Anything that
        could not be measured says <em>Unknown</em> rather than guessing.
      </p>
      <SyncStatus />
    </main>
  );
}
