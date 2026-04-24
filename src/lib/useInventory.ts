"use client";

/**
 * useInventory — single source for live inventory in client components.
 *
 * Strategy:
 *   1. On first render, try sessionStorage cache (synchronous, in initializer).
 *      If hit + fresh, start with that snapshot — zero render flash.
 *   2. Otherwise start with the build-time `sampleInventory` so the UI
 *      renders instantly even before fetch completes (and works offline /
 *      on brand-new deploys before the cron has run).
 *   3. Fetch /api/inventory in the background. On 200, replace with the
 *      live snapshot adapted into Vehicle objects.
 *   4. On 204 (KV empty) or any error, keep the build-time fallback.
 *
 * This makes the site degrade gracefully: the inventory list is *always*
 * populated, even when:
 *   - The Cron Worker is down
 *   - KV write failed mid-run
 *   - Dealer Center feed is unreachable
 *   - Photos haven't synced to R2 yet
 *
 * Cache: sessionStorage key "inventory:cache:v1" so navigating between
 * pages doesn't re-fetch within the same tab. The KV-side cache header
 * is short (60s) so a full page refresh always picks up the latest.
 */

import { useEffect, useState } from "react";
import type { Vehicle } from "@/lib/types";
import { sampleInventory } from "@/data/inventory";
import { adaptSnapshot, type InventorySnapshot } from "@/lib/inventoryAdapter";

const CACHE_KEY = "inventory:cache:v1";
const CACHE_MAX_AGE_MS = 60_000; // mirror /api/inventory s-maxage

export interface InventoryState {
  vehicles: Vehicle[];
  source: "fallback" | "cache" | "live";
  syncedAt: string | null;
  loading: boolean;
  error: string | null;
}

function readCache(): InventoryState | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (!cached) return null;
    const parsed = JSON.parse(cached) as {
      fetchedAt: number;
      snapshot: InventorySnapshot;
    };
    if (Date.now() - parsed.fetchedAt > CACHE_MAX_AGE_MS) return null;
    const adapted = adaptSnapshot(parsed.snapshot);
    if (adapted.length === 0) return null;
    return {
      vehicles: adapted,
      source: "cache",
      syncedAt: parsed.snapshot.syncedAt,
      loading: false,
      error: null,
    };
  } catch {
    return null;
  }
}

export function useInventory(): InventoryState {
  const [state, setState] = useState<InventoryState>(() => {
    const cached = readCache();
    if (cached) return cached;
    return {
      vehicles: sampleInventory,
      source: "fallback",
      syncedAt: null,
      loading: true,
      error: null,
    };
  });

  useEffect(() => {
    let cancelled = false;

    // If we already loaded from cache, skip the network — cache is fresh.
    if (state.source === "cache") return;

    fetch("/api/inventory")
      .then(async (res) => {
        if (cancelled) return;
        if (res.status === 204) {
          // KV empty — keep fallback. Not an error.
          setState((s) => ({ ...s, loading: false, source: "fallback" }));
          return;
        }
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        const snapshot = (await res.json()) as InventorySnapshot;
        if (!Array.isArray(snapshot.vehicles) || snapshot.vehicles.length === 0) {
          // Snapshot exists but is empty. Stay on fallback so the
          // public site doesn't show an empty inventory page.
          setState((s) => ({ ...s, loading: false, source: "fallback" }));
          return;
        }
        const adapted = adaptSnapshot(snapshot);
        try {
          sessionStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ fetchedAt: Date.now(), snapshot })
          );
        } catch {
          // ignore — cache is best-effort
        }
        setState({
          vehicles: adapted,
          source: "live",
          syncedAt: snapshot.syncedAt,
          loading: false,
          error: null,
        });
      })
      .catch((err: Error) => {
        if (cancelled) return;
        // Keep fallback inventory; report the error so admins can see it
        // in DevTools but don't break the UI.
        console.warn("[useInventory] Live fetch failed; using fallback.", err);
        setState((s) => ({
          ...s,
          loading: false,
          error: err.message,
          source: "fallback",
        }));
      });

    return () => {
      cancelled = true;
    };
    // We deliberately only re-run when source changes (effectively once).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return state;
}
