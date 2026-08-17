/**
 * "NO DEALER FEES" mark — bottom-right of the vehicle hero, above the Google
 * lockup.
 *
 * Uppercase headline over a rule in the logo red. No container, deliberately:
 * the phone number and website URL along the bottom of the hero are already
 * unpilled drop-shadowed type, so this joins that language rather than adding
 * another pill shape to a photo that already carries several.
 *
 * ⚠ BAKE RULES (CLAUDE.md): this must stay pixel-equivalent to
 * `composite_no_fee_badge` in dms-inventory-api/photo_overlay.py and to the
 * copy in love-auto-dms VdpHeroReplica.tsx. Change one, change all three in
 * the same commit — the baked hero is what DealerCenter republishes to
 * CarGurus, and it is supposed to match what a shopper sees here.
 *
 * ⚠ No container means legibility depends on the photo behind it. Measured
 * across the five live heroes 2026-08-15: backdrop luminance 117-150 (asphalt),
 * white type reads well. A hero against sky, snow or a white wall is the
 * failure case; the fix there is a scrim, not a smaller mark.
 */

interface NoDealerFeesBadgeProps {
  /** Defaults to the standing claim; overridable from the badge config. */
  copy?: string;
  /** Compact mode for inventory cards. */
  compact?: boolean;
}

export default function NoDealerFeesBadge({
  copy = "No Dealer Fees",
  compact,
}: NoDealerFeesBadgeProps) {
  return (
    <div className={compact ? "inline-block" : "inline-block"}>
      <span
        className={`
          block font-extrabold uppercase leading-none text-white whitespace-nowrap
          ${compact ? "text-[11px] sm:text-[13px]" : "text-[22px]"}
        `}
        style={{
          // Matches the multi-pass shadow the bake draws, and the treatment
          // already used by the phone and URL text.
          textShadow:
            "2px 2px 0 rgba(0,0,0,0.75), 0 2px 0 rgba(0,0,0,0.6), 2px 0 0 rgba(0,0,0,0.6), 0 2px 6px rgba(0,0,0,0.5)",
        }}
      >
        {copy}
      </span>
      {/* Rule in the logo red (#dc2626, the LOVE wordmark fill), spanning the
          headline exactly — the same accent device the logo itself uses. */}
      <span
        className={`block bg-brand-red ${compact ? "mt-1 h-[2px]" : "mt-[14px] h-[3px]"}`}
        aria-hidden="true"
      />
    </div>
  );
}
