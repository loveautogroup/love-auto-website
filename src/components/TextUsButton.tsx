"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { SITE_CONFIG } from "@/lib/constants";
import { useMerchandising } from "@/data/useMerchandising";

/**
 * Floating "Text Us" CTA — desktop-only.
 *
 * Hidden on mobile because:
 *   - The header already shows a green phone button on mobile
 *   - The VDP has its own sticky CTA bar at the bottom (Call/Text/Calc)
 *   - Two FABs at the same screen edge crowds the layout and overlaps content
 *
 * On desktop, this is a passive secondary CTA that lives in the corner.
 *
 * VIN-aware on VDPs: when the VDP page mounts a VDPVinSignal component,
 * `document.body.dataset.vdpVin` is set. We read it here, look up the
 * per-vehicle textPhone override from /api/merchandising (via the cached
 * useMerchandising hook), and prefer the salesperson's number over the
 * dealership default. Off VDPs (homepage, inventory grid, contact, etc.)
 * the dataset attribute is absent and we fall back to SITE_CONFIG.phoneRaw.
 */

const DEFAULT_BODY = "Hi, I'm interested in a vehicle on your lot.";

function buildHref(phoneRaw: string, bodyRaw: string): string {
  return `sms:${phoneRaw}?body=${encodeURIComponent(bodyRaw)}`;
}

export default function TextUsButton() {
  const pathname = usePathname();
  const config = useMerchandising();
  const [vdpVin, setVdpVin] = useState<string | null>(null);

  // Re-read the body dataset on every pathname change. The VDPVinSignal
  // component sets it from useEffect, so we have to wait a tick after
  // navigation for it to populate. A microtask + a fallback frame
  // covers both same-page rerenders and SPA route transitions.
  useEffect(() => {
    let cancelled = false;
    const read = () => {
      if (cancelled) return;
      setVdpVin(document.body.dataset.vdpVin ?? null);
    };
    read();
    const t = setTimeout(read, 50);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [pathname]);

  // Resolve which phone the link should point at:
  //   per-vehicle overlay > global merchandising textPhone > dealership default
  let phone = SITE_CONFIG.phoneRaw;
  let body = DEFAULT_BODY;
  if (vdpVin) {
    const overlayPhone = config.overlays?.[vdpVin]?.textPhone;
    if (overlayPhone && /^[0-9]{10,15}$/.test(overlayPhone)) {
      phone = overlayPhone;
      // Slightly more contextual body text when on a vehicle page.
      body = "Hi, I'm interested in this vehicle on your website.";
    } else if (config.textPhone && /^[0-9]{10,15}$/.test(config.textPhone)) {
      phone = config.textPhone;
    }
  } else if (config.textPhone && /^[0-9]{10,15}$/.test(config.textPhone)) {
    phone = config.textPhone;
  }

  return (
    <a
      href={buildHref(phone, body)}
      className="hidden lg:flex fixed bottom-6 right-6 z-40 items-center gap-2 bg-brand-green hover:bg-green-600 text-white pl-4 pr-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all group"
      aria-label="Text us"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="w-6 h-6"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
      <span className="font-semibold text-sm">Text Us</span>
    </a>
  );
}
