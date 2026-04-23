"use client";

/**
 * Merchandising Admin UI.
 *
 * Jordan's control surface for vehicle featuring and photo overlays.
 * The page is gated by Cloudflare Zero Trust Access — unauthenticated
 * visitors are bounced to a login flow before ever hitting this code.
 *
 * Data flow:
 *   1. Mount: GET /api/admin/merchandising → current config from KV
 *   2. Merge with static inventory list so every vehicle appears in the table
 *   3. Jordan toggles / reorders / edits fields, all in local state
 *   4. Save → POST /api/admin/merchandising → KV write + triggers rebuild
 *   5. Site updates within ~60 seconds (KV read cache) or immediately on rebuild
 *
 * Keyboard-first: up/down arrow buttons for reordering instead of drag-drop.
 * Screen reader labels on every control.
 */

import { useEffect, useMemo, useState } from "react";
import { sampleInventory } from "@/data/inventory";
import {
  MERCHANDISING,
  StatusBadgeKind,
  VehicleOverlay,
} from "@/data/merchandising";

type SaveState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "saving" }
  | { kind: "saved"; at: string }
  | { kind: "error"; message: string };

interface EditableConfig {
  featuredVins: string[];
  textPhone?: string;
  overlays: Record<string, VehicleOverlay>;
}

const STATUS_OPTIONS: { value: StatusBadgeKind | ""; label: string }[] = [
  { value: "", label: "— Auto —" },
  { value: "just-arrived", label: "Just Arrived" },
  { value: "price-reduced", label: "Price Reduced" },
  { value: "price-drop", label: "Price Drop" },
  { value: "staff-pick", label: "Staff Pick" },
  { value: "low-mileage", label: "Low Mileage" },
  { value: "sale-pending", label: "Sale Pending" },
];

