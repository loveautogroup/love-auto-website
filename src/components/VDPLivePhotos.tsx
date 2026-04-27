"use client";

/**
 * VDPLivePhotos — drop-in replacement for the static <PhotoGallery>
 * call on the VDP. Mirrors the VDPLivePrice / VDPLiveMileage /
 * VDPLiveStatus pattern: render with the seed images first (so SSR
 * + non-JS visitors and SEO crawlers see real photo URLs), then once
 * useInventory() hydrates with the live DMS snapshot, swap in the
 * live photos array if it's non-empty.
 *
 * Why this exists: a couple of seed inventory entries were declared
 * with generateImagePaths() pointing at /public/images/inventory/...
 * directories that don't exist on disk (typo'd slug). The VDP rendered
 * gray placeholders. The live /api/inventory endpoint already returns
 * the real DealerCenter CDN URLs, so this component closes the gap
 * at hydration without rebuilding the seed file every time photos
 * change.
 *
 * The hero + thumbnail layout itself lives in <PhotoGallery>; this
 * wrapper just chooses which image list to feed it. That keeps the
 * Maxim-style overlay + photo-order manifest behavior identical to
 * the previous inline call site.
 */

import { useInventory } from "@/lib/useInventory";
import type { Vehicle } from "@/lib/types";
import PhotoGallery from "./PhotoGallery";

interface VDPLivePhotosProps {
  vin: string;
  seedImages: string[];
  alt: string;
  vehicle: Vehicle;
}

const COMING_SOON_PLACEHOLDER = "/images/coming-soon.svg";

export default function VDPLivePhotos({
  vin,
  seedImages,
  alt,
  vehicle,
}: VDPLivePhotosProps) {
  const { vehicles, source } = useInventory();

  // Until the live snapshot is in, render the seed images. This is
  // also the SSR/no-JS path — the HTML emitted at build time uses
  // seedImages directly.
  let images = seedImages;
  if (source !== "fallback") {
    const live = vehicles.find((v) => v.vin === vin);
    if (live && Array.isArray(live.images) && live.images.length > 0) {
      images = live.images;
    }
  }

  // Hard fallback — when both the seed file AND the live DMS snapshot
  // have zero images for this vehicle, show the branded "Coming Soon"
  // placeholder so the gallery never renders an empty gray box. The
  // PhotoGallery component treats /placeholder paths as "no real photos"
  // (hasRealPhotos === false), so we route a single placeholder URL
  // that the component will paint as the hero image AND the thumbs
  // get the empty-state SVG.
  const hasAnyImage = Array.isArray(images) && images.length > 0;
  const finalImages = hasAnyImage ? images : [COMING_SOON_PLACEHOLDER];

  return <PhotoGallery images={finalImages} alt={alt} vehicle={vehicle} />;
}
