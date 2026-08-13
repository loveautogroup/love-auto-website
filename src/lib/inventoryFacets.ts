"use client";

/**
 * Filter facets (make / body style) derived from the live lot.
 *
 * Every hardcoded dropdown list on this site has drifted from the real
 * inventory at least once. The /inventory sidebar was fixed first (it had
 * no Ford/Lincoln/Mercedes-Benz option and no Convertible while all four
 * were on the lot); the homepage hero search had the same defect in the
 * other direction — it offered Subaru/Lexus/Acura/Mazda/Honda/Toyota when
 * the lot held none of them, so all six options returned zero vehicles.
 *
 * One shared hook so a list can't drift on one surface but not the other.
 *
 * Sold vehicles are excluded: the grid drops them before rendering, so a
 * sold car's make offered as an option is another guaranteed zero-result
 * choice. Hidden vehicles are dropped too — a car pulled off the site via
 * the DMS "Hide from website" toggle must not be reachable through a
 * filter either.
 */

import { useInventory } from "@/lib/useInventory";
import { useVisibleVehicles } from "@/data/useMerchandising";

export function uniqueSorted(values: (string | undefined | null)[]): string[] {
  return Array.from(
    new Set(values.filter((v): v is string => !!v && !!v.trim()).map((v) => v.trim()))
  ).sort();
}

export interface InventoryFacets {
  makes: string[];
  bodyStyles: string[];
}

/**
 * Makes and body styles a shopper can actually land a result on right now.
 *
 * Backed by useInventory(), which holds the build-time seed until the live
 * fetch resolves and then swaps — so the server-rendered HTML and the first
 * client render agree (no hydration mismatch) and the options self-correct
 * as soon as live data arrives.
 */
export function useInventoryFacets(): InventoryFacets {
  const { vehicles } = useInventory();
  const visible = useVisibleVehicles(vehicles).filter((v) => v.status !== "sold");
  return {
    makes: uniqueSorted(visible.map((v) => v.make)),
    bodyStyles: uniqueSorted(visible.map((v) => v.bodyStyle)),
  };
}
