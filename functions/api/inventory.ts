/**
 * Public GET /api/inventory
 *
 * Returns the latest inventory snapshot written by the inventory-sync
 * Cron Worker (workers/inventory-sync). The site reads this client-side
 * (or via SWR / fetch in pages) so new vehicles appear within ~15 min
 * of being added to Dealer Center, without requiring a site rebuild.
 *
 * Fallback behavior:
 *   - If KV hasn't been seeded yet, return 204. The client falls back to
 *     the build-time inventory baked into src/data/inventory.ts.
 *   - If KV read errors out, return 503 — same fallback behavior client-side.
 *
 * The snapshot shape matches workers/inventory-sync/src/types.ts → InventorySnapshot.
 * The site converts those into the UI-facing Vehicle shape (src/lib/types.ts)
 * via the adapter in src/lib/inventoryAdapter.ts.
 */

interface Env {
  INVENTORY?: KVNamespace;
}

const KV_KEY_CURRENT = "inventory:current";

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  // Allow cache-busting for admin/debug — append ?fresh=1 to bypass edge cache.
  const url = new URL(request.url);
  const isFresh = url.searchParams.get("fresh") === "1";

  if (!env.INVENTORY) {
    // Binding missing — KV not yet provisioned. Tell the client to fall back.
    return new Response(null, {
      status: 204,
      headers: corsHeaders(),
    });
  }

  try {
    const raw = await env.INVENTORY.get(KV_KEY_CURRENT, { type: "json" });
    if (!raw) {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }
    return new Response(JSON.stringify(raw), {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        // 60s edge cache. The cron runs every 15min so 60s is fine and
        // protects KV from a homepage traffic spike.
        "Cache-Control": isFresh
          ? "no-store"
          : "public, max-age=30, s-maxage=60, stale-while-revalidate=300",
        ...corsHeaders(),
      },
    });
  } catch (err) {
    console.error("[/api/inventory] KV read failed:", err);
    return new Response(null, { status: 503, headers: corsHeaders() });
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
