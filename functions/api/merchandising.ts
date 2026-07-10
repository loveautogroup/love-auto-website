/**
 * Public GET /api/merchandising
 *
 * Returns the current merchandising config from Cloudflare KV. The website
 * fetches this client-side on mount to pick up Jordan's latest featuring
 * decisions without waiting for a site rebuild.
 *
 * Fallback behavior: if KV is empty or unavailable, the client uses the
 * config baked into src/data/merchandising.ts at build time. This means the
 * site always renders correctly even if KV or Functions go down.
 */

interface Env {
  /** KV namespace binding configured in wrangler.jsonc. */
  MERCHANDISING: KVNamespace;
}

const CONFIG_KEY = "config:v1";

// Phase 6c: this endpoint is PUBLIC (no auth). Return only the display fields
// the site/DMS render — never the raw KV blob, which the admin write path can
// stamp with internal audit metadata (savedBy / updatedBy / lastUpdated) or a
// future private note. Allowlist projection = internal fields can't leak.
const PUBLIC_MERCH_FIELDS = ["featuredVins", "defaultWarranty", "textPhone", "overlays"] as const;
function toPublicMerchConfig(raw: unknown): Record<string, unknown> {
  const c = (raw ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of PUBLIC_MERCH_FIELDS) if (k in c) out[k] = c[k];
  return out;
}


export const onRequestGet: PagesFunction<Env> = async ({ env }) => {
  try {
    const raw = await env.MERCHANDISING.get(CONFIG_KEY, { type: "json" });

    // If KV hasn't been seeded yet, return 204 so the client uses its baked-in
    // fallback. 204 prevents the client from trying to parse an empty body.
    if (!raw) {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    return new Response(JSON.stringify(toPublicMerchConfig(raw)), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        // Short cache: config updates should propagate within a minute
        "Cache-Control": "public, max-age=60, s-maxage=60",
        ...corsHeaders(),
      },
    });
  } catch (err) {
    // KV read failed — log and signal to client that it should fall back.
    console.error("[/api/merchandising] KV read failed:", err);
    return new Response(null, {
      status: 503,
      headers: corsHeaders(),
    });
  }
};

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

export const onRequestOptions: PagesFunction<Env> = async () =>
  new Response(null, { status: 204, headers: corsHeaders() });
