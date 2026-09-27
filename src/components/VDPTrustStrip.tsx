"use client";

/**
 * Trust strip — displayed on the VDP, homepage, and inventory page.
 *
 * Three credibility pillars for Love Auto Group:
 *   1. Carefully Selected · Free CARFAX on Marked Vehicles
 *   2. Family-Owned Independent Dealer · Over a Decade in Villa Park
 *   3. No Hidden Fees · All Credit Welcome · Same-Day Title & Plates
 *
 * The CARFAX line is a claim about ONE specific car when this strip sits
 * on a VDP (the only call site with a `vehicle` in context) — same
 * false-advertising shape as the badge/button/FAQ: a car whose CARFAX link
 * is not confirmed live must not carry it either. Pass `vehicle` from the
 * VDP; homepage and the inventory grid render with no vehicle (there's no
 * single car to be wrong about there), so the line is worded to hold true
 * as a general statement of the dealership's practice rather than a claim
 * about every car's live link (2026-09-16 — see shared/carfaxVisibility.ts;
 * "Free CARFAX Included" used to render unconditionally here too).
 *
 * Redesign 2026-09: was a red-gradient rounded bar with an icon-in-a-circle
 * per item — exactly the "AI landing page" tell Bob's concept calls out.
 * Now a single flat black uppercase text bar, items separated by a thin
 * vertical rule, no icons, no gradient, no radius — the "trust ticker"
 * pattern from homepage.html reused for real content on three pages.
 */

import { useLanguage } from "@/context/LanguageContext";
import { useResolveOverlay } from "@/data/useMerchandising";

interface VDPTrustStripProps {
  vehicle?: {
    vin: string;
    daysOnLot: number;
    status: "available" | "sale-pending" | "sold" | "coming-soon";
    recentlyReduced?: boolean;
  };
}

export default function VDPTrustStrip({ vehicle }: VDPTrustStripProps = {}) {
  const { t } = useLanguage();
  // Hooks can't be called conditionally — always call it, feed it an inert
  // VIN when there's no vehicle, and ignore the result in that case.
  const overlay = useResolveOverlay(
    vehicle?.vin ?? "",
    vehicle?.daysOnLot ?? 0,
    vehicle?.status ?? "available",
    vehicle?.recentlyReduced ?? false
  );
  const carfaxOk = !vehicle || overlay.carfax === true;

  return (
    <section aria-label="Love Auto Group trust pillars" className="bg-brand-navy mb-4">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex flex-wrap items-center justify-center gap-x-0 gap-y-1.5 py-3">
          <span className="px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white/90 whitespace-nowrap">
            {t.vdpTrustStrip.inspected}
            {carfaxOk && (
              <span className="hidden md:inline text-ink-400 font-semibold">
                {" "}
                &middot; {t.vdpTrustStrip.inspectedSuffix}
              </span>
            )}
          </span>

          <span className="hidden sm:inline-block w-px h-3.5 bg-white/[.14]" aria-hidden="true" />

          <span className="px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white/90 whitespace-nowrap">
            {t.vdpTrustStrip.specialist}
            <span className="hidden md:inline text-ink-400 font-semibold">
              {" "}
              &middot; {t.vdpTrustStrip.specialistSuffix}
            </span>
          </span>

          <span className="hidden sm:inline-block w-px h-3.5 bg-white/[.14]" aria-hidden="true" />

          <span className="px-4 text-[11px] font-bold uppercase tracking-[0.14em] text-white/90 whitespace-nowrap">
            {t.vdpTrustStrip.noFees}
            <span className="hidden md:inline text-ink-400 font-semibold">
              {" "}
              &middot; {t.vdpTrustStrip.noFeesSuffix}
            </span>
          </span>
        </div>
      </div>
    </section>
  );
}
