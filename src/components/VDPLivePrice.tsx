"use client";

/**
 * VDPLivePrice / VDPLiveMileage / VDPLiveStatus — drop-in replacements
 * for static price / mileage / status text on the VDP. Renders the seed
 * value first (so SSR + non-JS users see the build-time price), then once
 * useInventory() hydrates with the live DMS snapshot, swaps in the live
 * value if it differs.
 *
 * Why three exports vs one? The seed values come from server-rendered
 * page state and need to be passed in as props — three small components
 * keep the call sites readable and make TypeScript narrowing easy.
 */

import { useInventory } from "@/lib/useInventory";

interface BaseProps {
  vin: string;
  className?: string;
}

const formatPrice = (n: number) => {
  const hasCents = Math.round(n * 100) % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(n);
};

const formatMileage = (n: number) => new Intl.NumberFormat("en-US").format(n);

export function VDPLivePrice({
  vin,
  fallback,
  className,
}: BaseProps & { fallback: string }) {
  const { vehicles, source } = useInventory();
  if (source === "fallback") return <span className={className}>{fallback}</span>;
  const live = vehicles.find((v) => v.vin === vin);
  if (!live || !live.price) return <span className={className}>{fallback}</span>;
  return <span className={className}>{formatPrice(live.price)}</span>;
}

export function VDPLiveMileage({
  vin,
  fallback,
  className,
}: BaseProps & { fallback: string }) {
  const { vehicles, source } = useInventory();
  if (source === "fallback") return <span className={className}>{fallback}</span>;
  const live = vehicles.find((v) => v.vin === vin);
  if (!live || !live.mileage) return <span className={className}>{fallback}</span>;
  return <span className={className}>{formatMileage(live.mileage)}</span>;
}

export function VDPLiveStatus({
  vin,
  fallback,
  className,
}: BaseProps & {
  fallback: "available" | "sale-pending" | "sold";
}) {
  const { vehicles, source } = useInventory();
  const value = (() => {
    if (source === "fallback") return fallback;
    const live = vehicles.find((v) => v.vin === vin);
    return live?.status ?? fallback;
  })();
  if (value === "available") {
    return (
      <span
        className={
          className ??
          "inline-flex items-center gap-1.5 text-sm font-medium text-brand-green"
        }
      >
        <span className="w-2 h-2 bg-brand-green rounded-full animate-pulse" />
        Available
      </span>
    );
  }
  if (value === "sale-pending") {
    return (
      <span
        className={
          className ??
          "inline-flex items-center gap-1.5 text-sm font-medium text-amber-600"
        }
      >
        <span className="w-2 h-2 bg-amber-500 rounded-full" />
        Sale Pending
      </span>
    );
  }
  return (
    <span
      className={
        className ??
        "inline-flex items-center gap-1.5 text-sm font-medium text-brand-gray-500"
      }
    >
      <span className="w-2 h-2 bg-brand-gray-400 rounded-full" />
      Sold
    </span>
  );
}
