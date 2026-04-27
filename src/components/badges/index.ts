/**
 * Vehicle photo badges — barrel export.
 *
 * Used by VehicleCard.tsx to compose the overlay system on vehicle photos.
 * Positions: CarfaxBadge (top-left) or StatusPill (top-left fallback),
 * FeaturePillCluster (top-center), WarrantyBadge (bottom-left),
 * PhoneCTA (bottom-center), DealerCluster (bottom-right).
 * PhotoScrim renders behind all badges to guarantee legibility.
 */

export { default as CarfaxBadge } from "./CarfaxBadge";
export { default as CarfaxPillStack } from "./CarfaxPillStack";
export { default as DealerCluster } from "./DealerCluster";
export { default as FeaturePillCluster } from "./FeaturePillCluster";
export { default as PhoneCTA } from "./PhoneCTA";
export { default as PhotoScrim } from "./PhotoScrim";
export { default as StatusPill } from "./StatusPill";
export { default as WarrantyBadge } from "./WarrantyBadge";
