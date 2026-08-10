"use client";

/**
 * Sentry browser error tracking — loveautogroup.net.
 *
 * Why this exists: until 2026-08-10 the customer-facing site had NO error
 * tracking of any kind. A shopper hitting a broken VDP or a failing credit-app
 * submission simply leaves, and nothing recorded that it happened. The Railway
 * API and the mobile app have had Sentry for months; this was the gap that
 * mattered most, because it is the only surface where the person who hits the
 * error is a customer rather than staff.
 *
 * ⚠️ THE DSN IS HARDCODED ON PURPOSE — do not "fix" it to read NEXT_PUBLIC_*.
 * On this Cloudflare Pages `output: "export"` pipeline, NEXT_PUBLIC_* vars
 * compile to runtime `process.env` reads that are EMPTY in the browser. That is
 * the same trap that silently 401'd every website lead for months (S27) and the
 * reason GoogleAnalytics.tsx hardcodes its Measurement ID and says so. A Sentry
 * DSN is public by design — it ships in the browser bundle of every site that
 * uses Sentry — so hardcoding it is safe, exactly like the GA4 ID.
 *
 * ⚠️ CSP: the ingest host is allow-listed in `public/_headers` under
 * connect-src. Without that entry every event is blocked by the browser and
 * Sentry stays silent while looking perfectly configured. Nothing was added to
 * script-src, because the SDK is bundled rather than loaded from a CDN.
 *
 * SCOPE: errors only. No tracing, no session replay. This is a marketing site
 * where Core Web Vitals matter, and the question being answered is "did a
 * customer hit an error", not "how long did this span take". Both can be turned
 * on later if the error data justifies it.
 *
 * VERIFY IT WORKS by grepping the BUILT bundle for the DSN key, not by reading
 * this file:  npm run build && grep -rl "889e9e5c207d90d22e3891dcd1231393" out/
 */

import { useEffect } from "react";
import * as Sentry from "@sentry/browser";

const SENTRY_DSN =
  "https://889e9e5c207d90d22e3891dcd1231393@o4511298664202240.ingest.us.sentry.io/4511887499067392";

let started = false;

export function SentryInit() {
  useEffect(() => {
    // Guard against double-init across client-side navigations and Fast Refresh.
    if (started) return;
    started = true;

    Sentry.init({
      dsn: SENTRY_DSN,
      environment: "production",
      // Errors only — see SCOPE above.
      tracesSampleRate: 0,
      // Drop noise that is not ours and not actionable: browser extensions and
      // third-party embeds (CarGurus badge, Google Maps, the CF beacon) throw
      // into the page and would otherwise bury real site errors.
      ignoreErrors: [
        "ResizeObserver loop limit exceeded",
        "ResizeObserver loop completed with undelivered notifications",
        "Non-Error promise rejection captured",
      ],
      denyUrls: [/extensions\//i, /^chrome:\/\//i, /^moz-extension:\/\//i],
    });
  }, []);

  return null;
}
