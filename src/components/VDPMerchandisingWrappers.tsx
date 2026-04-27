"use client";

/**
 * Client wrappers around VDP overlay-dependent renders.
 *
 * The VDP page is a Server Component that bakes overlay decisions at
 * Cloudflare Pages build time using the constant from src/data/merchandising.ts.
 * That misses any merchandising changes saved through the DMS panel after
 * the last build (those go to KV, not source). These wrappers run on the
 * client, fetch /api/merchandising via useResolveOverlay, and decide whether
 * to render their wrapped content based on live KV data.
 *
 * Initial render: matches build-time decision (overlay from constant), so
 * server-rendered HTML and first paint are correct.
 * After hook resolves: re-render with KV data, showing/hiding as the DMS
 * panel intends.
 *
 * One-trick wrappers, not a full Provider — keeps the change surgical.
 */

import ShowCarfaxButton from "@/components/ShowCarfaxButton";
import VDPMarketPrice from "@/components/VDPMarketPrice";
import { useResolveOverlay } from "@/data/useMerchandising";

interface BaseProps {
  vin: string;
  daysOnLot: number;
  vehicleStatus: "available" | "sale-pending" | "sold" | "coming-soon";
}

interface CarfaxProps extends BaseProps {
  variant: "inline" | "wide";
  /** className passthrough for the wrapping <div> when needed. */
  wrapperClassName?: string;
}

/**
 * Renders <ShowCarfaxButton> if overlay.carfax === true at runtime.
 * Wraps in a div with mt-3 spacing for the inline variant, pt-1 for the
 * wide variant — matches the inline JSX it replaces on the VDP.
 */
export function VDPCarfaxButton({
  vin,
  daysOnLot,
  vehicleStatus,
  variant,
  wrapperClassName,
}: CarfaxProps) {
  const overlay = useResolveOverlay(vin, daysOnLot, vehicleStatus);
  if (overlay.carfax !== true) return null;
  const cls =
    wrapperClassName ?? (variant === "inline" ? "mt-3" : "pt-1");
  return (
    <div className={cls}>
      <ShowCarfaxButton vin={vin} variant={variant} />
    </div>
  );
}

interface MarketPriceProps extends BaseProps {
  askingPrice: number;
}

/**
 * Renders <VDPMarketPrice> if overlay.marketEstimate is set at runtime.
 * Falls back to the build-time bake (no render) until the hook resolves
 * — same behavior as the previous {overlay.marketEstimate && ...} JSX.
 */
export function VDPMarketPriceWrap({
  vin,
  daysOnLot,
  vehicleStatus,
  askingPrice,
}: MarketPriceProps) {
  const overlay = useResolveOverlay(vin, daysOnLot, vehicleStatus);
  if (!overlay.marketEstimate) return null;
  return (
    <div className="mt-4 lg:mt-6">
      <VDPMarketPrice
        askingPrice={askingPrice}
        marketEstimate={overlay.marketEstimate}
      />
    </div>
  );
}
