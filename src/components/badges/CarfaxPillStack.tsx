/**
 * CarfaxPillStack — vertical stack of Carfax-specific highlight pills
 * (1-Owner, No Accidents, Service Records, Clean Title, Verified Mileage,
 * No Open Recalls, Personal Use) rendered directly under the Carfax
 * shield in the top-left of the VDP photo overlay.
 *
 * Only renders the flags Jordan has toggled ON in the merchandising
 * panel. Pill text is one of the variant phrasings stored at
 * `overlay.carfax{Flag}Variant`; falls back to variant 0 (the safe
 * canonical phrasing) when the index is missing.
 *
 * Capped at 3 visible pills (Jeremiah default — can be raised to 4 or 5
 * via the constant below). When more than 3 flags are active,
 * the priority order below decides which drop:
 *   oneOwner → noAccidents → serviceRecords → cleanTitle →
 *   verifiedMileage → noOpenRecalls → personalUse
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

/** Max number of Carfax highlight pills rendered at once. Default 3 —
 *  raise to 4 or 5 here if Jeremiah wants more pills visible on the hero. */
const MAX_VISIBLE = 3;

/** Display priority — when more than MAX_VISIBLE flags are active, the
 *  later entries get dropped. Mirrors the order in the DMS merch panel. */
const FLAG_ORDER: Array<{
  key: keyof VehicleOverlay;
  variantKey: keyof VehicleOverlay;
  variantSet: keyof typeof CARFAX_PILL_VARIANTS;
}> = [
  { key: "carfaxOneOwner", variantKey: "carfaxOneOwnerVariant", variantSet: "oneOwner" },
  { key: "carfaxNoAccidents", variantKey: "carfaxNoAccidentsVariant", variantSet: "noAccidents" },
  { key: "carfaxServiceRecords", variantKey: "carfaxServiceRecordsVariant", variantSet: "serviceRecords" },
  { key: "carfaxCleanTitle", variantKey: "carfaxCleanTitleVariant", variantSet: "cleanTitle" },
  { key: "carfaxVerifiedMileage", variantKey: "carfaxVerifiedMileageVariant", variantSet: "verifiedMileage" },
  { key: "carfaxNoOpenRecalls", variantKey: "carfaxNoOpenRecallsVariant", variantSet: "noOpenRecalls" },
  { key: "carfaxPersonalUse", variantKey: "carfaxPersonalUseVariant", variantSet: "personalUse" },
];

export default function CarfaxPillStack({ overlay, compact }: CarfaxPillStackProps) {
  // Build the active item list in priority order, then cap to MAX_VISIBLE.
  // We intentionally accept exact `true` (not just truthy) so an unset
  // field doesn't render.
  const items: Array<{ key: string; pill: string }> = [];
  for (const { key, variantKey, variantSet } of FLAG_ORDER) {
    if (overlay[key] === true) {
      const variants = CARFAX_PILL_VARIANTS[variantSet];
      const idx = clampIndex(overlay[variantKey] as number | undefined, variants.length);
      items.push({ key: String(key), pill: variants[idx].pill });
    }
  }
  const visibleItems = items.slice(0, MAX_VISIBLE);

  if (visibleItems.length === 0) return null;

  return (
    <div
      className={`flex flex-col items-start ${
        compact ? "gap-0.5 sm:gap-1" : "gap-1 sm:gap-1.5"
      }`}
    >
      {visibleItems.map((item) => {
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
                : "px-1 py-[1px] text-[7px] sm:px-1.5 sm:py-[2px] sm:text-[8px] font-bold leading-tight"}
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
