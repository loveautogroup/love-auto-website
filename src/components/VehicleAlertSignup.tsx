"use client";

/**
 * VehicleAlertSignup — W2 demand capture (Jun 7 2026).
 *
 * Small per-make new-arrival alert form. Mounted in the inventory filter
 * sidebar. POSTs to /api/vehicle-alerts (CF Pages Function -> LEADS KV);
 * the DMS notification sweep emails subscribers when a matching vehicle
 * goes live. Bilingual via useLanguage (t.alerts).
 */

import { useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";

const MAKES = ["Subaru", "Lexus", "Acura", "Mazda", "Honda", "Toyota"];

export default function VehicleAlertSignup({ defaultMake = "" }: { defaultMake?: string }) {
  const { t, locale } = useLanguage();
  const a = t.alerts;
  const [email, setEmail] = useState("");
  const [make, setMake] = useState(defaultMake.toLowerCase());
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [errMsg, setErrMsg] = useState<string | null>(null);
  // Captured once on mount — the anti-bot min-elapsed check server-side.
  const startedAt = useRef(Date.now());

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (state === "sending" || state === "done") return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
      setErrMsg(a.invalidEmail);
      setState("error");
      return;
    }
    setState("sending");
    setErrMsg(null);
    try {
      const res = await fetch("/api/vehicle-alerts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          make: make || "any",
          locale,
          website: "", // honeypot stays empty for humans
          startedAt: startedAt.current,
        }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setState("done");
    } catch {
      setErrMsg(a.error);
      setState("error");
    }
  }

  if (state === "done") {
    return (
      <div className="rounded-lg bg-brand-gray-50 border border-brand-gray-200 p-4 text-sm text-brand-gray-700">
        <p className="font-semibold text-brand-gray-900 mb-1">{a.title}</p>
        <p>{a.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-2.5">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-gray-400 px-1">
        {a.title}
      </h3>
      <p className="text-xs text-brand-gray-500 px-1">{a.blurb}</p>
      <select
        aria-label={t.filters.make}
        value={make}
        onChange={(e) => setMake(e.target.value)}
        className="w-full border border-brand-gray-200 rounded-lg px-3 py-2.5 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
      >
        <option value="">{a.anyMake}</option>
        {MAKES.map((m) => (
          <option key={m} value={m.toLowerCase()}>
            {m}
          </option>
        ))}
      </select>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={a.emailPlaceholder}
        aria-label={a.emailPlaceholder}
        className="w-full border border-brand-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red"
      />
      {/* Honeypot — visually hidden, bots fill it, server rejects. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        onChange={() => {/* intentionally ignored */}}
      />
      <button
        type="submit"
        disabled={state === "sending"}
        className="w-full bg-brand-red hover:bg-brand-red-dark disabled:opacity-60 text-white py-2.5 rounded-lg text-sm font-semibold transition-colors"
      >
        {state === "sending" ? a.sending : a.button}
      </button>
      {state === "error" && errMsg && (
        <p className="text-xs text-brand-red px-1">{errMsg}</p>
      )}
    </form>
  );
}
