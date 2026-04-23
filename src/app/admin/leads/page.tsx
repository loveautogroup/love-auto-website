import type { Metadata } from "next";
import LeadsAdmin from "./LeadsAdmin";
import AdminBackLink from "@/components/AdminBackLink";

export const metadata: Metadata = {
  title: "Leads — Admin | Love Auto Group",
  robots: { index: false, follow: false },
};

export default function LeadsPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <AdminBackLink />
      <h1 className="text-3xl font-bold text-brand-gray-900 mb-2">
        Finance Application Leads
      </h1>
      <p className="text-brand-gray-500 mb-8">
        Every submission from the public /financing form. Gated by Cloudflare
        Access — you&apos;re seeing this because your email is on the allow-list.
      </p>
      <LeadsAdmin />
    </main>
  );
}
