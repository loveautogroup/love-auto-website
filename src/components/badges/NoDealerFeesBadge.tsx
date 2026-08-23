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
 * SIZE: matched to the Google lockup beside it (owner, 2026-08-23 — "the
 * 'No dealer fees' should be larger and match the google review badge").
 * Measured live on the desktop VDP: the mark was 140.5px wide against the
 * lockup's 239.8px, i.e. 0.59x. 13px -> 22px puts it at 237.8px, within 1%.
 * The mobile size moves with it so the ratio holds at both breakpoints —
 * both marks sit in the same scaled cluster, so it is the RATIO that has to
 * be right, not either number on its own.
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
          ${compact ? "text-[19px] sm:text-[22px]" : "text-[22px]"}
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
        className={`block bg-brand-red ${compact ? "mt-[7px] h-[3px]" : "mt-[14px] h-[3px]"}`}
        aria-hidden="true"
      />
    </div>
  );
}
