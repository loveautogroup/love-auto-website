/**
 * Admin POST /api/admin/merchandising
 *
 * Writes a new merchandising config to Cloudflare KV. This endpoint is
 * intended to be protected by Cloudflare Zero Trust Access at the
 * application layer — CF Access terminates unauthenticated requests
 * before they reach this Function, so we don't hand-roll auth here.
 *
 * Configure Access in the Cloudflare dashboard:
 *   - Application: "Love Auto Group Admin"
 *   - Domain: loveautogroup.pages.dev/admin/*  AND  loveautogroup.pages.dev/api/admin/*
 *   - Policy: emails allow-list (Jeremiah + Jordan)
 *   - Session duration: 24 hours (or as preferred)
 *
 * Defense in depth: this handler also checks for the CF Access JWT header
 * (cf-access-jwt-assertion) and rejects requests missing it. This catches
 * any misconfiguration where the Access gate doesn't cover this endpoint.
 */

import { MerchandisingConfigInput, validateMerchandisingConfig } from "../../_lib/validation";

interface Env {
  MERCHANDISING: KVNamespace;
  /** Set in CF Pages env vars. Team domain for Access, e.g. "loveauto.cloudflareaccess.com". */
  CF_ACCESS_TEAM_DOMAIN?: string;
  /** Set in CF Pages env vars. Application AUD tag from Access config. */
  CF_ACCESS_AUD?: string;
}

const CONFIG_KEY = "config:v1";
const MAX_BODY_BYTES = 64 * 1024; // 64KB should be plenty for merchandising config

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  // CF Access JWT defense in depth — should already be enforced by Access.
  const accessJwt = request.headers.get("cf-access-jwt-assertion");
  if (!accessJwt) {
    return json(401, {
      error: "Unauthenticated. Cloudflare Access required.",
    });
  }

  // Identify the user for the audit trail.
  const accessEmail =
    request.headers.get("cf-access-authenticated-user-email") ?? "unknown";

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
  const accessJwt = request.headers.get("cf-access-jwt-assertion");
  if (!accessJwt) {
    return json(401, { error: "Unauthenticated." });
  }

  try {
    const { value, metadata } = await env.MERCHANDISING.getWithMetadata(
      CONFIG_KEY,
      { type: "json" }
    );
    return json(200, { config: value, metadata });
  } catch (err) {
    console.error("[/api/admin/merchandising GET] KV read failed:", err);
    return json(503, { error: "Could not read config." });
  }
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
