/**
 * Feature pills cluster — top-center slot over the vehicle photo.
 *
 * Jordan-authored custom copy per vehicle. Up to 3 pills, each supports a
 * two-line break via \n. Blue glassmorphism styling for photo-agnostic
 * legibility.
 */

interface FeaturePillClusterProps {
  /** Up to 3 pills. Entries may include \n for a two-line break. */
  pills?: readonly [string?, string?, string?];
  /** Compact mode for inventory cards — smaller text, single line, fewer pills. */
  compact?: boolean;
}

export default function FeaturePillCluster({ pills, compact }: FeaturePillClusterProps) {
  const visible = (pills ?? []).filter((p): p is string => Boolean(p && p.trim()));
  if (visible.length === 0) return null;

  // Compact mode: cap to 2 pills max, force single-line, smaller text
  const limit = compact ? 2 : 3;
  const shown = visible.slice(0, limit);

  return (
    <div
      className={`
        absolute left-1/2 -translate-x-1/2
        flex justify-center flex-nowrap z-10
        ${compact ? "top-2 gap-1" : "top-4 gap-1.5"}
      `}
      style={{ maxWidth: compact ? "calc(100% - 80px)" : "calc(100% - 140px)" }}
    >
      {shown.map((pill, i) => {
        const lines = pill.split("\n");
        return (
          <div
            key={i}
            className={`
              rounded-full text-white text-center
              shadow-[0_2px_4px_rgba(0,0,0,0.25)] backdrop-blur-sm
              ${compact
                ? "px-2 py-0.5 text-[10px] font-bold leading-tight max-w-[100px]"
                : "px-3 py-1.5 text-[11px] font-bold leading-tight min-w-[72px] max-w-[120px]"}
            `}
            style={{ backgroundColor: "rgba(37, 99, 235, 0.92)" }}
          >
            {compact
              ? <span className="block whitespace-nowrap truncate">{lines.join(" ")}</span>
              : lines.map((line, li) => <span key={li} className="block">{line}</span>)
            }
          </div>
        );
      })}
    </div>
  );
}
