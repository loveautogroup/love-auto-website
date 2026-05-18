"use client";

import { useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import type { Vehicle } from "@/lib/types";
import VehicleCard from "@/components/VehicleCard";
import { useInventory } from "@/lib/useInventory";
import { sortWithFeaturedFirst } from "@/data/merchandising";
import { useVisibleVehicles } from "@/data/useMerchandising";

interface InventoryGridProps {
  /**
   * Build-time merchandise-ordered fallback. Used as initial render
   * (avoids empty state flash) and whenever the live KV-backed feed is
   * unavailable. Once /api/inventory returns a snapshot, we replace
   * with that — re-applying merchandising sort + status filter.
   */
  vehicles: Vehicle[];
}

const PRICE_TABS = [
  { id: "all",     label: "All Vehicles", min: null,  max: null  },
  { id: "under5",  label: "Under $5K",   min: null,  max: 5000  },
  { id: "5to10",   label: "$5K–$10K",    min: 5000,  max: 10000 },
  { id: "10to20",  label: "$10K–$20K",   min: 10000, max: 20000 },
  { id: "over20",  label: "$20K+",       min: 20000, max: null  },
] as const;
type TabId = (typeof PRICE_TABS)[number]["id"];

function InventoryGridInner({ vehicles: fallbackVehicles }: InventoryGridProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const { vehicles: liveVehicles, source, syncedAt } = useInventory();
  // Filter out KV-hidden vehicles before any further processing.
  // This is what makes the DMS "Hide from website" toggle work in real time.
  const visibleLiveVehicles = useVisibleVehicles(liveVehicles);

  // Use live snapshot when present, otherwise stick with the SSR'd fallback.
  // Either way, run them through the same merchandising sort + availability
  // filter so featured cars stay pinned and sold cars stay hidden from the
  // public grid.
  const vehicles =
    source === "fallback"
      ? fallbackVehicles
      : sortWithFeaturedFirst(
          visibleLiveVehicles.filter((v) => v.status !== "sold")
        );

  const filtered = useMemo(() => {
    const make = searchParams.get("make")?.toLowerCase();
    const bodyStyle = searchParams.get("bodyStyle")?.toLowerCase();
    const drivetrain = searchParams.get("drivetrain");
    const minPrice = Number(searchParams.get("minPrice")) || null;
    const maxPrice = Number(searchParams.get("maxPrice")) || null;
    const maxMileage = Number(searchParams.get("maxMileage")) || null;
    const minYear = Number(searchParams.get("minYear")) || null;
    const maxYear = Number(searchParams.get("maxYear")) || null;
    const q = searchParams.get("q")?.toLowerCase();

    // Active price tab adds an additional price band on top of sidebar filters.
    const tab = PRICE_TABS.find((t) => t.id === activeTab)!;

    return vehicles.filter((v) => {
      if (make && v.make.toLowerCase() !== make) return false;
      if (bodyStyle && v.bodyStyle.toLowerCase() !== bodyStyle) return false;
      if (drivetrain && v.drivetrain !== drivetrain) return false;
      if (minPrice !== null && v.price < minPrice) return false;
      if (maxPrice !== null && v.price > maxPrice) return false;
      if (maxMileage !== null && v.mileage > maxMileage) return false;
      if (minYear !== null && v.year < minYear) return false;
      if (maxYear !== null && v.year > maxYear) return false;
      // Tab price band (only applied when a specific tab is active)
      if (tab.min !== null && v.price < tab.min) return false;
      if (tab.max !== null && v.price >= tab.max) return false;
      if (q) {
        const tokens = q.split(/\s+/).filter(Boolean);
        const haystack = [
          v.make,
          v.model,
          v.trim,
          v.drivetrain,
          v.bodyStyle,
          ...(v.features ?? []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!tokens.every((t) => haystack.includes(t))) return false;
      }
      return true;
    });
  }, [vehicles, searchParams, activeTab]);

  // Per-tab counts — lets users see how many vehicles are in each band
  // before clicking, without a full re-render.
  const tabCounts = useMemo(() => {
    return Object.fromEntries(
      PRICE_TABS.map((t) => [
        t.id,
        vehicles.filter((v) => {
          if (t.min !== null && v.price < t.min) return false;
          if (t.max !== null && v.price >= t.max) return false;
          return true;
        }).length,
      ])
    );
  }, [vehicles]);

  return (
    <>
      {/* Price range tabs */}
      <div className="mb-6 -mx-1">
        <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Filter by price">
          {PRICE_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            const count = tabCounts[tab.id] ?? 0;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  px-4 py-2 rounded-full text-sm font-medium transition-colors
                  ${isActive
                    ? "bg-brand-red text-white shadow-sm"
                    : "bg-white text-brand-gray-600 border border-brand-gray-200 hover:border-brand-red/40 hover:text-brand-red"
                  }
                `}
              >
                {tab.label}
                <span
                  className={`ml-1.5 text-xs font-normal ${isActive ? "text-red-100" : "text-brand-gray-400"}`}
                >
                  {coun