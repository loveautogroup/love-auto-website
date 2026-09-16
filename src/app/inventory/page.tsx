import type { Metadata } from "next";
import { sampleInventory } from "@/data/inventory";
import { sortWithFeaturedFirst } from "@/data/merchandising";
import { hasOwnPhoto } from "../../../shared/ownPhoto";
import InventoryGrid from "./InventoryGrid";
import VehicleAlertSignup from "@/components/VehicleAlertSignup";
import VDPTrustStrip from "@/components/VDPTrustStrip";
import InventoryHero from "./InventoryHero";
import { ItemListSchema } from "@/components/StructuredData";

export const metadata: Metadata = {
  title: "Browse Our Full Used Car Inventory | Love Auto Group",
  description:
    "Browse our Villa Park, IL inventory of quality used cars from $4,500 to $18,000. Lexus, Subaru, Acura, Mazda. Fully reconditioned and ready to drive.",
  // hreflang must be reciprocal or search engines ignore it — /es/inventory/
  // points back here. See src/lib/localeRoutes.ts.
  alternates: {
    canonical: "https://www.loveautogroup.net/inventory/",
    languages: {
      "en-US": "https://www.loveautogroup.net/inventory/",
      "es-US": "https://www.loveautogroup.net/es/inventory/",
      "x-default": "https://www.loveautogroup.net/inventory/",
    },
  },
};

export default function InventoryPage() {
  // Full merchandise-ordered list of available stock. Client-side filter
  // logic runs in InventoryGrid via useSearchParams (required for static
  // export — server-side searchParams not available at build time).
  const available = sortWithFeaturedFirst(
    sampleInventory.filter((v) => v.status !== "sold")
  );

  // Sold-vehicle history (Jeremiah, 2026-09-15): "keep our sold vehicles on
  // the site ... show a history of cars weve sold. Doesnt have to be a
  // special section just keep them online." Scoped to "Our photos only" —
  // a sold car whose only image is the DealerCenter thumbnail fallback, or
  // that has none, does not qualify (matches Railway's
  // _sold_with_own_photos_ids gate; see shared/ownPhoto.ts). They render
  // AFTER every available vehicle, newest sale first, never in a section of
  // their own. InventoryGrid re-derives this same bucket at runtime once
  // live/KV data hydrates — this build-time list is the SSR/crawler view
  // and the Suspense fallback.
  const sold = sampleInventory
    .filter((v) => v.status === "sold" && hasOwnPhoto(v.images))
    .sort((a, b) => {
      const at = a.soldDate ? Date.parse(a.soldDate) : 0;
      const bt = b.soldDate ? Date.parse(b.soldDate) : 0;
      return bt - at;
    });

  // Rendered together (available first) so the ItemList schema and the
  // Suspense-fallback grid both describe the exact same set of cards the
  // page shows. Price/CTA gating for the sold ones happens in VehicleCard.
  const vehicles = [...available, ...sold];

  return (
    <>
      {/* E6: listing-hub structured data — crawlers get every live VDP. */}
      <ItemListSchema
        name="Used Cars for Sale in Villa Park, IL"
        vehicles={vehicles}
      />

      <InventoryHero />

      {/* Owner, 2026-09-15: "lets remove the recently reduced section on the
          website." The E2 price-drop rail that sat here is gone, and
          RecentlyReducedRail.tsx with it. The recentlyReduced flag still
          arrives from the DMS and still drives the card / hero price-drop
          pill; only the rail was removed. */}

      <div className="max-w-7xl mx-auto px-4 pt-4">
        <VDPTrustStrip />
      </div>

      {/* Owner, 2026-08-12: the filter sidebar came out. With a lot this size
          a shopper can see everything at once, so a seven-control filter panel
          was asking them to narrow a list that was never long enough to need
          narrowing — it cost width the cars could use. The grid still honours
          ?make=/?maxPrice=/?q= from the URL, so the homepage quick-links and
          any existing shared or indexed filtered link keep working. */}
      <section className="max-w-7xl mx-auto px-4 py-8">
        <InventoryGrid vehicles={vehicles} />
      </section>

      {/* Was mounted at the bottom of the filter sidebar. It is demand capture,
          not a filter, so it outlives the panel — kept here where it reads as a
          closing ask after the shopper has been through the grid. */}
      <section className="max-w-3xl mx-auto px-4 pb-12">
        <div className="bg-white border border-brand-gray-200 rounded-xl p-6">
          <VehicleAlertSignup />
        </div>
      </section>
    </>
  );
}
