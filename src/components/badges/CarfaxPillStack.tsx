/**
 * CarfaxPillStack — vertical stack of Carfax-specific highlight pills
 * (1-Owner, No Accidents, Service Records) rendered directly under the
 * Carfax shield in the top-left of the VDP photo overlay.
 *
 * Only renders the flags Jordan has toggled ON in the merchandising
 * panel. Pill text is one of the variant phrasings stored at
 * `overlay.carfax{One,Accidents,Service}OwnerVariant`; falls back to
 * variant 0 (the safe canonical phrasing) when the index is missing.
 *
 * Visual treatment matches FeaturePillCluster — heavy frosted glass
 * over the photo, white text with a hard shadow for legibility — but
 * with a Carfax-green accent border so the trust-signal pills read as
 * a coherent group with the shield above them.
 */

import { CARFAX_PILL_VARIANTS, type VehicleOverlay } from "@/data/merchandising";

interface CarfaxPillStackProps {
  overlay: VehicleOverlay;
  /** Compact mode for inventory cards — smaller text, single line. */
  compact?: boolean;
}

function clampIndex(i: number | undefined, len: number): number {
  if (typeof i !== "number" || !Number.isFinite(i)) return 0;
  return Math.min(Math.max(0, Math.floor(i)), len - 1);
}

export default function CarfaxPillStack({ overlay, compact }: CarfaxPillStackProps) {
  // Only render if at least one flag is on. We intentionally accept
  // exact `true` (not just truthy) so an unset field doesn't render.
  const items: Array<{ key: string; pill: string }> = [];
  if (overlay.carfaxOneOwner === true) {
    const idx = clampIndex(overlay.carfaxOneOwnerVariant, CARFAX_PILL_VARIANTS.oneOwner.length);
    items.push({ key: "oneOwner", pill: CARFAX_PILL_VARIANTS.oneOwner[idx].pill });
  }
  if (overlay.carfaxNoAccidents === true) {
    const idx = clampIndex(overlay.carfaxNoAccidentsVariant, CARFAX_PILL_VARIANTS.noAccidents.length);
    items.push({ key: "noAccidents", pill: CARFAX_PILL_VARIANTS.noAccidents[idx].pill });
  }
  if (overlay.carfaxServiceRecords === true) {
    const idx = clampIndex(overlay.carfaxServiceRecordsVariant, CARFAX_PILL_VARIANTS.serviceRecords.length);
    items.push({ key: "serviceRecords", pill: CARFAX_PILL_VARIANTS.serviceRecords[idx].pill });
  }

  if (items.length === 0) return null;

  return (
    <div
      className={`flex flex-col items-start ${
        compact ? "gap-0.5 sm:gap-1" : "gap-1 sm:gap-1.5"
      }`}
    >
      {items.map((item) => {
        const lines = item.pill.split("\n");
        return (
          <div
            key={item.key}
            className={`
              rounded-full text-white text-left
              border border-[#00873E]/50
              shadow-[0_2px_6px_rgba(0,0,0,0.35)]
              ${compact
                ? "px-1.5 py-[1px] text-[9px] sm:px-2 sm:py-0.5 sm:text-[10px] font-bold leading-tight"
                : "px-2 py-0.5 text-[9px] sm:px-2.5 sm:py-1 sm:text-[10px] font-bold leading-tight"}
            `}
            style={{
              // Carfax-tinted frosted glass — slightly green-shifted dark
              // fill so the pills read as a Carfax-related cluster paired
              // with the shield above them, distinct from the right-side
              // generic feature pills.
              backgroundColor: "rgba(0, 95, 47, 0.32)",
              backdropFilter: "blur(10px) saturate(1.4)",
              WebkitBackdropFilter: "blur(10px) saturate(1.4)",
              textShadow:
                "0 0 1px rgba(0,0,0,0.95), 1px 1px 1px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.7)",
            }}
          >
            {compact
              ? <span className="block whitespace-nowrap truncate">{lines.join(" ")}</span>
              : lines.map((line, li) => (
                  <span key={li} className="block whitespace-nowrap">
                    {line}
                  </span>
                ))
            }
          </div>
        );
      })}
    </div>
  );
}
