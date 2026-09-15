/**
 * "Our own photo" test — mirrors dms-inventory-api routers/public.py's
 * `_has_own_photos()`. A DealerCenter thumbnail fallback is written by
 * Railway's `_fetch_missing_photo_from_dc()` (routers/photos.py), named
 * `dc-<hash>.jpg`, and is the ONLY photo a car ever gets from that path —
 * a vehicle whose sole photo matches this pattern is standing in for a
 * picture nobody actually took of it.
 *
 * Railway already decides which sold vehicles keep a PAGE (see
 * _publicly_renderable / _sold_with_own_photos_ids). This helper answers a
 * narrower, website-only question: does a sold vehicle earn a SLOT in the
 * inventory grid? Jeremiah, 2026-09-15: "Our photos only." A car sold
 * within the last 30 days but with no real photo still gets a page (a
 * bookmark or a CarGurus link should not dead-end) but should not appear
 * in the grid — same as before this feature existed. A car with a real
 * photo appears in the grid regardless of how long ago it sold.
 *
 * PARITY: keep this in lockstep with routers/public.py's `_has_own_photos`.
 */
export function hasOwnPhoto(
  images: readonly (string | null | undefined)[] | null | undefined
): boolean {
  if (!images || images.length === 0) return false;
  return images.some((url) => {
    if (!url) return false;
    const clean = url.split("?", 1)[0] ?? url;
    const filename = clean.substring(clean.lastIndexOf("/") + 1);
    return filename.length > 0 && !filename.startsWith("dc-");
  });
}
