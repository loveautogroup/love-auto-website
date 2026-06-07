"use client";

/**
 * VDPViewCount — W2 demand capture (Jun 7 2026).
 *
 * Subtle social-proof chip on the VDP: "N people viewed this car this
 * week", backed by real Cloudflare Web Analytics data via
 * /api/vehicle-views. Renders NOTHING until there are at least 3 views
 * in the window (a "1 view" chip reads sad, and pre-launch there is no
 * data at all). Fails silent on any fetch problem.
 */

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

export default function VDPViewCount({ path }: { path: string }) {
  const { locale } = useLanguage();
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(`/api/vehicle-views?path=${encodeURIComponent(path)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { views?: number | null } | null) => {
        if (alive && j && typeof j.views === "number") setViews(j.views);
      })
      .catch(() => {
        /* chip just doesn't render */
      });
    return () => {
      alive = false;
    };
  }, [path]);

  if (views === null || views < 3) return null;

  const label =
    locale === "es"
      ? `${views.toLocaleString()} personas vieron este auto esta semana`
      : `${views.toLocaleString()} people viewed this car this week`;

  return (
    <p className="inline-flex items-center gap-1.5 text-xs text-brand-gray-500 mt-2">
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.04 12.32C3.42 7.51 7.36 4.5 12 4.5s8.58 3.01 9.96 7.82a.85.85 0 010 .36C20.58 17.49 16.64 20.5 12 20.5s-8.58-3.01-9.96-7.82a.85.85 0 010-.36z" />
        <circle cx="12" cy="12.5" r="3" />
      </svg>
      {label}
    </p>
  );
}
