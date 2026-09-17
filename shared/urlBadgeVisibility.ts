/**
 * Whether the HTML "LOVEAUTOGROUP.NET" badge draws on a photo.
 *
 * One rule for the VDP hero (PhotoGallery, bottom-centre) and the grid card
 * (VehicleCard, under the phone). Owner, 2026-09-17: "make the website honor
 * the toggle too." Until then the per-vehicle "Website URL" switch in the DMS
 * workspace reached the bake, the DealerCenter download and the DMS preview,
 * and the site ignored it: this badge was the one mark on the page that read
 * no config at all.
 *
 * `vehicleEnabled` is the RESOLVED per-vehicle value from the DMS feed
 * (global defaults with the car's pinned override on top). `globalEnabled`
 * is the site-wide fallback from /api/badge-config/global-public. Both are
 * opt-OUT: only an explicit `false` hides, so a feed or config that predates
 * the field keeps today's behaviour. A baked hero already carries the mark in
 * its pixels; a placeholder carries nothing.
 */
export interface UrlBadgeInputs {
  hasBakedHero: boolean;
  hasRealPhotos: boolean;
  forcePlaceholder: boolean;
  globalEnabled?: boolean | null;
  vehicleEnabled?: boolean | null;
}

export function urlBadgeVisible(i: UrlBadgeInputs): boolean {
  if (i.hasBakedHero) return false;
  if (!i.hasRealPhotos) return false;
  if (i.forcePlaceholder) return false;
  if (i.globalEnabled === false) return false;
  if (i.vehicleEnabled === false) return false;
  return true;
}
