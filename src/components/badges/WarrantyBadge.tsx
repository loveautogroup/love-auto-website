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
        shadow-[0_2px_4px_rgba(0,0,0,0.25)] backdrop-blur-sm
        ${compact ? "gap-1 pl-1.5 pr-2 py-1" : "gap-2 pl-2.5 pr-3.5 py-2"}
      `}
      style={{ backgroundColor: "rgba(15, 23, 42, 0.78)" }}
    >
      <div
        className={`
          flex items-center justify-center rounded-full flex-shrink-0 bg-[#2563EB]
          ${compact ? "w-[16px] h-[16px]" : "w-[22px] h-[22px]"}
        `}
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" className={compact ? "w-2.5 h-2.5 fill-white" : "w-3 h-3 fill-white"}>
          <path d="M12 2L4 6v6c0 5.5 3.8 10.7 8 12 4.2-1.3 8-6.5 8-12V6l-8-4zm-1 14l-4-4 1.4-1.4L11 13.2l5.6-5.6L18 9l-7 7z" />
        </svg>
      </div>
      {compact ? (
        <span className="text-[10px] font-bold whitespace-nowrap">{copy}</span>
      ) : (
        <div className="flex flex-col leading-tight">
          <span className="text-[12px] font-bold">{copy}</span>
          <span className="text-[10px] font-medium text-[#CBD5E1]">{subCopy}</span>
        </div>
      )}
    </div>
  );
}
