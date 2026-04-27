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
        // Layered shadow: hard 1px outline at every angle for letter
        // edges + soft glow for depth. Lets the phone number stay
        // legible over light/cluttered photos without needing a fill.
        textShadow:
          "0 0 1px rgba(0,0,0,0.95), 1px 1px 1px rgba(0,0,0,0.95), -1px -1px 1px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.7)",
      }}
      aria-label={`Call or text us at ${phone}`}
    >
      {!compact && (
        <span className="text-[16px] sm:text-[18px] font-semibold mr-2 text-[#E2E8F0]">
          Call/Txt
        </span>
      )}
      <span
        className={
          compact
            ? "text-[12px] sm:text-[13px] font-extrabold"
            : "text-[22px] sm:text-[26px] font-extrabold"
        }
        style={{ letterSpacing: "-0.01em" }}
      >
        {phone}
      </span>
    </a>
  );
}
