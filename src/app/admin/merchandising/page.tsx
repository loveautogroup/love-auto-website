import type { Metadata } from "next";
import MerchandisingAdmin from "./MerchandisingAdmin";
import AdminBackLink from "@/components/AdminBackLink";

export const metadata: Metadata = {
  title: "Merchandising Admin | Love Auto Group",
  description: "Internal tool — control vehicle featuring and overlay badges.",
  robots: { index: false, follow: false },
};

export default function MerchandisingAdminPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 pt-8">
      <AdminBackLink />
      <MerchandisingAdmin />
    </div>
  );
}
