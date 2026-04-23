"use client";

import { useEffect, useState } from "react";

interface Note {
  by: string;
  at: string;
  text: string;
}

interface Lead {
  id: string;
  submittedAt: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  dateOfBirth: string;
  housingStatus: string;
  monthlyHousingPayment?: number;
  employmentStatus: string;
  employer?: string;
  jobTitle?: string;
  monthlyIncome: number;
  timeAtJobMonths?: number;
  vehicleInterest?: string;
  desiredMonthlyPayment?: number;
  desiredDownPayment?: number;
  hasTradeIn: boolean;
  tradeInDetails?: string;
  status: "new" | "contacted" | "qualified" | "lost";
  statusUpdatedAt?: string;
  statusUpdatedBy?: string;
  notes?: Note[];
  sourceIp?: string;
  userAgent?: string;
}

const STATUS_COLORS: Record<Lead["status"], string> = {
  new: "bg-brand-green text-white",
  contacted: "bg-blue-500 text-white",
  qualified: "bg-amber-500 text-white",
  lost: "bg-brand-gray-400 text-white",
};

const STATUS_LABELS: Record<Lead["status"], string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  lost: "Lost",
};

export default function LeadsAdmin() {
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [selected, setSelected] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState<Lead["status"] | "all">(
    "all"
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function fetchLeads() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/leads", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setLeads((data.leads ?? []) as Lead[]);
    } catch (err) {
      setError(`Could not load leads. ${(err as Error).message}`);
      setLeads([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchLeads();
  }, []);

  async function updateStatus(lead: Lead, status: Lead["status"], noteText?: string) {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/leads", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: lead.id, status, note: noteText }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      // Refresh list and selected detail from server
      setLeads((prev) =>
        prev ? prev.map((l) => (l.id === lead.id ? (data.lead as Lead) : l)) : prev
      );
      setSelected(data.lead as Lead);
      setNote("");
    } catch (err) {
      alert(`Update failed: ${(err as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  const filtered = (leads ?? []).filter(
    (l) => statusFilter === "all" || l.status === statusFilter
  );

  const counts = {
    new: (leads ?? []).filter((l) => l.status === "new").length,
    contacted: (leads ?? []).filter((l) => l.status === "contacted").length,
    qualified: (leads ?? []).filter((l) => l.status === "qualified").length,
    lost: (leads ?? []).filter((l) => l.status === "lost").length,
    total: (leads ?? []).length,
  };

  if (loading) {
    return <p className="text-brand-gray-500">Loading leads…</p>;
  }

  if (error) {
    return (
      <div className="bg-brand-red/10 border border-brand-red/20 rounded-lg p-4 text-brand-red">
        {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[minmax(420px,1fr)_minmax(480px,1fr)] gap-6">
      {/* List */}
      <div className="bg-white rounded-xl border border-brand-gray-200 overflow-hidden">
        {/* Filter tabs */}
        <div className="border-b border-brand-gray-200 p-3 flex flex-wrap gap-2">
          {(["all", "new", "contacted", "qualified", "lost"] as const).map(
            (s) => {
              const isActive = statusFilter === s;
              const count =
                s === "all"
                  ? counts.total
                  : counts[s as keyof Omit<typeof counts, "total">];
              return (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`px-3 py-1 rounded-full text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-brand-navy text-white"
                      : "bg-brand-gray-100 text-brand-gray-600 hover:bg-brand-gray-200"
                  }`}
                >
                  {s === "all" ? "All" : STATUS_LABELS[s]}{" "}
                  <span className="text-xs opacity-70">({count})</span>
                </button>
              );
            }
          )}
          <div className="grow" />
          <button
            onClick={fetchLeads}
            className="px-3 py-1 rounded-full text-sm font-semibold bg-brand-gray-100 text-brand-gray-600 hover:bg-brand-gray-200"
            title="Refresh"
          >
            ↻ Refresh
          </button>
        </div>

        <ul className="divide-y divide-brand-gray-100 max-h-[70vh] overflow-y-auto">
          {filtered.length === 0 && (
            <li className="p-8 text-center text-brand-gray-500 text-sm">
              No leads{statusFilter !== "all" ? ` with status "${statusFilter}"` : ""}.
            </li>
          )}
          {filtered.map((lead) => (
            <li
              key={lead.id}
              className={`p-4 cursor-pointer transition-colors ${
                selected?.id === lead.id
                  ? "bg-brand-red/5 border-l-4 border-brand-red"
                  : "hover:bg-brand-gray-50"
              }`}
              onClick={() => setSelected(lead)}
            >
              <div className="flex justify-between items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-brand-gray-900 truncate">
                    {lead.firstName} {lead.lastName}
                  </p>
                  <p className="text-sm text-brand-gray-500 truncate">
                    {lead.phone} · {lead.email}
                  </p>
                  {lead.vehicleInterest && (
                    <p className="text-xs text-brand-gray-500 mt-1 truncate">
                      Wants: {lead.vehicleInterest}
                    </p>
                  )}
                </div>
                <span
                  className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_COLORS[lead.status]}`}
                >
                  {STATUS_LABELS[lead.status]}
                </span>
              </div>
              <p className="text-xs text-brand-gray-400 mt-2">
                {new Date(lead.submittedAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      </div>

      {/* Detail */}
      <div className="bg-white rounded-xl border border-brand-gray-200 p-6 sticky top-8 self-start max-h-[85vh] overflow-y-auto">
        {!selected ? (
          <p className="text-brand-gray-500 text-sm">
            Select a lead from the list to see details.
          </p>
        ) : (
          <>
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h2 className="text-xl font-bold text-brand-gray-900">
                  {selected.firstName} {selected.lastName}
                </h2>
                <p className="text-sm text-brand-gray-500">
                  Submitted {new Date(selected.submittedAt).toLocaleString()}
                </p>
              </div>
              <span
                className={`text-xs uppercase font-bold px-2 py-1 rounded-full ${STATUS_COLORS[selected.status]}`}
              >
                {STATUS_LABELS[selected.status]}
              </span>
            </div>

            {/* Quick action row */}
            <div className="flex flex-wrap gap-2 mb-6">
              <a
                href={`tel:${selected.phone.replace(/\D/g, "")}`}
                className="inline-flex items-center gap-1 bg-brand-green hover:bg-green-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg"
              >
                📞 Call
              </a>
              <a
                href={`sms:${selected.phone.replace(/\D/g, "")}?body=${encodeURIComponent(
                  `Hi ${selected.firstName}, this is Jordan from Love Auto Group. Saw you filled out our financing form — I have some options for you. What's a good time to talk?`
                )}`}
                className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-3 py-1.5 rounded-lg"
              >
                💬 Text
              </a>
              <a
                href={`mailto:${selected.email}`}
                className="inline-flex items-center gap-1 border-2 border-brand-gray-200 hover:bg-brand-gray-50 text-brand-gray-700 text-sm font-semibold px-3 py-1.5 rounded-lg"
              >
                ✉️ Email
              </a>
            </div>

            {/* Detail sections */}
            <section className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-brand-gray-500 mb-2">
                Contact
              </h3>
              <dl className="text-sm space-y-1">
                <Row label="Phone" value={selected.phone} />
                <Row label="Email" value={selected.email} />
                <Row
                  label="Address"
                  value={`${selected.addressStreet}, ${selected.addressCity}, ${selected.addressState} ${selected.addressZip}`}
                />
                <Row label="DOB" value={selected.dateOfBirth} />
              </dl>
            </section>

            <section className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-brand-gray-500 mb-2">
                Housing & Income
              </h3>
              <dl className="text-sm space-y-1">
                <Row label="Housing" value={selected.housingStatus} />
                {selected.monthlyHousingPayment != null && (
                  <Row
                    label="Housing payment"
                    value={`$${selected.monthlyHousingPayment.toLocaleString()}/mo`}
                  />
                )}
                <Row label="Employment" value={selected.employmentStatus} />
                {selected.employer && <Row label="Employer" value={selected.employer} />}
                {selected.jobTitle && (
                  <Row label="Job title" value={selected.jobTitle} />
                )}
                {selected.timeAtJobMonths != null && (
                  <Row
                    label="Time at job"
                    value={`${selected.timeAtJobMonths} months`}
                  />
                )}
                <Row
                  label="Monthly income"
                  value={`$${selected.monthlyIncome.toLocaleString()}/mo`}
                />
              </dl>
            </section>

            <section className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-brand-gray-500 mb-2">
                Vehicle Interest
              </h3>
              <dl className="text-sm space-y-1">
                {selected.vehicleInterest ? (
                  <Row label="Interested in" value={selected.vehicleInterest} />
                ) : (
                  <p className="text-brand-gray-400 italic">Not specified.</p>
                )}
                {selected.desiredMonthlyPayment != null && (
                  <Row
                    label="Desired payment"
                    value={`$${selected.desiredMonthlyPayment.toLocaleString()}/mo`}
                  />
                )}
                {selected.desiredDownPayment != null && (
                  <Row
                    label="Down payment"
                    value={`$${selected.desiredDownPayment.toLocaleString()}`}
                  />
                )}
              </dl>
            </section>

            <section className="mb-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-brand-gray-500 mb-2">
                Trade-In
              </h3>
              {selected.hasTradeIn && selected.tradeInDetails ? (
                <p className="text-sm whitespace-pre-wrap">{selected.tradeInDetails}</p>
              ) : (
                <p className="text-sm text-brand-gray-400 italic">None.</p>
              )}
            </section>

            {/* Status updater */}
            <section className="mb-5 border-t border-brand-gray-200 pt-5">
              <h3 className="text-xs font-bold uppercase tracking-wide text-brand-gray-500 mb-2">
                Update Status
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {(["new", "contacted", "qualified", "lost"] as const).map((s) => (
                  <button
                    key={s}
                    disabled={saving || selected.status === s}
                    onClick={() => updateStatus(selected, s, note.trim() || undefined)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 ${
                      selected.status === s
                        ? "bg-brand-navy text-white"
                        : "bg-brand-gray-100 text-brand-gray-700 hover:bg-brand-gray-200"
                    }`}
                  >
                    {STATUS_LABELS[s]}
                  </button>
                ))}
              </div>
              <textarea
                rows={3}
                placeholder="Add a note (optional — sent with status change)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border border-brand-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
              />
            </section>

            {/* Note history */}
            {selected.notes && selected.notes.length > 0 && (
              <section className="mb-5 border-t border-brand-gray-200 pt-5">
                <h3 className="text-xs font-bold uppercase tracking-wide text-brand-gray-500 mb-2">
                  Activity
                </h3>
                <ul className="space-y-3 text-sm">
                  {selected.notes
                    .slice()
                    .reverse()
                    .map((n, i) => (
                      <li key={i} className="border-l-2 border-brand-gray-200 pl-3">
                        <p className="text-brand-gray-500 text-xs">
                          {n.by} · {new Date(n.at).toLocaleString()}
                        </p>
                        <p className="text-brand-gray-900 mt-0.5">{n.text}</p>
                      </li>
                    ))}
                </ul>
              </section>
            )}

            {/* Footer meta */}
            <section className="mt-6 pt-5 border-t border-brand-gray-100 text-xs text-brand-gray-400 space-y-1">
              <p>
                Lead ID: <code>{selected.id}</code>
              </p>
              {selected.sourceIp && <p>Source IP: {selected.sourceIp}</p>}
              {selected.userAgent && (
                <p className="truncate" title={selected.userAgent}>
                  UA: {selected.userAgent}
                </p>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[120px_1fr] gap-2">
      <dt className="text-brand-gray-500">{label}</dt>
      <dd className="text-brand-gray-900 break-words">{value}</dd>
    </div>
  );
}