export default function MerchandisingAdmin() {
  const [config, setConfig] = useState<EditableConfig>({
    featuredVins: [...MERCHANDISING.featuredVins],
    textPhone: MERCHANDISING.textPhone,
    overlays: structuredClone(MERCHANDISING.overlays),
  });
  const [saveState, setSaveState] = useState<SaveState>({ kind: "loading" });
  const [userEmail, setUserEmail] = useState<string>("");

  // On mount, pull the current config from KV via the admin API.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/merchandising", {
          credentials: "include",
        });
        if (res.status === 401) {
          setSaveState({
            kind: "error",
            message:
              "Not signed in. Cloudflare Access should have logged you in — refresh the page.",
          });
          return;
        }
        if (!res.ok) {
          setSaveState({
            kind: "error",
            message: `Couldn't load config (${res.status}).`,
          });
          return;
        }
        const data = await res.json();
        if (cancelled) return;
        const email =
          res.headers.get("cf-access-authenticated-user-email") ?? "";
        setUserEmail(email);
        if (data.config) {
          setConfig({
            featuredVins: data.config.featuredVins ?? [],
            textPhone: data.config.textPhone,
            overlays: data.config.overlays ?? {},
          });
        }
        setSaveState({ kind: "idle" });
      } catch (err) {
        if (!cancelled)
          setSaveState({
            kind: "error",
            message: `Network error: ${(err as Error).message}`,
          });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const vehiclesByVin = useMemo(
    () => new Map(sampleInventory.map((v) => [v.vin, v])),
    []
  );

  const activeVehicles = useMemo(
    () => sampleInventory.filter((v) => v.status === "available"),
    []
  );

  const featuredSet = new Set(config.featuredVins);
  const nonFeatured = activeVehicles.filter((v) => !featuredSet.has(v.vin));

  function updateOverlay(vin: string, patch: Partial<VehicleOverlay>) {
    setConfig((c) => ({
      ...c,
      overlays: {
        ...c.overlays,
        [vin]: { ...(c.overlays[vin] ?? {}), ...patch },
      },
    }));
  }

  function toggleFeatured(vin: string) {
    setConfig((c) => {
      if (c.featuredVins.includes(vin)) {
        return { ...c, featuredVins: c.featuredVins.filter((v) => v !== vin) };
      }
      return { ...c, featuredVins: [...c.featuredVins, vin] };
    });
  }

  function moveFeatured(vin: string, direction: -1 | 1) {
    setConfig((c) => {
      const idx = c.featuredVins.indexOf(vin);
      if (idx === -1) return c;
      const target = idx + direction;
      if (target < 0 || target >= c.featuredVins.length) return c;
      const next = [...c.featuredVins];
      [next[idx], next[target]] = [next[target], next[idx]];
      return { ...c, featuredVins: next };
    });
  }

  async function save() {
    setSaveState({ kind: "saving" });
    try {
      const res = await fetch("/api/admin/merchandising", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setSaveState({
          kind: "error",
          message:
            body.issues?.join("; ") ??
            body.error ??
            `Save failed (${res.status}).`,
        });
        return;
      }
      const data = await res.json();
      setSaveState({ kind: "saved", at: data.lastUpdated });
    } catch (err) {
      setSaveState({
        kind: "error",
        message: `Network error: ${(err as Error).message}`,
      });
    }
  }

  const featuredVehicles = config.featuredVins
    .map((vin) => vehiclesByVin.get(vin))
    .filter((v): v is NonNullable<typeof v> => v !== undefined);

  return (
    <main className="min-h-screen bg-brand-gray-50">
      <header className="bg-brand-navy text-white border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold">Merchandising Admin</h1>
              <p className="text-brand-gray-300 text-sm mt-1">
                Feature vehicles, write pill copy, set status badges.
                {userEmail && (
                  <>
                    {" "}
                    Signed in as{" "}
                    <span className="text-brand-red-light font-semibold">
                      {userEmail}
                    </span>
                  </>
                )}
              </p>
            </div>
            <SaveButton state={saveState} onSave={save} />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <Section title="Global settings">
          <label className="block max-w-md">
            <span className="block text-sm font-medium text-brand-gray-700 mb-1">
              Text Us number (digits only)
            </span>
            <input
              type="tel"
              inputMode="numeric"
              pattern="[0-9]{10,15}"
              value={config.textPhone ?? ""}
              maxLength={15}
              placeholder="6303593643"
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/[^0-9]/g, "");
                setConfig((c) => ({
                  ...c,
                  textPhone: digitsOnly || undefined,
                }));
              }}
              className="
                block w-full rounded-md border border-brand-gray-300
                px-3 py-2 text-sm font-mono
                focus:outline-none focus:ring-2 focus:ring-brand-red focus:border-transparent
              "
            />
            <p className="text-xs text-brand-gray-500 mt-1">
              Powers the &quot;Text Us&quot; button on every VDP. 10-15 digits, no
              dashes or spaces. Leave blank to use the main shop phone number from
              site config. Useful for routing customer texts to a sales line monitored
              after hours.
            </p>
          </label>
        </Section>

        <Section
          title={`Featured vehicles (${config.featuredVins.length})`}
          subtitle="Pin to the top of the inventory grid and homepage. Order matters."
        >
          {featuredVehicles.length === 0 ? (
            <p className="text-sm text-brand-gray-500 italic">
              No vehicles featured yet. Pick some from the list below.
            </p>
          ) : (
            <ol className="space-y-3">
              {featuredVehicles.map((v, i) => (
                <li
                  key={v.vin}
                  className="
                    flex items-center gap-3
                    bg-white border border-brand-gray-200 rounded-lg
                    p-3
                  "
                >
                  <span className="text-xs font-mono text-brand-gray-400 w-6 text-right">
                    {i + 1}
                  </span>
                  <div className="flex-grow">
                    <div className="font-semibold text-sm">
                      {v.year} {v.make} {v.model} {v.trim}
                    </div>
                    <div className="text-xs text-brand-gray-500 font-mono">
                      VIN {v.vin}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => moveFeatured(v.vin, -1)}
                    disabled={i === 0}
                    className="
                      w-8 h-8 inline-flex items-center justify-center
                      rounded-md border border-brand-gray-300 bg-white
                      text-brand-gray-700 text-sm
                      hover:bg-brand-gray-100 disabled:opacity-35 disabled:cursor-not-allowed
                    "
                    aria-label={`Move ${v.year} ${v.make} ${v.model} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    onClick={() => moveFeatured(v.vin, 1)}
                    disabled={i === featuredVehicles.length - 1}
                    className="
                      w-8 h-8 inline-flex items-center justify-center
                      rounded-md border border-brand-gray-300 bg-white
                      text-brand-gray-700 text-sm
                      hover:bg-brand-gray-100 disabled:opacity-35 disabled:cursor-not-allowed
                    "
                    aria-label={`Move ${v.year} ${v.make} ${v.model} down`}
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFeatured(v.vin)}
                    className="
                      text-sm text-brand-red font-semibold hover:underline
                      px-2 py-1
                    "
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ol>
          )}
        </Section>

        <Section
          title={`All vehicles (${activeVehicles.length})`}
          subtitle="Per-vehicle overlay controls. Feature, write pills, set status, hide."
        >
          <div className="space-y-4">
            {[...featuredVehicles, ...nonFeatured].map((v) => {
              const overlay = config.overlays[v.vin] ?? {};
              const isFeatured = featuredSet.has(v.vin);
              return (
                <VehicleRow
                  key={v.vin}
                  vehicle={v}
                  overlay={overlay}
                  isFeatured={isFeatured}
                  onToggleFeatured={() => toggleFeatured(v.vin)}
                  onUpdateOverlay={(patch) => updateOverlay(v.vin, patch)}
                />
              );
            })}
          </div>
        </Section>
      </div>

    </main>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-brand-gray-900">{title}</h2>
        {subtitle && (
          <p className="text-sm text-brand-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function SaveButton({
  state,
  onSave,
}: {
  state: SaveState;
  onSave: () => void;
}) {
  const label =
    state.kind === "saving"
      ? "Saving…"
      : state.kind === "saved"
      ? "Saved ✓"
      : state.kind === "loading"
      ? "Loading…"
      : state.kind === "error"
      ? "Retry save"
      : "Save changes";

  const disabled = state.kind === "loading" || state.kind === "saving";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={onSave}
        disabled={disabled}
        className="
          bg-brand-red hover:bg-brand-red-dark
          disabled:bg-brand-gray-500 disabled:cursor-not-allowed
          text-white font-semibold px-5 py-2.5 rounded-md
          transition-colors shadow
        "
      >
        {label}
      </button>
      {state.kind === "error" && (
        <span className="text-xs text-brand-red-light max-w-xs text-right">
          {state.message}
        </span>
      )}
      {state.kind === "saved" && (
        <span className="text-xs text-brand-gray-300">
          {new Date(state.at).toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}

function VehicleRow({
  vehicle,
  overlay,
  isFeatured,
  onToggleFeatured,
  onUpdateOverlay,
}: {
  vehicle: (typeof sampleInventory)[number];
  overlay: VehicleOverlay;
  isFeatured: boolean;
  onToggleFeatured: () => void;
  onUpdateOverlay: (patch: Partial<VehicleOverlay>) => void;
}) {
  const pills: [string, string, string] = [
    overlay.featurePills?.[0] ?? "",
    overlay.featurePills?.[1] ?? "",
    overlay.featurePills?.[2] ?? "",
  ];

  function setPill(i: 0 | 1 | 2, value: string) {
    const next: [string?, string?, string?] = [...pills];
    next[i] = value || undefined;
    // Trim trailing undefined entries for cleaner storage
    while (next.length > 0 && next[next.length - 1] === undefined) next.pop();
    onUpdateOverlay({ featurePills: next as [string?, string?, string?] });
  }

  return (
    <article
      className={`
        bg-white rounded-lg border
        ${isFeatured ? "border-brand-red/40 shadow-sm" : "border-brand-gray-200"}
        overflow-hidden
      `}
    >
      <header className="flex items-center justify-between gap-4 px-4 py-3 border-b border-brand-gray-100">
        <div>
          <h3 className="font-bold text-brand-gray-900">
            {vehicle.year} {vehicle.make} {vehicle.model}{" "}
            <span className="font-normal text-brand-gray-500">
              {vehicle.trim}
            </span>
          </h3>
          <p className="text-xs text-brand-gray-500 font-mono mt-0.5">
            {vehicle.vin} · Stock #{vehicle.stockNumber}
          </p>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={onToggleFeatured}
            className="w-4 h-4 accent-brand-red"
          />
          <span className="text-sm font-semibold">Featured</span>
        </label>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
        {/* Left column: status / carfax / hidden / warranty */}
        <div className="space-y-3">
          <label className="block">
            <span className="block text-xs font-semibold text-brand-gray-700 mb-1">
              Status badge
            </span>
            <select
              value={overlay.status ?? ""}
              onChange={(e) =>
                onUpdateOverlay({
                  status: (e.target.value || undefined) as
                    | StatusBadgeKind
                    | undefined,
                })
              }
              className="
                w-full rounded-md border border-brand-gray-300
                px-3 py-2 text-sm bg-white
              "
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={overlay.carfax === true}
              onChange={(e) =>
                onUpdateOverlay({ carfax: e.target.checked || undefined })
              }
              className="w-4 h-4 accent-brand-red"
            />
            <span className="text-sm">CARFAX Free Report button</span>
          </label>

          <label className="block">
            <span className="flex items-center justify-between text-xs font-semibold text-brand-gray-700 mb-1">
              <span>Warranty (VDP only)</span>
              {overlay.warranty && (
                <span className="text-[10px] font-medium text-brand-green normal-case">Shown on VDP</span>
              )}
            </span>
            <input
              type="text"
              value={overlay.warranty ?? ""}
              maxLength={80}
              placeholder="(none — sold as-is)"
              onChange={(e) =>
                onUpdateOverlay({
                  warranty: e.target.value || undefined,
                })
              }
              className="
                w-full rounded-md border border-brand-gray-300
                px-3 py-2 text-sm
              "
            />
            <p className="text-[10px] text-brand-gray-500 mt-1 leading-tight">
              Shown only on this vehicle&apos;s VDP. Examples: &quot;30-Day Warranty&quot;, &quot;60-Day Powertrain Warranty&quot;. Leave blank to sell as-is (no warranty badge).
            </p>
          </label>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={overlay.hidden === true}
              onChange={(e) =>
                onUpdateOverlay({ hidden: e.target.checked || undefined })
              }
              className="w-4 h-4 accent-brand-red"
            />
            <span className="text-sm text-brand-gray-700">
              Hide from site (don't show this vehicle)
            </span>
          </label>
        </div>

        {/* Right column: feature pills */}
        <div className="space-y-3">
          <div>
            <span className="block text-xs font-semibold text-brand-gray-700 mb-1">
              Feature pills (up to 3)
            </span>
            <p className="text-xs text-brand-gray-500 mb-2">
              Short, punchy. Use \n for a line break. Max 40 chars per pill.
            </p>
          </div>
          {[0, 1, 2].map((i) => (
            <input
              key={i}
              type="text"
              value={pills[i]}
              maxLength={40}
              placeholder={`Pill ${i + 1} (e.g. "Symmetrical\\nAWD")`}
              onChange={(e) => setPill(i as 0 | 1 | 2, e.target.value)}
              className="
                w-full rounded-md border border-brand-gray-300
                px-3 py-2 text-sm font-mono
              "
            />
          ))}
        </div>
      </div>
    </article>
  );
}
