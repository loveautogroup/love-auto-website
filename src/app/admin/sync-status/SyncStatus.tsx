"use client";

/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";

interface SnapshotSummary {
  syncedAt: string;
  syncedBy: string;
  vehicleCount: number;
  totalPhotos: number;
  byMake: Record<string, number>;
  byStatus: Record<string, number>;
  oldestVin?: { vin: string; firstSeen: string };
  newestVin?: { vin: string; firstSeen: string };
}

interface SyncLog {
  syncedAt: string;
  durationMs: number;
  vehiclesIn: number;
  vehiclesOut: number;
  added: string[];
  updated: string[];
  removed: string[];
  photosDownloaded: number;
  errors: string[];
  feedSource: string;
  parserUsed: string;
}

interface ApiResponse {
  snapshot: SnapshotSummary | null;
  logs: SyncLog[];
  logsTotal: number;
  generatedAt: string;
}

export default function SyncStatus() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [triggering, setTriggering] = useState(false);
  const [triggerResult, setTriggerResult] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/sync-status", {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData(await res.json());
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function triggerSync() {
    setTriggering(true);
    setTriggerResult(null);
    try {
      const res = await fetch("/api/admin/sync-status", { method: "POST" });
      const body = await res.text();
      setTriggerResult(
        res.ok ? `OK — ${body.slice(0, 200)}` : `Failed (${res.status}): ${body.slice(0, 300)}`
      );
      // Reload status after a short delay so the new log appears.
      setTimeout(load, 2000);
    } catch (err) {
      setTriggerResult(`Network error: ${(err as Error).message}`);
    } finally {
      setTriggering(false);
    }
  }

  if (loading && !data) {
    return <p className="text-brand-gray-500">Loading sync status…</p>;
  }
  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        <p className="font-semibold mb-2">Could not load sync status</p>
        <p className="text-sm mb-3">{error}</p>
        <p className="text-sm">
          Most likely cause: the INVENTORY KV namespace isn&apos;t bound yet on
          the Pages project. Open <code>wrangler.jsonc</code>, paste the namespace
          IDs, push, and redeploy. Or you&apos;re hitting this page outside
          Cloudflare Access — log in via your dealer email first.
        </p>
        <button
          onClick={load}
          className="mt-3 rounded-md border border-red-300 px-3 py-1 text-sm hover:bg-red-100"
        >
          Retry
        </button>
      </div>
    );
  }
  if (!data) return null;

  const { snapshot, logs } = data;
  const lastRun = logs[0];
  const lastRunStatus = lastRun?.errors?.length ? "errors" : "ok";
  // generatedAt comes from the server response so this stays deterministic
  // for a given fetch — avoids "impure render" lint warnings from Date.now().
  const generatedTs = new Date(data.generatedAt).getTime();
  const ageMinutes = snapshot
    ? Math.floor((generatedTs - new Date(snapshot.syncedAt).getTime()) / 60_000)
    : null;
  const ageStale = ageMinutes !== null && ageMinutes > 30;

  return (
    <div className="space-y-8">
      {/* Top-line cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          label="Last sync"
          value={
            snapshot
              ? `${ageMinutes}m ago`
              : "never"
          }
          tone={ageStale ? "warn" : snapshot ? "good" : "neutral"}
          sub={snapshot ? new Date(snapshot.syncedAt).toLocaleString() : undefined}
        />
        <Card
          label="Vehicles in snapshot"
          value={snapshot ? String(snapshot.vehicleCount) : "—"}
          sub={snapshot ? `${snapshot.totalPhotos} photos total` : undefined}
        />
        <Card
          label="Last run"
          value={lastRun ? `${lastRun.durationMs}ms` : "—"}
          tone={lastRunStatus === "errors" ? "warn" : "good"}
          sub={
            lastRun
              ? `+${lastRun.added.length} / ~${lastRun.updated.length} / -${lastRun.removed.length}`
              : undefined
          }
        />
        <Card
          label="Logs retained"
          value={String(data.logsTotal)}
          sub="auto-expire after 30 days"
        />
      </div>

      {/* Manual trigger */}
      <section className="rounded-xl border border-brand-gray-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4 mb-3">
          <div>
            <h2 className="text-lg font-semibold text-brand-gray-900">
              Trigger sync now
            </h2>
            <p className="text-sm text-brand-gray-500">
              Hits the worker&apos;s <code>/run</code> endpoint. Useful after
              adding a vehicle to Dealer Center if you don&apos;t want to wait
              for the next 15-min cron tick.
            </p>
          </div>
          <button
            onClick={triggerSync}
            disabled={triggering}
            className="rounded-md bg-brand-green text-white px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {triggering ? "Triggering…" : "Sync now"}
          </button>
        </div>
        {triggerResult && (
          <pre className="mt-2 text-xs bg-brand-gray-50 p-3 rounded overflow-x-auto whitespace-pre-wrap">
            {triggerResult}
          </pre>
        )}
      </section>

      {/* Snapshot detail */}
      {snapshot && (
        <section className="rounded-xl border border-brand-gray-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-brand-gray-900 mb-4">
            Current snapshot
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <Breakdown label="By make" data={snapshot.byMake} />
            <Breakdown label="By status" data={snapshot.byStatus} />
          </div>
          {(snapshot.oldestVin || snapshot.newestVin) && (
            <div className="mt-5 pt-4 border-t border-brand-gray-100 text-sm text-brand-gray-600 space-y-1">
              {snapshot.oldestVin && (
                <p>
                  Oldest VIN: <code>{snapshot.oldestVin.vin}</code> — first seen{" "}
                  {snapshot.oldestVin.firstSeen}
                </p>
              )}
              {snapshot.newestVin && (
                <p>
                  Newest VIN: <code>{snapshot.newestVin.vin}</code> — first seen{" "}
                  {snapshot.newestVin.firstSeen}
                </p>
              )}
            </div>
          )}
        </section>
      )}

      {/* Recent runs */}
      <section className="rounded-xl border border-brand-gray-200 bg-white p-5">
        <h2 className="text-lg font-semibold text-brand-gray-900 mb-4">
          Recent runs ({logs.length})
        </h2>
        {logs.length === 0 ? (
          <p className="text-sm text-brand-gray-500">
            No runs yet. The worker hasn&apos;t fired (or it has, but the log
            write failed). Wait for the next cron tick or click &ldquo;Sync now&rdquo;.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-brand-gray-500">
                <tr>
                  <th className="py-2 pr-4">When</th>
                  <th className="py-2 pr-4">Parser</th>
                  <th className="py-2 pr-4">In/Out</th>
                  <th className="py-2 pr-4">+/~/-</th>
                  <th className="py-2 pr-4">Photos</th>
                  <th className="py-2 pr-4">Duration</th>
                  <th className="py-2 pr-4">Errors</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr
                    key={l.syncedAt}
                    className={`border-t border-brand-gray-100 ${
                      l.errors.length ? "bg-red-50/50" : ""
                    }`}
                  >
                    <td className="py-2 pr-4 whitespace-nowrap">
                      {new Date(l.syncedAt).toLocaleString()}
                    </td>
                    <td className="py-2 pr-4">
                      <code>{l.parserUsed}</code>
                    </td>
                    <td className="py-2 pr-4">
                      {l.vehiclesIn} → {l.vehiclesOut}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap">
                      <span className="text-brand-green">+{l.added.length}</span>
                      {" / "}
                      <span className="text-amber-600">~{l.updated.length}</span>
                      {" / "}
                      <span className="text-red-600">-{l.removed.length}</span>
                    </td>
                    <td className="py-2 pr-4">{l.photosDownloaded}</td>
                    <td className="py-2 pr-4">{l.durationMs}ms</td>
                    <td className="py-2 pr-4">
                      {l.errors.length === 0 ? (
                        <span className="text-brand-gray-400">—</span>
                      ) : (
                        <details>
                          <summary className="cursor-pointer text-red-600">
                            {l.errors.length}
                          </summary>
                          <ul className="mt-1 ml-3 list-disc text-xs text-red-700 space-y-1">
                            {l.errors.map((e, i) => (
                              <li key={i}>{e}</li>
                            ))}
                          </ul>
                        </details>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-brand-gray-400">
        Generated at {new Date(data.generatedAt).toLocaleString()} ·{" "}
        <button
          onClick={load}
          className="underline hover:text-brand-gray-600"
        >
          Refresh
        </button>
      </p>
    </div>
  );
}

function Card({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "good" | "warn" | "neutral";
}) {
  const toneClasses =
    tone === "warn"
      ? "border-amber-300 bg-amber-50"
      : tone === "good"
      ? "border-brand-green/30 bg-brand-green/5"
      : "border-brand-gray-200 bg-white";
  return (
    <div className={`rounded-xl border p-4 ${toneClasses}`}>
      <p className="text-xs font-medium text-brand-gray-500 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-2xl font-bold text-brand-gray-900 mt-1">{value}</p>
      {sub && <p className="text-xs text-brand-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

function Breakdown({
  label,
  data,
}: {
  label: string;
  data: Record<string, number>;
}) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return (
      <div>
        <p className="text-xs font-medium text-brand-gray-500 uppercase tracking-wide mb-2">
          {label}
        </p>
        <p className="text-sm text-brand-gray-400">No data.</p>
      </div>
    );
  }
  const max = Math.max(...entries.map(([, n]) => n));
  return (
    <div>
      <p className="text-xs font-medium text-brand-gray-500 uppercase tracking-wide mb-2">
        {label}
      </p>
      <ul className="space-y-1.5">
        {entries.map(([k, v]) => (
          <li key={k} className="flex items-center gap-3 text-sm">
            <span className="w-24 truncate text-brand-gray-700">{k}</span>
            <div className="flex-1 h-2 bg-brand-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-green"
                style={{ width: `${(v / max) * 100}%` }}
              />
            </div>
            <span className="w-8 text-right tabular-nums text-brand-gray-900">
              {v}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
