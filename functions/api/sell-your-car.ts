/**
 * POST /api/sell-your-car
 *
 * W1 acquisition funnel: receives sell-us-your-car submissions (the old
 * form silently dropped them — it never POSTed anywhere). Validates,
 * stores the lead in KV for the DMS Acquisitions page, photos stored as
 * separate KV entries so the lead record stays small.
 *
 * KV layout:
 *   acq:{ISO timestamp}:{random}      → lead JSON (chronological sort)
 *   acqphoto:{leadId}:{n}             → data-URL JPEG (client-compressed)
 *
 * Anti-abuse mirrors finance-application.ts: honeypot + min-elapsed time +
 * per-IP rate limit (3/hour).
 */

interface Env {
  LEADS: KVNamespace;
  /** Same key the leads and credit-app proxies use. Server-side only: a
   *  NEXT_PUBLIC_* name never inlines into the client bundle on this build
   *  pipeline, which is why every DMS post goes through a Function. */
  NEXT_PUBLIC_DMS_INTAKE_KEY?: string;
}

interface AcquisitionInput {
  vin?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  mileage?: number;
  condition?: string;
  askingPrice?: number;
  notes?: string;
  name?: string;
  phone?: string;
  email?: string;
  photos?: string[]; // data-URL JPEGs, client-compressed
  // anti-abuse
  website?: string; // honeypot — must be empty
  startedAt?: number; // ms epoch when the form rendered
}

const MAX_PHOTOS = 6;
const MAX_PHOTO_BYTES = 600_000; // ~600KB data-URL each (client compresses)
/** 180 days — same retention as the finance-application store. */
export const ACQ_TTL_SECONDS = 180 * 24 * 60 * 60;

async function checkRateLimit(
  ip: string | undefined,
  env: Env
): Promise<boolean> {
  if (!ip) return true;
  const key = `rate:acq:${ip}`;
  const now = Math.floor(Date.now() / 1000);
  const raw = await env.LEADS.get(key);
  const attempts: number[] = raw ? JSON.parse(raw) : [];
  const recent = attempts.filter((t) => now - t < 3600);
  if (recent.length >= 3) return false;
  recent.push(now);
  await env.LEADS.put(key, JSON.stringify(recent), { expirationTtl: 3700 });
  return true;
}

function bad(msg: string, status = 400): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const onRequestPost: PagesFunction<Env> = async (ctx) => {
  const ip = ctx.request.headers.get("CF-Connecting-IP") ?? undefined;
  if (!(await checkRateLimit(ip, ctx.env))) {
    return bad("Too many submissions. Try again in an hour.", 429);
  }

  let body: AcquisitionInput;
  try {
    body = await ctx.request.json();
  } catch {
    return bad("Invalid request body.");
  }

  // Honeypot + min-elapsed (bots fill hidden fields and submit instantly).
  if (body.website) return bad("Submission rejected.");
  if (body.startedAt && Date.now() - body.startedAt < 3000) {
    return bad("Submission rejected.");
  }

  const year = Number(body.year);
  const mileage = Number(body.mileage);
  const name = (body.name ?? "").trim();
  const phone = (body.phone ?? "").trim();
  const email = (body.email ?? "").trim();
  const condition = (body.condition ?? "").trim().toLowerCase();

  if (!year || year < 1980 || year > new Date().getFullYear() + 1) return bad("Valid year required.");
  if (!(body.make ?? "").trim()) return bad("Make required.");
  if (!(body.model ?? "").trim()) return bad("Model required.");
  if (!mileage || mileage < 1 || mileage > 500_000) return bad("Valid mileage required.");
  if (!["excellent", "good", "fair", "poor"].includes(condition)) return bad("Condition required.");
  if (name.length < 2) return bad("Name required.");
  if (phone.replace(/\D/g, "").length < 10) return bad("Valid phone required.");
  if (!email.includes("@")) return bad("Valid email required.");
  const vin = (body.vin ?? "").trim().toUpperCase();
  if (vin && !/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return bad("VIN must be 17 characters (no I, O, Q).");

  const photos = (body.photos ?? []).slice(0, MAX_PHOTOS);
  for (const p of photos) {
    if (typeof p !== "string" || !p.startsWith("data:image/")) return bad("Bad photo data.");
    if (p.length > MAX_PHOTO_BYTES) return bad("A photo is too large after compression.");
  }

  const id = `${new Date().toISOString()}:${Math.random().toString(36).slice(2, 8)}`;
  const lead = {
    id,
    submittedAt: new Date().toISOString(),
    vin: vin || null,
    year,
    make: (body.make ?? "").trim(),
    model: (body.model ?? "").trim(),
    trim: (body.trim ?? "").trim() || null,
    mileage,
    condition,
    askingPrice: body.askingPrice ? Number(body.askingPrice) : null,
    notes: (body.notes ?? "").trim().slice(0, 2000) || null,
    name,
    phone,
    email,
    photoCount: photos.length,
    sourceIp: ip ?? null,
    userAgent: ctx.request.headers.get("User-Agent") ?? null,
    status: "new" as const,
  };

  // Review 2026-09-02 #2: these carried no expiry, so every request since the
  // form launched (2026-06-07) sat in KV forever, photos included. 180 days,
  // matching the finance-application store; the DMS can still delete earlier.
  await ctx.env.LEADS.put(`acq:${id}`, JSON.stringify(lead), { expirationTtl: ACQ_TTL_SECONDS });
  await Promise.all(
    photos.map((p, n) => ctx.env.LEADS.put(`acqphoto:${id}:${n}`, p, { expirationTtl: ACQ_TTL_SECONDS }))
  );

  // ── Tell the DMS now, rather than waiting to be noticed ─────────────────
  // Until 2026-09-04 nothing did. The only thing that ever announced a sell
  // request was a DMS sweep listing the acq: prefix on a timer, so the alert
  // was never faster than the poll -- and that poll is the most expensive item
  // in the Cloudflare KV budget. On 2026-09-03 the account exceeded the free
  // tier's 1,000 daily LIST operations, every list started returning 429, and
  // sell-your-car alerts stopped for the rest of the day without a sound.
  //
  // 🔴 BEST EFFORT, AND THAT ORDERING IS THE POINT. The request is already
  // safely in KV above. If the DMS is down, or slow, or the key is wrong, the
  // customer still gets their 201 and the hourly sweep still catches it. A
  // notification failure must never cost the lead it was announcing.
  ctx.waitUntil(
    (async () => {
      const key = ctx.env.NEXT_PUBLIC_DMS_INTAKE_KEY ?? "";
      if (!key) return;
      try {
        await fetch("https://dms.loveautogroup.net/api/v1/public/acquisition-leads/notify", {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-intake-key": key },
          body: JSON.stringify({
            // The KV key just written. It IS the dedupe identity shared with
            // the sweep, so it must be the key name, not the bare id.
            key: `acq:${id}`,
            name: lead.name,
            year: lead.year,
            make: lead.make,
            model: lead.model,
          }),
          signal: AbortSignal.timeout(5000),
        });
      } catch {
        /* The sweep is the backstop. Never surface this to the customer. */
      }
    })()
  );

  return new Response(JSON.stringify({ ok: true }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
