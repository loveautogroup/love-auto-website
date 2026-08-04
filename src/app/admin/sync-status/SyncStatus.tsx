"use client";

/* eslint-disable react-hooks/set-state-in-effect */

/**
 * Admin -> Website Inventory Status.
 *
 * Answers one question: is the website showing the current lot right now,
 * and if not, why. Every number on this page is labelled with where it came
 * from, and anything we could not measure renders as "Unknown", never as a
 * green tick. See functions/api/admin/sync-status.ts for the probes.
 *
 * THE BUILD-TIME SNAPSHOT IS IMPORTED, NOT FETCHED. src/data/inventory-
 * snapshot.json is written by the prebuild step and bundled into this page's
 * JS chunk by the same build that generated the deployed VDPs and sitemaps.
 * So the copy imported here is provably the lot THIS deployment was built
 * from -- which is exactly what a stale-deploy check needs, and what no
 * runtime fetch could tell us. It costs ~28KB in an admin-only chunk.
 */

import { useCallback, useEffect, useState } from "react";
import rawSnapshot from "@/data/inventory-snapshot.json";

type Health = "ok" | "degraded" | "unknown";

interface RuntimeVehicle {
  vin: string;
  stockNumber: string;
  slug: string;
  label: string;
  status: string;
  make: string;
}

interface RuntimeProbe {
  health: Health;
  source: string | null;
  httpStatus: number | null;
  latencyMs: number;
  cacheBypassed: boolean;
  vehicleCount: number | null;
  vehicles: RuntimeVehicle[] | null;
  syncedAt: string | null;
  note: string;
  error?: string;
}

interface SitemapProbe {
  name: string;
  path: string;
  health: Health;
  httpStatus: number | null;
  vdpUrlCount: number | null;
  error?: string;
}

interface FeedProbe {
  name: string;
  path: string;
  health: Health;
  httpStatus: number | null;
  rows: number | null;
  latencyMs: number;
  note: string;
  error?: string;
}

interface ApiResponse {
  scope: "quick" | "full";
  runtime: RuntimeProbe;
  sitemaps: SitemapProbe[] | null;
  feeds: FeedProbe[] | null;
  rebuild: { configured: boolean };
  generatedAt: string;
}

interface DeployedVehicle {
  vin: string;
  stockNumber?: string;
  slug: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  status?: string;
}

const DEPLOYED_SNAPSHOT = rawSnapshot as unknown as {
  syncedAt?: string;
  vehicles?: DeployedVehicle[];
};

/** Only these ever get a static VDP + a sitemap entry. Mirrors
 *  INDEXABLE_STATUSES in src/app/sitemap.ts. */
const INDEXABLE = new Set(["available", "sale-pending"]);

const DEPLOYED_VEHICLES: DeployedVehicle[] = (
  DEPLOYED_SNAPSHOT.vehicles ?? []
).filter((v) => v && v.vin && INDEXABLE.has(String(v.status ?? "")));

const DEPLOYED_BUILT_AT: string | null = DEPLOYED_SNAPSHOT.syncedAt ?? null;

/** How many missing VDPs we will actually request to confirm the 404. */
const MAX_VDP_CHECKS = 5;

