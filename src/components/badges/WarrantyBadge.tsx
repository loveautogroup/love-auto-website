/**
 * Warranty badge — bottom-left slot. Dark pill with a blue shield icon and
 * two-line text ("30-Day Warranty" primary, "Extended coverage available"
 * secondary).
 */

interface WarrantyBadgeProps {
  /** Primary warranty text, e.g. "30-Day Warranty". */
  copy: string;
  /** Secondary text shown under the primary, defaults to extended coverage note. */
  subCopy?: string;
  /** Compact mode for inventory cards — smaller, no subcopy. */
  compact?: boolean;
}

export default function WarrantyBadge({
  copy,
  subCopy = "Extended coverage available",
  compact,
}: WarrantyBadgeProps) {
  return (
    <div
      className={`
        inline-flex items-center rounded-full text-white
        border border-white/25
        shadow-[0_2px_6px_rgba(0,0,0,0.35)]
        ${compact
          ? "gap-0.5 pl-1 pr-1.5 py-0.5 sm:gap-1 sm:pl-1.5 sm:pr-2 sm:py-1"
          : "gap-1.5 pl-2 pr-3 py-1.5"}
      `}
      style={{
        backgroundColor: "rgba(15, 23, 42, 0.18)",
        backdropFilter: "blur(10px) saturate(1.4)",
        WebkitBackdropFilter: "blur(10px) saturate(1.4)",
        textShadow:
          "0 0 1px rgba(0,0,0,0.95), 1px 1px 1px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.7)",
      }}
    >
      <div
        className={`
          flex items-center justify-center rounded-full flex-shrink-0 bg-[#2563EB]
          ${compact
            ? "w-[13px] h-[13px] sm:w-[16px] sm:h-[16px]"
            : "w-[20px] h-[20px]"}
        `}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 24 24"
          className={
            compact
              ? "w-2 h-2 sm:w-2.5 sm:h-2.5 fill-white"
              : "w-3 h-3 fill-white"
          }
        >
          <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4zm-1 14l-4-4 1.4-1.4L11 13.2l5.6-5.6L18 9l-7 7z" />
        </svg>
      </div>
      {compact ? (
        <span className="text-[9px] sm:text-[10px] font-bold whitespace-nowrap">
          {copy}
        </span>
      ) : (
        <div className="flex flex-col leading-tight">
          <span className="text-[11px] font-bold">{copy}</span>
          <span className="text-[9px] font-medium text-[#CBD5E1]">{subCopy}</span>
        </div>
      )}
    </div>
  );
}
