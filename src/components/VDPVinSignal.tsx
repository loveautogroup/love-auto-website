"use client";

/**
 * VDPVinSignal — sets a `data-vdp-vin` attribute on <body> while a VDP is
 * mounted, so the global floating TextUsButton (mounted in the root layout)
 * can pick up the current vehicle's VIN and apply per-vehicle merchandising
 * overrides like textPhone.
 *
 * Renders nothing. Cleanup on unmount removes the attribute so other pages
 * (homepage, /inventory grid, /contact, etc.) fall back to the dealership
 * default phone.
 *
 * Why this signal pattern: the floating TextUsButton is in `src/app/layout.tsx`
 * which is ABOVE the page tree in the React hierarchy, so it can't read VIN
 * via context from a descendant page. Body dataset is the simplest cross-tree
 * signaling channel that doesn't require restructuring the layout.
 */

import { useEffect } from "react";

interface Props {
  vin: string;
}

export default function VDPVinSignal({ vin }: Props) {
  useEffect(() => {
    document.body.dataset.vdpVin = vin;
    return () => {
      delete document.body.dataset.vdpVin;
    };
  }, [vin]);
  return null;
}
