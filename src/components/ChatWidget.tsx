"use client";

/**
 * Website chat — the bubble visitors type into.
 *
 * Owner, 2026-09-13: "Let's complete the rest of the messenger portion." The
 * answering half has run on Railway since 09-12 (auto-reply, the same guards as
 * Franky); this is the window a visitor actually sees.
 *
 * HOW A MESSAGE MOVES
 *   visitor types -> POST /api/chat (Pages Function, holds the intake key)
 *     -> DMS public route (key, origin, rate limit) -> Railway web chat
 *   Railway answers, or hands off and rings the owner's phone. Either way the
 *   thread lands in the DMS conversation inbox beside Marketplace.
 *
 * 🔑 THE SERVER'S THREAD IS WHAT IS SHOWN. A reply the owner types in the DMS
 * or on his phone reaches this window only by polling GET /api/chat, so the
 * window renders what the server recorded, and a local bubble exists only until
 * the server has caught up with it. Two sources of truth is how a reply shows
 * twice or not at all.
 *
 * ⚠️ POLLING IS FRUGAL ON PURPOSE. Every poll is a Vercel invocation and a
 * Railway query. Fast while the window is open and someone is typing, slow
 * when it is closed, and nothing at all once the tab is hidden or the chat has
 * been idle half an hour.
 *
 * ⚠️ NO KEY, NO PII FIELDS, NO CONSENT BOX. It asks for nothing. If a visitor
 * gives a phone number in the conversation, that is the conversation.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { SITE_CONFIG } from "@/lib/constants";

type Author = "buyer" | "franky" | "owner";
interface Turn {
  id: number;
  author: Author;
  body: string;
}
interface LocalTurn {
  key: string;
  author: Author;
  body: string;
}

const SESSION_KEY = "lag-chat-session:v1";
const OPEN_POLL_MS = 4_000;
const CLOSED_POLL_MS = 30_000;
const IDLE_STOP_MS = 30 * 60_000;
const HIDDEN_PATHS = ["/admin", "/sign"];

function readSession(): string | null {
  try {
    return window.localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
}

function newSession(): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  try {
    window.localStorage.setItem(SESSION_KEY, id);
  } catch {
    /* private window: the chat still works for this page view */
  }
  return id;
}

/** The car the visitor is looking at, when they are on a vehicle page. */
function pageVehicle(pathname: string | null): string | undefined {
  if (!pathname?.startsWith("/inventory/")) return undefined;
  const h1 = document.querySelector("h1")?.textContent?.replace(/\s+/g, " ").trim();
  return h1 ? h1.slice(0, 160) : undefined;
}

