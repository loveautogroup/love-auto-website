"use client";

/**
 * Shared open/unread state for the site chat panel.
 *
 * Redesign 2026-09 (Bob's editorial-automotive concept): the three floating
 * corner widgets (chat bubble, "Get a quote" pill, Text Us pill) collapse
 * into ONE flat action — Text Us — with chat and the quote form moved into
 * the page flow (a CTA band above the footer). ChatWidget still owns every
 * bit of its polling/session logic; only WHERE its open/closed switch lives
 * moved, so a "Chat with us" link anywhere on the page can open the same
 * panel without prop-drilling.
 */

import { createContext, useContext, useState, type ReactNode } from "react";

interface ChatWidgetContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  unread: boolean;
  setUnread: (unread: boolean) => void;
}

// Default value is a harmless no-op — used only if a consumer somehow
// renders outside ChatWidgetProvider (layout.tsx always wraps the tree).
const ChatWidgetContext = createContext<ChatWidgetContextValue>({
  open: false,
  setOpen: () => {},
  unread: false,
  setUnread: () => {},
});

export function ChatWidgetProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(false);
  return (
    <ChatWidgetContext.Provider value={{ open, setOpen, unread, setUnread }}>
      {children}
    </ChatWidgetContext.Provider>
  );
}

export function useChatWidget(): ChatWidgetContextValue {
  return useContext(ChatWidgetContext);
}
