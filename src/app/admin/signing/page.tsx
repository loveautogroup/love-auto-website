import type { Metadata } from "next";
import SigningAdmin from "./SigningAdmin";

export const metadata: Metadata = {
  title: "E-Signature Sessions — Admin | Love Auto Group",
  robots: { index: false, follow: false },
};

export default function SigningAdminPage() {
  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-brand-gray-900 mb-2">
        E-Signature Sessions
      </h1>
      <p className="text-brand-gray-500 mb-8">
        Create a new signing session for a customer, or review active and
        completed sessions. Gated by Cloudflare Access.
      </p>
      <SigningAdmin />
    </main>
  );
}
