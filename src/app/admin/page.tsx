import type { Metadata } from "next";
import AdminHub from "./AdminHub";

export const metadata: Metadata = {
  title: "Admin — Love Auto Group",
  robots: { index: false, follow: false },
};

export default function AdminHomePage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-brand-gray-900 mb-2">
        Dealership Admin
      </h1>
      <p className="text-brand-gray-500 mb-8">
        Everything you need to run the lot from one place. Gated by Cloudflare
        Access — only people on the allow-list reach this page.
      </p>
      <AdminHub />
    </main>
  );
}
