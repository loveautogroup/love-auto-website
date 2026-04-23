"use client";

import { SITE_CONFIG } from "@/lib/constants";

/**
 * Floating "Text Us" CTA — desktop-only.
 *
 * Hidden on mobile because:
 *   - The header already shows a green phone button on mobile
 *   - The VDP has its own sticky CTA bar at the bottom (Call/Text/Calc)
 *   - Two FABs at the same screen edge crowds the layout and overlaps content
 *
 * On desktop, this is a passive secondary CTA that lives in the corner
 * and doesn't compete with anything.
 */
export default function TextUsButton() {
  return (
    <a
      href={`sms:${SITE_CONFIG.phoneRaw}?body=Hi%2C%20I%27m%20interested%20in%20a%20vehicle%20on%20your%20lot.`}
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
