"use client";

/**
 * Admin hub — Jeremiah's / Jordan's home base.
 *
 * Live stat cards (polled from each section's API) + nav tiles to every
 * admin surface. Built to give the owner a "what's happening today"
 * snapshot without having to click into every section.
 */

import { useEffect, useState } from "react";
import Link from "next/link";

interface Stats {
  newLeads: number;
  contactedLeads: number;
  qualifiedLeads: number;
  lostLeads: number;
  openSigningSessions: number;
  completedSigningSessions: number;
  inventoryCount: number | null;
  inventoryAgeMinutes: number | null;
  loading: boolean;
  error: string | null;
}

export default function AdminHub() {
  const [stats, setStats] = useState<Stats>({
    newLeads: 0,
    contactedLeads: 0,
    qualifiedLeads: 0,
    lostLeads: 0,
    openSigningSessions: 0,
    completedSigningSessions: 0,
    inventoryCount: null,
    inventoryAgeMinutes: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    async function load() {
      try {
        const [leadsRes, sessionsRes, syncRes] = await Promise.all([
          fetch("/api/admin/leads", {
            credentials: "include",
            cache: "no-store",
          }).catch(() => null),
          fetch("/api/admin/signing-sessions", {
            credentials: "include",
            cache: "no-store",
          }).catch(() => null),
          fetch("/api/admin/sync-status", {
            credentials: "include",
            cache: "no-store",
          }).catch(() => null),
        ]);

        const leadsData =
          leadsRes && leadsRes.ok ? await leadsRes.json() : null;
        const sessData =
          sessionsRes && sessionsRes.ok ? await sessionsRes.json() : null;
        const syncData = syncRes && syncRes.ok ? await syncRes.json() : null;

        const leads: Array<{ status: string }> = leadsData?.leads ?? [];
        const sessions: Array<{ status: string }> = sessData?.sessions ?? [];

        const inventoryCount: number | null =
          syncData?.snapshot?.vehicleCount ?? null;
        const inventoryAgeMinutes: number | null =
          syncData?.snapshot?.syncedAt
            ? Math.floor(
                (Date.now() - new Date(syncData.snapshot.syncedAt).getTime()) /
                  60_000
              )
            : null;

        setStats({
          newLeads: leads.filter((l) => l.status === "new").length,
          contactedLeads: leads.filter((l) => l.status === "contacted").length,
          qualifiedLeads: leads.filter((l) => l.status === "qualified").length,
          lostLeads: leads.filter((l) => l.status === "lost").length,
          openSigningSessions: sessions.filter(
            (s) =>
              s.status === "created" ||
              s.status === "opened" ||
              s.status === "consented"
          ).length,
          completedSigningSessions: sessions.filter(
            (s) => s.status === "signed" || s.status === "archived"
          ).length,
          inventoryCount,
          inventoryAgeMinutes,
          loading: false,
          error: null,
        });
      } catch (err) {
        setStats((s) => ({
          ...s,
          loading: false,
          error: (err as Error).message,
        }));
      }
    }
    load();
  }, []);

  return (
    <div>
      {/* Today's at-a-glance cards */}
      <section aria-labelledby="overview-heading" className="mb-10">
        <h2
          id="overview-heading"
          className="text-xs font-bold uppercase tracking-wider text-brand-gray-500 mb-4"
        >
          At a Glance
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="New leads"
            value={stats.newLeads}
            tone="accent"
            href="/admin/leads"
            loading={stats.loading}
          />
          <StatCard
            label="Contacted"
            value={stats.contactedLeads}
            tone="info"
            href="/admin/leads"
            loading={stats.loading}
          />
          <StatCard
            label="Open signings"
            value={stats.openSigningSessions}
            tone="warning"
            href="/admin/signing"
            loading={stats.loading}
          />
          <StatCard
            label="Completed signings"
            value={stats.completedSigningSessions}
            tone="success"
            href="/admin/signing"
            loading={stats.loading}
          />
        </div>
      </section>

      {/* Admin section nav */}
      <section aria-labelledby="sections-heading">
        <h2
          id="sections-heading"
          className="text-xs font-bold uppercase tracking-wider text-brand-gray-500 mb-4"
        >
          Manage
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <NavCard
            href="/admin/leads"
            title="Finance Leads"
            description="Review new applications from the /financing form. Call, text, or email each lead with one click and track status through the pipeline."
            badge={stats.newLeads > 0 ? `${stats.newLeads} new` : undefined}
          />
          <NavCard
            href="/admin/signing"
            title="E-Sign Sessions"
            description="Create a new e-signature session for a customer and review active ones. Works on any device the customer or dealer uses."
            badge={
              stats.openSigningSessions > 0
                ? `${stats.openSigningSessions} open`
                : undefined
            }
          />
          <NavCard
            href="/admin/merchandising"
            title="Merchandising"
            description="Control which vehicles are featured, set custom photo overlays and market estimates, and manage the Text Us number."
          />
          <NavCard
            href="/admin/sync-status"
            title="Inventory Sync"
            description="Watch the Cron Worker mirror Dealer Center inventory into the site every 15 minutes. Trigger a manual sync, inspect the latest snapshot, see what changed."
            badge={
              stats.inventoryCount !== null
                ? `${stats.inventoryCount} cars · ${
                    stats.inventoryAgeMinutes ?? 0
                  }m ago`
                : undefined
            }
          />
        </div>
      </section>

      {/* Quick links */}
      <section className="mt-10 border-t border-brand-gray-200 pt-6">
        <h2 className="text-xs font-bold uppercase tracking-wider text-brand-gray-500 mb-4">
          Quick Links
        </h2>
        <ul className="flex flex-wrap gap-3 text-sm">
          <li>
            <Link
              href="/"
              target="_blank"
              rel="noreferrer"
              className="text-brand-red hover:underline font-semibold"
            >
              View public site ↗
            </Link>
          </li>
          <li className="text-brand-gray-300">·</li>
          <li>
            <Link
              href="/inventory"
              target="_blank"
              rel="noreferrer"
              className="text-brand-red hover:underline font-semibold"
            >
              Public inventory ↗
            </Link>
          </li>
          <li className="text-brand-gray-300">·</li>
          <li>
            <Link
              href="/financing"
              target="_blank"
              rel="noreferrer"
              className="text-brand-red hover:underline font-semibold"
            >
              Public financing form ↗
            </Link>
          </li>
          <li className="text-brand-gray-300">·</li>
          <li>
            <a
              href="https://app.dealercenter.net"
              target="_blank"
              rel="noreferrer"
              className="text-brand-red hover:underline font-semibold"
            >
              Dealer Center ↗
            </a>
          </li>
        </ul>
      </section>

      {stats.error && (
        <p className="mt-8 text-sm text-brand-gray-400">
          Some stats failed to load — {stats.error}. Individual admin pages
          will still work.
        </p>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  href,
  loading,
}: {
  label: string;
  value: number;
  tone: "accent" | "info" | "warning" | "success";
  href: string;
  loading?: boolean;
}) {
  const toneClasses = {
    accent: "bg-brand-red/5 border-brand-red/20",
    info: "bg-blue-50 border-blue-200",
    warning: "bg-amber-50 border-amber-200",
    success: "bg-green-50 border-green-200",
  };
  const toneText = {
    accent: "text-brand-red",
    info: "text-blue-700",
    warning: "text-amber-700",
    success: "text-green-700",
  };

  return (
    <Link
      href={href}
      className={`block rounded-xl border p-4 hover:shadow-md transition-shadow ${toneClasses[tone]}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-gray-600 mb-1">
        {label}
      </p>
      <p className={`text-3xl font-bold ${toneText[tone]}`}>
        {loading ? "—" : value}
      </p>
    </Link>
  );
}

function NavCard({
  href,
  title,
  description,
  badge,
}: {
  href: string;
  title: string;
  description: string;
  badge?: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-white border border-brand-gray-200 rounded-xl p-5 hover:border-brand-red/40 hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h3 className="font-bold text-brand-gray-900 group-hover:text-brand-red">
          {title}
        </h3>
        {badge && (
          <span className="text-[10px] uppercase font-bold bg-brand-red text-white px-2 py-0.5 rounded-full shrink-0">
            {badge}
          </span>
        )}
      </div>
      <p className="text-sm text-brand-gray-600 leading-relaxed">
        {description}
      </p>
      <p className="mt-3 text-sm font-semibold text-brand-red group-hover:underline">
        Open →
      </p>
    </Link>
  );
}
