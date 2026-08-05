/**
 * Admin POST /api/admin/merchandising
 *
 * Writes a new merchandising config to Cloudflare KV.
 *
 * Auth: requireAdmin() from _lib/admin-auth (the __Secure-lag_admin session
 * cookie). There is no Cloudflare Access application in front of this route —
 * the session cookie is the only gate, and it fails closed.
 */

import { MerchandisingConfigInput, validateMerchandisingConfig } from "../../_lib/validation";
import { requireAdmin, type AdminAuthEnv } from "../../_lib/admin-auth";

interface Env extends AdminAuthEnv {
  MERCHANDISING: KVNamespace;
}

const CONFIG_KEY = "config:v1";
const MAX_BODY_BYTES = 64 * 1024; // 64KB should be plenty for merchandising config

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // Require a valid admin session cookie.
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  // Identify the user for the audit trail.
  const accessEmail =
    "admin";

  // Enforce a reasonable body size so a bad actor can't fill KV with garbage
  // if they somehow slip past Access.
  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return json(413, { error: "Payload too large. Max 64KB." });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  const validation = validateMerchandisingConfig(body);
  if (!validation.ok) {
    return json(400, {
      error: "Invalid merchandising config.",
      issues: validation.issues,
    });
  }

  const incoming = validation.value as MerchandisingConfigInput;

  // --- Optimistic concurrency check -------------------------------------
  // Every save here is a whole-config overwrite, so without a precondition
  // the last writer silently wins. That matters because this key has TWO
  // independent writers: this editor, and the DMS (which writes overlays
  // straight to the same KV key through its own Cloudflare API path, not
  // through this endpoint). The realistic loss looks like: an admin opens
  // the editor, spends five minutes arranging featured vehicles, the DMS
  // saves a carfax/pill overlay in the meantime, the admin hits Save — and
  // the DMS overlay is wiped with no error shown. That exact shape has
  // already bitten this system once before (the 2026-06-07 overlay-clobber
  // incident).
  //
  // The client sends the `lastUpdated` it loaded as If-Match. If the stored
  // value has moved on since, reject with 409 and hand back what's actually
  // in KV so the client can reload rather than overwrite blind.
  //
  // Honest limits: KV is eventually consistent, so this is a guard against
  // human-timescale collisions (seconds to minutes apart), not a true
  // compare-and-swap. It cannot make simultaneous writes safe. A request
  // with no If-Match header is still accepted — that's the deliberate
  // escape hatch for recovery/scripted writes.
  const ifMatch = request.headers.get("if-match");
  if (ifMatch) {
    let currentVersion: string | null = null;
    try {
      const current = await env.MERCHANDISING.get(CONFIG_KEY, { type: "json" });
      currentVersion =
        (current as { lastUpdated?: string } | null)?.lastUpdated ?? null;
    } catch (err) {
      console.error("[/api/admin/merchandising] precondition read failed:", err);
      return json(503, { error: "Could not verify current config. Try again." });
    }

    // An empty key is a valid first write — only a real, differing version
    // is a conflict.
    if (currentVersion !== null && currentVersion !== ifMatch) {
      return json(409, {
        error:
          "This config changed after you loaded it — saving now would " +
          "overwrite those changes. Reload the page and reapply your edits.",
        currentVersion,
        yourVersion: ifMatch,
      });
    }
  }

  // Stamp audit trail fields server-side so clients can't forge them.
  const toStore = {
    ...incoming,
    lastUpdated: new Date().toISOString(),
    updatedBy: accessEmail,
  };

  try {
    await env.MERCHANDISING.put(CONFIG_KEY, JSON.stringify(toStore), {
      // No TTL — config should persist indefinitely until next write.
      metadata: {
        updatedBy: accessEmail,
        updatedAt: toStore.lastUpdated,
      },
    });
  } catch (err) {
    console.error("[/api/admin/merchandising] KV write failed:", err);
    return json(503, { error: "Could not save config. Try again." });
  }

  return json(200, {
    ok: true,
    lastUpdated: toStore.lastUpdated,
    updatedBy: accessEmail,
  });
};

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  // Same auth gate as POST — admin read returns full config plus audit
  // metadata (public GET at /api/merchandising omits metadata).
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  try {
    const { value, metadata } = await env.MERCHANDISING.getWithMetadata(
      CONFIG_KEY,
      { type: "json" }
    );
    // `version` is the token the client echoes back as If-Match on save.
    // Surfaced at the top level (rather than leaving the client to dig it
    // out of config.lastUpdated) so the precondition contract is explicit.
    const version =
      (value as { lastUpdated?: string } | null)?.lastUpdated ?? null;
    return json(200, { config: value, metadata, version });
  } catch (err) {
    console.error("[/api/admin/merchandising GET] KV read failed:", err);
    return json(503, { error: "Could not read config." });
  }
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      // Admin data must never be stored by a browser, a shared proxy, or
      // Cloudflare's edge. public/_headers does NOT cover Pages Functions
      // responses, so the header has to be set right here.
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "X-Robots-Tag": "noindex, nofollow, noarchive",
    },
  });
}
