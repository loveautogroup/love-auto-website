/**
 * Feature pills cluster — top-RIGHT slot over the vehicle photo.
 *
 * Jordan-authored custom copy per vehicle. Up to 5 pills, each supports a
 * two-line break via \n in full mode.
 *
 * Heavy frosted-glass treatment — pills are 18% opacity dark over a
 * blurred backdrop so the photo reads through clearly. White text with
 * a hard-edge shadow keeps the copy legible against any photo subject.
 * Matches the unified overlay aesthetic used by the warranty + dealer
 * cluster badges (no more standalone blue-tinted boxes).
 *
 * Layout: anchored to the right edge of the photo, stacked vertically.
 * This keeps CARFAX's top-left slot uncontested and creates a clean
 * vertical column of merchandising callouts at any aspect ratio.
 */

interface FeaturePillClusterProps {
  /** Up to 5 pills. Entries may include \n for a two-line break (full mode only). */
  pills?: readonly [string?, string?, string?, string?, string?];
  /** Compact mode for inventory cards — smaller text, single line, fewer pills. */
  compact?: boolean;
  /**
   * Layout mode:
   *  - undefined (default, legacy): absolutely positioned at top-right of
   *    the photo, stacked vertically and right-aligned.
   *  - "inline": no absolute positioning — parent flex column controls
   *    placement. Pill text + container alignment inherit from the
   *    parent (typically items-end for the right-side merchandising
   *    column on PhotoGallery / VehicleCard).
   */
  stack?: "inline";
}

export default function FeaturePillCluster({
  pills,
  compact,
  stack,
}: FeaturePillClusterProps) {
  const visible = (pills ?? []).filter((p): p is string => Boolean(p && p.trim()));
  if (visible.length === 0) return null;

  // Compact mode: cap to 2 pills max (inventory cards stay clean).
  // Full mode: render up to 5 — with the merchandising panel now offering
  // 5 slots, the VDP photo overlay needs to surface them all.
  const limit = compact ? 2 : 5;
  const shown = visible.slice(0, limit);

  // Container layout differs by stack mode. Left-stack mode is inline
  // (parent column handles positioning); legacy mode is absolutely
  // positioned at top-right of the photo. Both use vertical stacking.
  const containerClass =
    stack === "inline"
      ? `flex flex-col items-end ${compact ? "gap-0.5 sm:gap-1 max-w-[60%]" : "gap-1 sm:gap-1.5 max-w-[55%]"}`
      : `absolute right-1.5 sm:right-2 z-10 flex flex-col items-end ${compact ? "top-1.5 sm:top-2 gap-0.5 sm:gap-1 max-w-[55%]" : "top-2 sm:top-3 gap-1 sm:gap-1.5 max-w-[45%]"}`;

  // Pill text alignment is right-aligned in both modes — the cluster sits
  // on the right side of the photo, so right-aligned text reads cleanly.
  const textAlign = "text-right";

  return (
    <div className={containerClass}>
      {shown.map((pill, i) => {
        const lines = pill.split("\n");
        return (
          <div
            key={i}
            className={`
              rounded-full text-white ${textAlign}
              border border-white/25
              shadow-[0_2px_6px_rgba(0,0,0,0.35)]
              ${compact
                ? "px-1.5 py-[1px] text-[9px] sm:px-2 sm:py-0.5 sm:text-[10px] font-bold leading-tight"
                : "px-2.5 py-1 text-[12px] sm:px-3 sm:py-1.5 sm:text-[14px] font-bold leading-tight"}
            `}
            style={{
              // Heavy frosted glass — 18% dark fill over a strong blur lets
              // the photo show through clearly while keeping white text crisp.
              // Same recipe as WarrantyBadge / DealerCluster for visual unity.
              backgroundColor: "rgba(15, 23, 42, 0.18)",
              backdropFilter: "blur(10px) saturate(1.4)",
              WebkitBackdropFilter: "blur(10px) saturate(1.4)",
              textShadow:
                "0 0 1px rgba(0,0,0,0.95), 1px 1px 1px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.7)",
            }}
          >
            {compact
              ? <span className="block whitespace-nowrap truncate">{lines.join(" ")}</span>
              : lines.map((line, li) => <span key={li} className="block whitespace-nowrap">{line}</span>)
            }
          </div>
        );
      })}
    </div>
  );
}