export default function ChatWidget() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [local, setLocal] = useState<LocalTurn[]>([]);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [waitingOnPerson, setWaitingOnPerson] = useState(false);
  const [unread, setUnread] = useState(false);
  const [honeypot, setHoneypot] = useState("");

  const sessionRef = useRef<string | null>(null);
  const lastIdRef = useRef(0);
  const lastActivityRef = useRef(0);
  const openRef = useRef(false);
  const listRef = useRef<HTMLDivElement>(null);

  const poll = useCallback(async () => {
    const sid = sessionRef.current;
    if (!sid) return;
    try {
      const r = await fetch(
        `/api/chat?session_id=${encodeURIComponent(sid)}&after_id=${lastIdRef.current}`,
        { cache: "no-store" },
      );
      if (!r.ok) return;
      const j = (await r.json()) as { turns?: Turn[]; owner_handling?: boolean };
      const fresh = (j.turns ?? []).filter((t) => t.id > lastIdRef.current);
      if (!fresh.length) return;
      lastIdRef.current = Math.max(...fresh.map((t) => t.id));
      setTurns((prev) => [...prev, ...fresh]);
      // A local bubble is only a placeholder until the server has its copy.
      setLocal((prev) =>
        prev.filter((l) => !fresh.some((t) => t.author === l.author && t.body.trim() === l.body.trim())),
      );
      // Any answer, from the chat or from him, ends the wait. The "we'll answer
      // shortly" line is set by send() alone, so a poll can never bring it back
      // after he has already replied.
      if (fresh.some((t) => t.author !== "buyer")) setWaitingOnPerson(false);
      if (fresh.some((t) => t.author === "owner")) {
        if (!openRef.current) setUnread(true);
      }
    } catch {
      /* offline: the next tick tries again */
    }
  }, []);

  // Pick up a chat this visitor already started, so a page change or a reload
  // does not throw the conversation away.
  useEffect(() => {
    const existing = readSession();
    if (existing) {
      sessionRef.current = existing;
      lastActivityRef.current = Date.now();
      void poll();
    }
  }, [poll]);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // The polling loop.
  useEffect(() => {
    if (!sessionRef.current && !open) return;
    const every = open ? OPEN_POLL_MS : CLOSED_POLL_MS;
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastActivityRef.current > IDLE_STOP_MS) return;
      void poll();
    }, every);
    return () => window.clearInterval(timer);
  }, [open, poll]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns, local, open, waitingOnPerson]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    const sid = sessionRef.current ?? newSession();
    sessionRef.current = sid;
    lastActivityRef.current = Date.now();
    setDraft("");
    setSending(true);
    const mine: LocalTurn = { key: `me-${Date.now()}`, author: "buyer", body: text };
    setLocal((prev) => [...prev, mine]);

    try {
      const r = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sid,
          message: text,
          page_vehicle: pageVehicle(pathname),
          page_url: window.location.href.slice(0, 500),
          honeypot,
        }),
      });
      const j = (await r.json().catch(() => ({}))) as {
        reply?: string;
        handoff?: boolean;
        owner_handling?: boolean;
        error?: string;
      };
      if (r.status === 429) {
        setLocal((prev) => [
          ...prev,
          { key: `sys-${Date.now()}`, author: "franky", body: j.error || "One moment, please." },
        ]);
        return;
      }
      const reply = (j.reply ?? "").trim();
      if (reply) {
        setLocal((prev) => [...prev, { key: `re-${Date.now()}`, author: "franky", body: reply }]);
      }
      setWaitingOnPerson(!reply && (j.handoff === true || j.owner_handling === true));
      await poll();
    } catch {
      setWaitingOnPerson(true);
    } finally {
      setSending(false);
    }
  };

  if (HIDDEN_PATHS.some((p) => pathname?.startsWith(p))) return null;

  const shown: { key: string; author: Author; body: string }[] = [
    ...turns.map((t) => ({ key: `t-${t.id}`, author: t.author, body: t.body })),
    ...local,
  ];

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setUnread(false);
            lastActivityRef.current = Date.now();
            if (sessionRef.current) void poll();
          }}
          className="fixed bottom-20 left-4 z-40 flex items-center gap-2 rounded-full bg-brand-navy px-4 py-3 text-white shadow-xl transition-all hover:bg-black sm:bottom-6 sm:left-6"
          aria-label="Chat with us"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.3 48.3 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.4 48.4 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
          </svg>
          <span className="text-sm font-semibold">Chat</span>
          {unread && <span className="absolute -right-0.5 -top-0.5 h-3 w-3 rounded-full border-2 border-white bg-brand-red" aria-label="New reply" />}
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Chat with Love Auto Group"
          className="fixed inset-x-2 bottom-2 z-50 flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:inset-x-auto sm:bottom-6 sm:left-6 sm:w-[360px]"
        >
          <div className="flex items-center justify-between bg-brand-navy px-4 py-3 text-white">
            <div>
              <p className="text-sm font-bold">Love Auto Group</p>
              <p className="text-xs text-gray-300">Ask about a car, a price, or a visit</p>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full p-1 text-gray-300 hover:bg-white/10 hover:text-white"
              aria-label="Close chat"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div ref={listRef} className="min-h-[220px] flex-1 space-y-2 overflow-y-auto bg-gray-50 px-3 py-3">
            {shown.length === 0 && (
              <p className="rounded-xl bg-white px-3 py-2 text-sm text-gray-700 shadow-sm">
                Hi! What can we help you with today?
              </p>
            )}
            {shown.map((m) => (
              <div key={m.key} className={m.author === "buyer" ? "flex justify-end" : "flex justify-start"}>
                <p
                  className={
                    m.author === "buyer"
                      ? "max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-br-sm bg-brand-red px-3 py-2 text-sm text-white"
                      : "max-w-[80%] whitespace-pre-wrap rounded-2xl rounded-bl-sm bg-white px-3 py-2 text-sm text-gray-800 shadow-sm"
                  }
                >
                  {m.body}
                </p>
              </div>
            ))}
            {sending && <p className="text-xs text-gray-400">Typing…</p>}
            {waitingOnPerson && !sending && (
              <p className="rounded-xl bg-white px-3 py-2 text-xs text-gray-600 shadow-sm">
                Thanks! We&apos;ll answer you right here shortly. In a hurry? Call{" "}
                <a className="font-semibold text-brand-red" href={`tel:${SITE_CONFIG.phoneRaw}`}>
                  {SITE_CONFIG.phone}
                </a>
                .
              </p>
            )}
          </div>

          <form
            className="flex items-end gap-2 border-t border-gray-200 bg-white p-2"
            onSubmit={(e) => {
              e.preventDefault();
              void send();
            }}
          >
            {/* Bots fill every field they find. People never see this one. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              className="hidden"
              aria-hidden="true"
            />
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 1000))}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              rows={1}
              placeholder="Type a message…"
              className="max-h-28 min-h-[40px] flex-1 resize-none rounded-xl border border-gray-300 px-3 py-2 text-base focus:border-brand-red focus:outline-none sm:text-sm"
              aria-label="Message"
            />
            <button
              type="submit"
              disabled={!draft.trim() || sending}
              className="h-10 rounded-xl bg-brand-red px-4 text-sm font-semibold text-white hover:bg-brand-red-dark disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
