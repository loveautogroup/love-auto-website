import type { Metadata } from "next";
import { sampleInventory } from "@/data/inventory";
import { sortWithFeaturedFirst } from "@/data/merchandising";
import InventoryFilters from "./InventoryFilters";
import InventoryGrid from "./InventoryGrid";
import VDPTrustStrip from "@/components/VDPTrustStrip";
import InventoryHero from "./InventoryHero";
import RecentlyReducedRail from "./RecentlyReducedRail";
import { ItemListSchema } from "@/components/StructuredData";

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

  // E2: price drops from the last 14 days (DMS pricing-history flag),
  // surfaced as a rail before the main grid. Sanity guard: when MORE THAN
  // HALF the lot is flagged (a pricing-history backfill artifact — 8 of 9
  // cars were flagged on 2026-07-17), a "deals" rail is meaningless noise
  // that just duplicates the grid, so it hides itself until the data is
  // discriminating again.
  const reducedAll = vehicles.filter(
    (v) => v.recentlyReduced && v.status === "available"
  );
  const recentlyReduced =
    reducedAll.length * 2 <= vehicles.length ? reducedAll.slice(0, 8) : [];

  return (
    <>
      {/* E6: listing-hub structured data — crawlers get every live VDP. */}
      <ItemListSchema
        name="Used Cars for Sale in Villa Park, IL"
        vehicles={vehicles}
      />

      <InventoryHero />

      <div className="max-w-7xl mx-auto px-4 pt-4">
        <VDPTrustStrip />
      </div>

      <RecentlyReducedRail vehicles={recentlyReduced} />

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
