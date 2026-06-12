/**
 * Admin /api/admin/leads
 *
 * GET  — list all finance-application leads (most recent first)
 * PATCH — update a lead's status (new / contacted / qualified / lost)
 *
 * Same Cloudflare Zero Trust Access gate as /api/admin/merchandising.
 * Access terminates unauthenticated requests; this handler also checks
 * cf-access-jwt-assertion defensively.
 */

interface Env {
  LEADS: KVNamespace;
}

type LeadStatus = "new" | "contacted" | "qualified" | "lost";
const VALID_STATUSES: LeadStatus[] = ["new", "contacted", "qualified", "lost"];

export const onRequestGet: PagesFunction<Env> = async ({ request, env }) => {
  const accessJwt = request.headers.get("cf-access-jwt-assertion");
  if (!accessJwt) {
    return json(401, { error: "Unauthenticated." });
  }

  try {
    // List all lead keys. KV list returns up to 1000 per call; we paginate
    // by cursor if needed. Leads are keyed "lead:{iso}-{uuid}" so they
    // naturally sort chronologically ascending — we reverse for most-recent-first.
    const keys: string[] = [];
    let cursor: string | undefined;
    while (true) {
      const page = await env.LEADS.list({ prefix: "lead:", cursor, limit: 1000 });
      keys.push(...page.keys.map((k) => k.name));
      if (page.list_complete) break;
      cursor = page.cursor;
      if (keys.length >= 5000) break; // sanity cap
    }
    keys.sort().reverse();

    // Fetch each lead's body. In a denser future we'd paginate for the
    // client instead of fetching all — fine for now at current volume.
    const leads = await Promise.all(
      keys.slice(0, 200).map(async (key) => {
        const raw = await env.LEADS.get(key, { type: "json" });
        return raw;
      })
    );

    return json(200, {
      ok: true,
      count: leads.filter(Boolean).length,
      leads: leads.filter(Boolean),
    });
  } catch (err) {
    console.error("[/api/admin/leads GET] KV read failed:", err);
    return json(503, { error: "Could not read leads." });
  }
};

export const onRequestPatch: PagesFunction<Env> = async ({ request, env }) => {
  const accessJwt = request.headers.get("cf-access-jwt-assertion");
  if (!accessJwt) {
    return json(401, { error: "Unauthenticated." });
  }

  let body: { id?: string; status?: string; note?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return json(400, { error: "Invalid JSON body." });
  }

  if (!body.id || typeof body.id !== "string") {
    return json(400, { error: "id required" });
  }
  if (!body.status || !VALID_STATUSES.includes(body.status as LeadStatus)) {
    return json(400, {
      error: `status must be one of: ${VALID_STATUSES.join(", ")}`,
    });
  }
  if (body.note && (typeof body.note !== "string" || body.note.length > 2000)) {
    return json(400, { error: "note must be a string ≤ 2000 chars" });
  }

  const key = `lead:${body.id}`;
  const raw = (await env.LEADS.get(key, { type: "json" })) as Record<string, unknown> | null;
  if (!raw) {
    return json(404, { error: "Lead not found" });
  }

  const accessEmail =
    request.headers.get("cf-access-authenticated-user-email") ?? "unknown";

  const updated = {
    ...raw,
    status: body.status,
    statusUpdatedAt: new Date().toISOString(),
    statusUpdatedBy: accessEmail,
    ...(body.note
      ? {
          notes: [
            ...((raw.notes as Array<unknown>) ?? []),
            {
              by: accessEmail,
              at: new Date().toISOString(),
              text: body.note,
            },
          ],
        }
      : {}),
  };

  await env.LEADS.put(key, JSON.stringify(updated));

  return json(200, { ok: true, lead: updated });
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}
