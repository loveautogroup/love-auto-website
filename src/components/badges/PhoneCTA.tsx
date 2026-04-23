"use client";

/**
 * Phone CTA — bottom-center slot. Big bold white text with heavy shadow
 * for legibility over any photo.
 *
 * Uses native tel: link so taps on mobile fire the phone dialer.
 * Client component because of the stopPropagation onClick handler (needed
 * so the phone click doesn't also navigate to VDP).
 */

interface PhoneCTAProps {
  /** Display phone number, e.g. "(630) 359-3643". */
  phone: string;
  /** Raw digits for tel: link, e.g. "6303593643". */
  phoneRaw: string;
  /** Compact mode for inventory cards — smaller, no "Call/Txt" prefix. */
  compact?: boolean;
}

export default function PhoneCTA({ phone, phoneRaw, compact }: PhoneCTAProps) {
  return (
    <a
      href={`tel:${phoneRaw}`}
      onClick={(e) => e.stopPropagation()}
      className="inline-block whitespace-nowrap text-white no-underline"
      style={{
        textShadow:
          "0 2px 6px rgba(0,0,0,0.8), 0 0 2px rgba(0,0,0,0.6)",
      }}
      aria-label={`Call or text us at ${phone}`}
    >
      {!compact && (
        <span className="text-[13px] font-semibold mr-1.5 text-[#E2E8F0]">
          Call/Txt
        </span>
      )}
      <span
        className={
          compact
            ? "text-[12px] sm:text-[14px] font-extrabold"
            : "text-[16px] sm:text-[22px] font-extrabold"
        }
        style={{ letterSpacing: "-0.01em" }}
      >
        {phone}
      </span>
    </a>
  );
}
