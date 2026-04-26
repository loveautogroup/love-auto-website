"use client";

/**
 * VDPTextUsLink — client-side wrapper around the "Text Us" SMS link on the
 * vehicle detail page.
 *
 * The existing static-export site bakes the SMS phone number into HTML at
 * build time using `MERCHANDISING.overlays[vin].textPhone` from source code.
 * The DMS merchandising panel writes overlay data to Cloudflare KV at
 * runtime — those writes never reach the static HTML. This component closes
 * that gap for the textPhone field by fetching `/api/merchandising` after
 * mount and overriding the href if a per-vehicle textPhone is set in KV.
 *
 * Server-rendered initial output uses the same defaultPhone the page would
 * have rendered on its own, so users without JS or before hydration still
 * get a working Text Us link to the dealership default.
 *
 * Note: this is a targeted fix for textPhone only. The broader merchandising
 * runtime-overlay migration (Phase 2 in src/data/merchandising.ts) is still
 * a follow-up.
 */

import { useEffect, useState } from "react";

interface Props {
  /** VIN of the vehicle currently being viewed. Used to look up overlay. */
  vin: string;
  /** Default phone (digits only, no country code) baked at build time. */
  defaultPhone: string;
  /** Raw, unencoded message body to prefill in the SMS app. */
  bodyText: string;
  /** Pass-through CSS classes for the rendered <a>. */
  className?: string;
  /** Optional aria-label, e.g. "Text us". */
  ariaLabel?: string;
  /** SVG + label children. */
  children: React.ReactNode;
}

function buildHref(phone: string, bodyText: string): string {
  const encoded = encodeURIComponent(bodyText);
  return `sms:+1${phone}?&body=${encoded}`;
}

export default function VDPTextUsLink({
  vin,
  defaultPhone,
  bodyText,
  className,
  ariaLabel,
  children,
}: Props) {
  const [phone, setPhone] = useState(defaultPhone);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/merchandising")
      .then((res) => {
        // 204 means KV is empty — keep the baked default.
        if (res.status === 204) return null;
        if (!res.ok) return null;
        return res.json();
      })
      .then((cfg) => {
        if (cancelled || !cfg) return;
        const overlayPhone =
          cfg?.overlays?.[vin]?.textPhone ?? cfg?.textPhone ?? null;
        if (
          typeof overlayPhone === "string" &&
          /^[0-9]{10,15}$/.test(overlayPhone)
        ) {
          setPhone(overlayPhone);
        }
      })
      .catch(() => {
        // Silent — keep the baked default. We never want this fetch to
        // break the link.
      });
    return () => {
      cancelled = true;
    };
  }, [vin]);

  return (
    <a
      href={buildHref(phone, bodyText)}
      className={className}
      aria-label={ariaLabel}
    >
      {children}
    </a>
  );
}
