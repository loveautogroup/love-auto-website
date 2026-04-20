import type { Metadata } from "next";
import MerchandisingAdmin from "./MerchandisingAdmin";

export const metadata: Metadata = {
  title: "Merchandising Admin | Love Auto Group",
  description: "Internal tool — control vehicle featuring and overlay badges.",
  robots: { index: false, follow: false },
};

export default function MerchandisingAdminPage() {
  return <MerchandisingAdmin />;
}
