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
}

export default function FeaturePillCluster({ pills }: FeaturePillClusterProps) {
  const visible = (pills ?? []).filter((p): p is string => Boolean(p && p.trim()));
  if (visible.length === 0) return null;

  return (
    <div
      className="
        absolute top-4 left-1/2 -translate-x-1/2
        flex gap-1.5 justify-center flex-nowrap
        z-10
      "
      style={{ maxWidth: "calc(100% - 140px)" }}
    >
      {visible.map((pill, i) => {
        const lines = pill.split("\n");
        return (
          <div
            key={i}
            className="
              rounded-full px-3 py-1.5
              text-[11px] font-bold leading-tight text-white text-center
              shadow-[0_2px_4px_rgba(0,0,0,0.25)]
              backdrop-blur-sm
              min-w-[72px] max-w-[120px]
            "
            style={{ backgroundColor: "rgba(37, 99, 235, 0.92)" }}
          >
            {lines.map((line, li) => (
              <span key={li} className="block">
                {line}
              </span>
            ))}
          </div>
        );
      })}
    </div>
  );
}
