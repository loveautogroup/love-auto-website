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
  /** Compact mode for inventory cards — smaller font. */
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
      <span
        className={
          compact
            ? "text-[12px] sm:text-[13px] font-semibold"
            : "text-[20px] sm:text-[23px] font-semibold"
        }
        // Montserrat (the "AUTO GROUP" wordmark font) letter-spaced — matches
        // the bottom-center URL badge so the two read as a pair
        // (Jeremiah 2026-06-08).
        style={{
          fontFamily: "var(--font-montserrat), 'Arial Black', sans-serif",
          letterSpacing: "0.12em",
        }}
      >
        {phone}
      </span>
    </a>
  );
}

/**
 * URL badge — bottom-center slot. The dealership URL in the same Montserrat
 * letter-spaced treatment as PhoneCTA so the two match across the bottom
 * row (phone bottom-left, URL bottom-center, Google bottom-right).
 * Display text is uppercase; not a link (pure branding, mirrors the bake).
 */
export function UrlBadge({ compact }: { compact?: boolean }) {
  return (
    <span
      className={
        compact
          ? "text-[11px] sm:text-[12px] font-semibold text-white whitespace-nowrap select-none"
          : "text-[20px] sm:text-[23px] font-semibold text-white whitespace-nowrap select-none"
      }
      style={{
        fontFamily: "var(--font-montserrat), 'Arial Black', sans-serif",
        letterSpacing: "0.12em",
        textShadow:
          "0 0 1px rgba(0,0,0,0.95), 1px 1px 1px rgba(0,0,0,0.95), -1px -1px 1px rgba(0,0,0,0.95), 0 2px 8px rgba(0,0,0,0.7)",
      }}
      aria-hidden="true"
    >
      LOVEAUTOGROUP.NET
    </span>
  );
}
