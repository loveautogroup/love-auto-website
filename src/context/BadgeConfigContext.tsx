"use client";

/**
 * BadgeConfigContext — makes the global photo-badge config reachable from
 * client components that aren't on the VDP.
 *
 * The VDP page already fetches this config at build time and hands it
 * straight to <PhotoGallery badgeConfig={...} />. Inventory *cards*
 * (VehicleCard) render the same badges but sit behind six different grid
 * components across many pages, so prop-drilling the config to them would
 * mean touching every render site and every page that mounts one.
 *
 * Instead this mirrors the existing ReviewsProvider pattern: the root
 * layout (a Server Component) fetches the config once at build time and
 * publishes it here, and any client component reads it with
 * useBadgeConfig(). One plumbing point, no per-grid changes.
 *
 * The default value is BADGE_CONFIG_FALLBACK — the same "everything on"
 * fallback dmsInventory.ts uses when the DMS is unreachable — so a card
 * rendered outside the provider behaves exactly as it did before this
 * context existed.
 */

import { createContext, useContext } from "react";
import {
  BADGE_CONFIG_FALLBACK,
  type GlobalBadgeConfig,
} from "@/lib/dmsInventory";

const BadgeConfigContext = createContext<GlobalBadgeConfig>(BADGE_CONFIG_FALLBACK);

export function BadgeConfigProvider({
  value,
  children,
}: {
  value: GlobalBadgeConfig;
  children: React.ReactNode;
}) {
  return (
    <BadgeConfigContext.Provider value={value}>
      {children}
    </BadgeConfigContext.Provider>
  );
}

export function useBadgeConfig(): GlobalBadgeConfig {
  return useContext(BadgeConfigContext);
}
