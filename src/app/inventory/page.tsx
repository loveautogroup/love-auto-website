import type { Metadata } from "next";
import { sampleInventory } from "@/data/inventory";
import { sortWithFeaturedFirst } from "@/data/merchandising";
import InventoryFilters from "./InventoryFilters";
import InventoryGrid from "./InventoryGrid";
import VDPTrustStrip from "@/components/VDPTrustStrip";
import InventoryHero from "./InventoryHero";

export const metadata: Metadata = {
  title: "Used Cars for Sale in Villa Park, IL | Love Auto Group",
  description:
    "Browse our Villa Park, IL inventory of quality used cars from $4,500 to $18,000. Lexus, Subaru, Acura, Mazda. Fully reconditioned and ready to drive.",
  alternates: { canonical: "https://www.loveautogroup.net/inventory/" },
};

export default function InventoryPage() {
  // Full merchandise-ordered list of available stock. Client-side filter
  // logic runs in InventoryGrid via useSearchParams (required for static
  // export — server-side searchParams not available at build time).
  const vehicles = sortWithFeaturedFirst(
    sampleInventory.filter((v) => v.status !== "sold")
  );

  return (
    <>
      <InventoryHero />

      <div className="max-w-7xl mx-auto px-4 pt-4">
        <VDPTrustStrip />
      </div>

      <section className="max-w-7xl mx-auto px-4 py-8">
        <div className="lg:grid lg:grid-cols-[280px_1fr] lg:gap-8">
          <aside aria-label="Filter vehicles">
            <InventoryFilters />
          </aside>

          <div>
            <InventoryGrid vehicles={vehicles} />
          </div>
        </div>
      </section>
    </>
  );
}
