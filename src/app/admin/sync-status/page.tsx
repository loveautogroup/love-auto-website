import type { Metadata } from "next";
import SyncStatus from "./SyncStatus";
import AdminBackLink from "@/components/AdminBackLink";

export const metadata: Metadata = {
  title: "Inventory Sync — Admin | Love Auto Group",
  robots: { index: false, follow: false },
};

export default function SyncStatusPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <AdminBackLink />
      <h1 className="text-3xl font-bold text-brand-gray-900 mb-2">
        Inventory Sync
      </h1>
      <p className="text-brand-gray-500 mb-8">
        Monitor the Cron Worker that mirrors Dealer Center inventory into the
        site every 15 minutes. Trigger a manual run, inspect the latest
        snapshot, or diff recent runs to spot stale data.
      </p>
      <SyncStatus />
    </main>
  );
}