function labelOf(v: DeployedVehicle): string {
  return [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ").trim();
}

export default function SyncStatus() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildResult, setRebuildResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  /** slug -> true (page exists) | false (404) | undefined (not checked) */
  const [vdpChecks, setVdpChecks] = useState<Record<string, boolean>>({});

  const load = useCallback(async (fresh: boolean) => {
    setLoading(true);
    setError(null);
    setVdpChecks({});
    try {
      const res = await fetch(
        fresh ? "/api/admin/sync-status?fresh=1" : "/api/admin/sync-status",
        { cache: "no-store", credentials: "include" }
      );
      if (!res.ok) {
        const body = await res.json().catch(() => ({}) as { error?: string });
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }
      setData((await res.json()) as ApiResponse);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(false);
  }, [load]);

  const runtime = data?.runtime;
  const liveVehicles = runtime?.vehicles ?? null;

  // ---- drift: live lot vs what this deployment actually published ----
  const deployedVins = new Set(DEPLOYED_VEHICLES.map((v) => v.vin));
  const liveVins = new Set((liveVehicles ?? []).map((v) => v.vin));

  const canCompare = runtime?.health === "ok" && liveVehicles !== null;

  const missingFromSite = canCompare
    ? liveVehicles!.filter((v) => !deployedVins.has(v.vin))
    : [];
  const goneFromLot = canCompare
    ? DEPLOYED_VEHICLES.filter((v) => !liveVins.has(v.vin))
    : [];
  const driftCount = missingFromSite.length + goneFromLot.length;

  // Confirm the "missing" ones really 404 rather than asserting it. Bounded
  // to MAX_VDP_CHECKS requests -- this is a diagnosis, not a crawl.
  useEffect(() => {
    if (!canCompare || missingFromSite.length === 0) return;
    const targets = missingFromSite
      .slice(0, MAX_VDP_CHECKS)
      .map((v) => v.slug)
      .filter(Boolean);
    if (targets.length === 0) return;
    let cancelled = false;
    void (async () => {
      const results: Record<string, boolean> = {};
      await Promise.all(
        targets.map(async (slug) => {
          try {
            const res = await fetch(`/inventory/${slug}/`, {
              cache: "no-store",
            });
            results[slug] = res.ok;
          } catch {
            /* leave unrecorded -- renders as "not checked" */
          }
        })
      );
      if (!cancelled) setVdpChecks(results);
    })();
    return () => {
      cancelled = true;
    };
    // Keyed on the VIN list so this reruns when a reload changes the drift set.
  }, [canCompare, missingFromSite.map((v) => v.vin).join(",")]); // eslint-disable-line react-hooks/exhaustive-deps

  async function triggerRebuild() {
    if (
      !window.confirm(
        "Start a new build of the website?\n\n" +
          "It re-reads the DMS, regenerates every vehicle page and the " +
          "sitemaps, and takes about 3-5 minutes. The current site stays " +
          "live the whole time."
      )
    ) {
      return;
    }
    setRebuilding(true);
    setRebuildResult(null);
    try {
      const res = await fetch("/api/admin/sync-status", {
        method: "POST",
        credentials: "include",
      });
      const body = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
      };
      setRebuildResult(
        res.ok && body.ok
          ? {
              ok: true,
              message:
                "Build started. It takes about 3-5 minutes. Nothing on this " +
                "page will change until it finishes and you reload.",
            }
          : {
              ok: false,
              message: body.error ?? `Failed (HTTP ${res.status}).`,
            }
      );
    } catch (err) {
      setRebuildResult({
        ok: false,
        message: `Network error: ${(err as Error).message}`,
      });
    } finally {
      setRebuilding(false);
    }
  }

  if (loading && !data) {
    return (
      <p className="text-brand-gray-500">
        Checking the site, the deployed pages and the feeds. A hibernating DMS
        can make this take ~30 seconds.
      </p>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
        <p className="font-semibold mb-2">Could not run the checks</p>
        <p className="text-sm mb-3">{error}</p>
        <p className="text-sm">
          Most likely your admin session expired — reload the page to sign in
          again.
        </p>
        <button
          onClick={() => void load(false)}
          className="mt-3 rounded-md border border-red-300 px-3 py-1 text-sm hover:bg-red-100"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || !runtime) return null;

  const feeds = data.feeds ?? [];
  const feedsBad = feeds.filter((f) => f.health === "degraded").length;
  const feedsUnknown = feeds.filter((f) => f.health === "unknown").length;

  const buildAgeHours = DEPLOYED_BUILT_AT
    ? Math.floor(
        (new Date(data.generatedAt).getTime() -
          new Date(DEPLOYED_BUILT_AT).getTime()) /
          3_600_000
      )
    : null;

  return (
    <div className="space-y-8">
      {/* ---------- headline ---------- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card
          label="Live data on the site"
          value={
            runtime.health === "ok"
              ? "Yes"
              : runtime.health === "degraded"
                ? "No"
                : "Unknown"
          }
          tone={toneOf(runtime.health)}
          sub={
            runtime.health === "ok"
              ? `${runtime.vehicleCount} cars from the DMS`
              : runtime.health === "degraded"
                ? "Visitors see the last build"
                : "Could not measure"
          }
        />
        <Card
          label="Pages match the lot"
          value={
            !canCompare ? "Unknown" : driftCount === 0 ? "Yes" : String(driftCount)
          }
          tone={!canCompare ? "unknown" : driftCount === 0 ? "good" : "bad"}
          sub={
            !canCompare
              ? "Needs a live read to compare"
              : driftCount === 0
                ? "No stale or missing pages"
                : "car pages out of date — rebuild"
          }
        />
        <Card
          label="Site last built"
          value={
            buildAgeHours === null
              ? "Unknown"
              : buildAgeHours < 1
                ? "< 1h ago"
                : `${buildAgeHours}h ago`
          }
          tone="neutral"
          sub={
            DEPLOYED_BUILT_AT
              ? `${DEPLOYED_VEHICLES.length} cars baked in`
              : "No snapshot in this build"
          }
        />
        <Card
          label="Marketplace feeds"
          value={
            feeds.length === 0
              ? "Unknown"
              : feedsBad > 0
                ? `${feedsBad} down`
                : feedsUnknown > 0
                  ? `${feeds.length - feedsUnknown}/${feeds.length}`
                  : "All OK"
          }
          tone={
            feeds.length === 0
              ? "unknown"
              : feedsBad > 0
                ? "bad"
                : feedsUnknown > 0
                  ? "unknown"
                  : "good"
          }
          sub={
            feeds.length === 0
              ? "Not checked"
              : `${feeds.length} feeds checked`
          }
        />
      </div>

      {/* ---------- 1. what visitors are being served ---------- */}
      <Section
        title="What visitors are seeing right now"
        health={runtime.health}
      >
        <p className="text-sm text-brand-gray-700">{runtime.note}</p>
        <dl className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <Fact
            k="Source"
            v={runtime.source ?? "unknown"}
            hint="X-Inventory-Source on /api/inventory"
          />
          <Fact
            k="Cars returned"
            v={runtime.vehicleCount === null ? "unknown" : String(runtime.vehicleCount)}
            hint="live DMS read"
          />
          <Fact
            k="Response"
            v={runtime.httpStatus === null ? "no answer" : `HTTP ${runtime.httpStatus}`}
            hint={`${runtime.latencyMs} ms`}
          />
          <Fact
            k="Edge cache"
            v={runtime.cacheBypassed ? "bypassed" : "used"}
            hint={runtime.cacheBypassed ? "?fresh=1" : "up to 60s old"}
          />
        </dl>
        {runtime.error && (
          <p className="mt-3 text-xs text-red-700 font-mono break-all">
            {runtime.error}
          </p>
        )}
        {runtime.health === "degraded" && (
          <p className="mt-4 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
            Customers can still browse — the site falls back to the pages built
            at the last deploy — but prices and availability are frozen as of
            then, and every marketplace feed is refusing to publish. Check{" "}
            <a
              className="underline font-medium"
              href="https://web-production-d5f3a.up.railway.app/healthz"
              target="_blank"
              rel="noreferrer"
            >
              Railway health
            </a>
            .
          </p>
        )}
      </Section>

      {/* ---------- 2. stale deploy ---------- */}
      <Section
        title="Deployed pages vs the live lot"
        health={!canCompare ? "unknown" : driftCount === 0 ? "ok" : "degraded"}
      >
        {!canCompare ? (
          <p className="text-sm text-brand-gray-700">
            <strong>Unknown.</strong> The comparison needs a live read of the
            lot, and we did not get one. Nothing here is safe to call green or
            red until the section above is healthy.
          </p>
        ) : driftCount === 0 ? (
          <p className="text-sm text-brand-gray-700">
            Every car on the lot has a page on the website, and no page is
            advertising a car that is gone. {DEPLOYED_VEHICLES.length} cars in
            the build, {runtime.vehicleCount} on the lot.
          </p>
        ) : (
          <div className="space-y-5">
            <p className="text-sm text-brand-gray-800">
              The deployed pages were built from an older lot. A rebuild fixes
              this — it re-reads the DMS and regenerates every page and both
              sitemaps.
            </p>

            {missingFromSite.length > 0 && (
              <DriftList
                tone="bad"
                title={`On the lot but NOT on the website (${missingFromSite.length})`}
                caption="These cars have no page. Anyone sent to their URL gets a 404, and they are missing from the sitemap."
                rows={missingFromSite.map((v) => ({
                  key: v.vin,
                  label: v.label || v.vin,
                  stock: v.stockNumber,
                  detail:
                    v.slug in vdpChecks
                      ? vdpChecks[v.slug]
                        ? "page exists (sitemap may still be stale)"
                        : "confirmed 404"
                      : missingFromSite.indexOf(v) < MAX_VDP_CHECKS
                        ? "checking…"
                        : "not checked",
                }))}
              />
            )}

            {goneFromLot.length > 0 && (
              <DriftList
                tone="warn"
                title={`On the website but gone from the lot (${goneFromLot.length})`}
                caption="Sold or unlisted in the DMS, but the deployed site still has a page for each and still advertises them in the sitemap."
                rows={goneFromLot.map((v) => ({
                  key: v.vin,
                  label: labelOf(v) || v.vin,
                  stock: v.stockNumber,
                  detail: "still published",
                }))}
              />
            )}
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-brand-gray-100 grid sm:grid-cols-2 gap-4 text-sm">
          <Fact
            k="Snapshot this build used"
            v={
              DEPLOYED_BUILT_AT
                ? new Date(DEPLOYED_BUILT_AT).toLocaleString()
                : "unknown"
            }
            hint="src/data/inventory-snapshot.json, bundled at build"
          />
          <div>
            <p className="text-xs font-medium text-brand-gray-500 uppercase tracking-wide">
              Sitemaps deployed
            </p>
            {data.sitemaps === null ? (
              <p className="text-brand-gray-400 mt-1">not checked</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {data.sitemaps.map((s) => (
                  <li key={s.path} className="text-brand-gray-700">
                    <code>{s.name}</code>{" "}
                    {s.vdpUrlCount === null ? (
                      <span className="text-brand-gray-400">
                        unknown{s.error ? ` (${s.error})` : ""}
                      </span>
                    ) : (
                      <span className="tabular-nums">
                        {s.vdpUrlCount} car URLs
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-xs text-brand-gray-400 mt-1">
              Counted live from the deployed XML.
            </p>
          </div>
        </div>
      </Section>

      {/* ---------- 3. rebuild ---------- */}
      <section className="rounded-xl border border-brand-gray-200 bg-white p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-brand-gray-900">
              Rebuild the website
            </h2>
            <p className="text-sm text-brand-gray-600 mt-1 max-w-2xl">
              Starts a Cloudflare Pages build: it re-reads the DMS, regenerates
              every vehicle page and both sitemaps, and publishes. Takes about
              3-5 minutes; the current site stays live until it finishes. The
              DMS already fires this automatically whenever inventory changes —
              use this when that did not happen, or a build failed.
            </p>
            {!data.rebuild.configured && (
              <p className="mt-3 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-lg p-3">
                Not configured. Set <code>CF_PAGES_DEPLOY_HOOK_URL</code> as a
                secret on the Pages project (Settings → Environment variables,
                Production + Preview) and redeploy once. Until then this button
                does nothing, and it says so rather than pretending.
              </p>
            )}
          </div>
          <button
            onClick={() => void triggerRebuild()}
            disabled={rebuilding || !data.rebuild.configured}
            className="shrink-0 rounded-md bg-brand-red text-white px-4 py-2 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {rebuilding ? "Starting…" : "Rebuild now"}
          </button>
        </div>
        {rebuildResult && (
          <p
            className={`mt-4 text-sm rounded-lg border p-3 ${
              rebuildResult.ok
                ? "border-green-200 bg-green-50 text-green-800"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {rebuildResult.message}
          </p>
        )}
      </section>

      {/* ---------- 4. feeds ---------- */}
      <Section
        title="Marketplace feeds"
        health={
          feeds.length === 0
            ? "unknown"
            : feedsBad > 0
              ? "degraded"
              : feedsUnknown > 0
                ? "unknown"
                : "ok"
        }
      >
        {feeds.length === 0 ? (
          <p className="text-sm text-brand-gray-500">Not checked.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-brand-gray-500">
                <tr>
                  <th className="py-2 pr-4">Feed</th>
                  <th className="py-2 pr-4">State</th>
                  <th className="py-2 pr-4">Cars</th>
                  <th className="py-2 pr-4">Reply</th>
                  <th className="py-2 pr-4">What it means</th>
                </tr>
              </thead>
              <tbody>
                {feeds.map((f) => (
                  <tr key={f.path} className="border-t border-brand-gray-100 align-top">
                    <td className="py-2 pr-4">
                      <a
                        href={f.path}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand-gray-900 hover:underline"
                      >
                        {f.name}
                      </a>
                      <div className="text-xs text-brand-gray-400">
                        <code>{f.path}</code>
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      <HealthPill health={f.health} />
                    </td>
                    <td className="py-2 pr-4 tabular-nums">
                      {f.rows === null ? (
                        <span className="text-brand-gray-400">—</span>
                      ) : (
                        f.rows
                      )}
                    </td>
                    <td className="py-2 pr-4 whitespace-nowrap text-brand-gray-600">
                      {f.httpStatus === null ? "no answer" : `HTTP ${f.httpStatus}`}
                      <div className="text-xs text-brand-gray-400">
                        {f.latencyMs} ms
                      </div>
                    </td>
                    <td className="py-2 pr-4 text-brand-gray-600 max-w-md">
                      {f.note}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      {/* ---------- 5. live lot breakdown ---------- */}
      {liveVehicles && liveVehicles.length > 0 && (
        <Section title="The lot right now" health="ok">
          <div className="grid md:grid-cols-2 gap-6">
            <Breakdown label="By make" data={countBy(liveVehicles, (v) => v.make || "—")} />
            <Breakdown
              label="By status"
              data={countBy(liveVehicles, (v) => v.status || "—")}
            />
          </div>
          <p className="text-xs text-brand-gray-400 mt-4">
            From the live DMS read, not the build snapshot. Only Listed and Sale
            Pending vehicles reach the public site.
          </p>
        </Section>
      )}

      <div className="flex flex-wrap items-center gap-4 text-xs text-brand-gray-400">
        <span>Checked {new Date(data.generatedAt).toLocaleString()}</span>
        <button
          onClick={() => void load(false)}
          disabled={loading}
          className="underline hover:text-brand-gray-600 disabled:opacity-50"
        >
          Check again
        </button>
        <button
          onClick={() => void load(true)}
          disabled={loading}
          className="underline hover:text-brand-gray-600 disabled:opacity-50"
        >
          Re-check, bypassing the cache (slower, up to ~30s)
        </button>
        {loading && <span>Working…</span>}
      </div>
    </div>
  );
}

/* ------------------------------ helpers ------------------------------ */

function toneOf(h: Health): "good" | "bad" | "unknown" {
  return h === "ok" ? "good" : h === "degraded" ? "bad" : "unknown";
}

function countBy<T>(rows: T[], key: (row: T) => string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of rows) {
    const k = key(r);
    out[k] = (out[k] ?? 0) + 1;
  }
  return out;
}

function HealthPill({ health }: { health: Health }) {
  const map = {
    ok: { text: "OK", cls: "bg-green-50 text-green-700 border-green-200" },
    degraded: { text: "Down", cls: "bg-red-50 text-red-700 border-red-200" },
    unknown: {
      text: "Unknown",
      cls: "bg-brand-gray-50 text-brand-gray-600 border-brand-gray-200",
    },
  } as const;
  const m = map[health];
  return (
    <span
      className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${m.cls}`}
    >
      {m.text}
    </span>
  );
}

function Section({
  title,
  health,
  children,
}: {
  title: string;
  health: Health;
  children: React.ReactNode;
}) {
  const edge =
    health === "ok"
      ? "border-l-green-500"
      : health === "degraded"
        ? "border-l-red-500"
        : "border-l-brand-gray-300";
  return (
    <section
      className={`rounded-xl border border-brand-gray-200 border-l-4 ${edge} bg-white p-5`}
    >
      <div className="flex items-center gap-3 mb-3">
        <h2 className="text-lg font-semibold text-brand-gray-900">{title}</h2>
        <HealthPill health={health} />
      </div>
      {children}
    </section>
  );
}

function Fact({ k, v, hint }: { k: string; v: string; hint?: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-brand-gray-500 uppercase tracking-wide">
        {k}
      </p>
      <p className="text-brand-gray-900 font-medium mt-0.5 break-words">{v}</p>
      {hint && <p className="text-xs text-brand-gray-400">{hint}</p>}
    </div>
  );
}

function DriftList({
  tone,
  title,
  caption,
  rows,
}: {
  tone: "bad" | "warn";
  title: string;
  caption: string;
  rows: Array<{ key: string; label: string; stock?: string; detail: string }>;
}) {
  const cls =
    tone === "bad"
      ? "border-red-200 bg-red-50"
      : "border-amber-200 bg-amber-50";
  return (
    <div className={`rounded-lg border p-4 ${cls}`}>
      <p className="font-semibold text-sm text-brand-gray-900">{title}</p>
      <p className="text-xs text-brand-gray-600 mt-0.5 mb-3">{caption}</p>
      <ul className="space-y-1 text-sm">
        {rows.map((r) => (
          <li key={r.key} className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-brand-gray-900">{r.label}</span>
            {r.stock && (
              <span className="text-xs text-brand-gray-500">#{r.stock}</span>
            )}
            <span className="text-xs text-brand-gray-500">— {r.detail}</span>
          </li>
        ))}
      </ul>
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
  tone?: "good" | "bad" | "unknown" | "neutral";
}) {
  const toneClasses =
    tone === "bad"
      ? "border-red-300 bg-red-50"
      : tone === "good"
        ? "border-green-300 bg-green-50"
        : tone === "unknown"
          ? "border-brand-gray-300 bg-brand-gray-50"
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
            <span className="w-28 truncate text-brand-gray-700">{k}</span>
            <div className="flex-1 h-2 bg-brand-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-brand-red"
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
