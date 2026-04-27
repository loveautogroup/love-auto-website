/**
 * Status pill — top-left slot when Carfax is absent.
 *
 * One of: Just Arrived, Price Reduced, Price Drop, Staff Pick, Low Mileage,
 * Sale Pending. Jordan picks via the merchandising config.
 */

import { StatusBadgeKind } from "@/data/merchandising";

interface StatusPillProps {
  kind: StatusBadgeKind;
}

const VARIANTS: Record<
  StatusBadgeKind,
  { label: string; className: string }
> = {
  "just-arrived": { label: "Just Arrived", className: "bg-[#16A34A] text-white" },
  "price-reduced": { label: "Price Reduced", className: "bg-[#F59E0B] text-[#0F172A]" },
  "price-drop": { label: "Price Drop", className: "bg-[#DC2626] text-white" },
  "staff-pick": { label: "Staff Pick", className: "bg-[#2563EB] text-white" },
  "low-mileage": { label: "Low Mileage", className: "bg-[#0D9488] text-white" },
  "sale-pending": { label: "Sale Pending", className: "bg-[#64748B] text-white" },
  "hot-deal": { label: "Hot Deal", className: "bg-[#DC2626] text-white" },
  "great-deal": { label: "Great Deal", className: "bg-[#059669] text-white" },
  "below-market": { label: "Below Market", className: "bg-[#0EA5E9] text-white" },
  "managers-special": { label: "Manager's Special", className: "bg-[#7C3AED] text-white" },
  "reconditioned": { label: "Reconditioned", className: "bg-[#0891B2] text-white" },
  "off-lease": { label: "Off-Lease", className: "bg-[#65A30D] text-white" },
  "trade-in": { label: "Trade-In", className: "bg-[#A16207] text-white" },
  "new-arrival": { label: "New Arrival", className: "bg-[#1B3A5C] text-white" },
  "must-see": { label: "Must See", className: "bg-[#BE185D] text-white" },
  "rare-find": { label: "Rare Find", className: "bg-[#9333EA] text-white" },
  "loaded": { label: "Loaded", className: "bg-[#1F2937] text-white" },
  "make-offer": { label: "Make Offer", className: "bg-[#F59E0B] text-[#1F2937]" },
};

export default function StatusPill({ kind }: StatusPillProps) {
  const { label, className } = VARIANTS[kind];
  return (
    <span
      className={`
        inline-block rounded-md
        px-2.5 py-1 text-[12px] font-semibold leading-none
        shadow-[0_2px_4px_rgba(0,0,0,0.15)]
        ${className}
      `}
    >
      {label}
    </span>
  );
}
