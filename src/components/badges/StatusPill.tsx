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
  "just-arrived": {
    label: "Just Arrived",
    className: "bg-[#16A34A] text-white",
  },
  "price-reduced": {
    label: "Price Reduced",
    className: "bg-[#F59E0B] text-[#0F172A]",
  },
  "price-drop": {
    label: "Price Drop",
    className: "bg-[#DC2626] text-white",
  },
  "staff-pick": {
    label: "Staff Pick",
    className: "bg-[#2563EB] text-white",
  },
  "low-mileage": {
    label: "Low Mileage",
    className: "bg-[#0D9488] text-white",
  },
  "sale-pending": {
    label: "Sale Pending",
    className: "bg-[#64748B] text-white",
  },
};

export default function StatusPill({ kind }: StatusPillProps) {
  const { label, className } = VARIANTS[kind];
  return (
    <span
      className={`
        inline-block rounded-md
        px-3 py-1.5 text-[13px] font-semibold leading-none
        shadow-[0_2px_4px_rgba(0,0,0,0.15)]
        ${className}
      `}
    >
      {label}
    </span>
  );
}
