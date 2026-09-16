/**
 * Decide whether a vehicle's CARFAX badge, the "Show me the CARFAX" button,
 * and the CARFAX FAQ answer may render for a given merchandising overlay.
 *
 * ONE rule, imported everywhere CARFAX visibility is decided — the client
 * hook (useMerchandising.ts, drives PhotoGallery / VehicleCard /
 * VDPCarfaxButton / VDPFAQ after hydration) and the build-time server copy
 * (merchandising.ts resolveOverlay). Two hand-maintained copies of this
 * rule is exactly how it broke: one checked `carfaxLinkLive`, the other
 * never did.
 *
 * FAILS CLOSED. CARFAX visibility needs a real yes from TWO different
 * owners before anything CARFAX-branded renders:
 *   carfax         — "do we want to advertise CARFAX on this car?" (dealer,
 *                     set from the DMS merchandising panel)
 *   carfaxLinkLive — "does the public link actually SERVE a free report
 *                     right now, or does it land the shopper on CARFAX's
 *                     $49.99 paid order page?" (the daily carfax-link-check
 *                     Routine)
 *
 * 2026-09-16 (Jeremiah, live): two newly listed cars (stock 11346, 11342)
 * had NO overlay entry at all in the public /api/merchandising KV blob —
 * the DMS side that is supposed to stamp `carfaxLinkLive:false` the moment
 * a car goes Listed had stopped doing it. Under the old rule ("both default
 * ON when absent"), an absent verdict rendered the badge AND sent shoppers
 * to `https://www.carfax.com/VehicleHistory/p/Report.cfx?partner=DVW_1&vin=…`,
 * which for those two VINs is CARFAX's "Order CARFAX Reports … $49.99"
 * page, not a free report — every newly listed car spent a day or two
 * advertising a paid page as free.
 *
 * So the rule is now the opposite of what it was: CARFAX renders ONLY when
 * `carfaxLinkLive` is explicitly `true`. No entry, `undefined`, or `false`
 * all mean the same thing — stay off that car. `carfax` remains the
 * dealer's own opt-out layered on top: an explicit `false` there always
 * wins even when the link is confirmed live.
 *
 * This intentionally trades "a stalled Routine blanks CARFAX lot-wide"
 * (loud — every car loses the badge, easy to notice and escalate) for
 * never advertising a $49.99 order page as a free report (silent and
 * costs nothing to notice until a customer complains, or Jeremiah checks).
 */
export function carfaxVisible(
  override: { carfax?: boolean; carfaxLinkLive?: boolean } | null | undefined
): boolean {
  if (!override) return false;
  if (override.carfax === false) return false;
  return override.carfaxLinkLive === true;
}
