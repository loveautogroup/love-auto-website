/**
 * GET /api/store-hours
 *
 * Serves Love Auto Group's published showroom hours as data, so the
 * test-drive time picker can constrain itself to real open hours without
 * baking them into the client bundle.
 *
 * THIS IS NOT AN AVAILABILITY ENDPOINT (Jeremiah, 2026-08-03).
 * It returns the SAME hours already printed in the site header, footer and
 * the LocalBusiness JSON-LD. It performs NO calendar lookup, knows nothing
 * about what is booked, and its response is byte-identical for every caller
 * on a given day. Do not add free/busy data here - the customer picks a
 * time and Jeremiah calls to confirm.
 *
 * CONFIG PRECEDENCE (first hit wins):
 *   1. MERCHANDISING KV key "storeHours:v1"  <- change hours with NO deploy
 *   2. env.STORE_HOURS_JSON                   <- CF Pages plain var
 *   3. DEFAULT_HOURS below                    <- matches StructuredData.tsx
 *
 * If KV or the env var holds malformed JSON we fall through to the next
 * source rather than 500 - the picker must never be the reason a customer
 * cannot request a test drive.
 */

interface Env {
  MERCHANDISING?: KVNamespace;
  STORE_HOURS_JSON?: string;
}

/** "HH:MM" 24h. null = closed that day. Key = JS Date.getDay(), 0 = Sunday. */
export interface DayHours {
  open: string;
  close: string;
}

export interface StoreHoursConfig {
  timezone: string;
  /** Spacing between selectable start times, in minutes. */
  slotMinutes: number;
  /** Assumed appointment length - the last start time is close - duration. */
  durationMinutes: number;
  /** How far ahead a customer may request. */
  maxDaysAhead: number;
  days: Record<string, DayHours | null>;
}

/**
 * Source of truth mirror: src/components/StructuredData.tsx
 * openingHoursSpecification. Keep the two in step.
 */
const DEFAULT_HOURS: StoreHoursConfig = {
  timezone: "America/Chicago",
  slotMinutes: 30,
  durationMinutes: 60,
  maxDaysAhead: 60,
  days: {
    "0": null,                                 // Sunday - closed
    "1": { open: "14:00", close: "19:00" },    // Monday
    "2": { open: "11:00", close: "19:00" },    // Tuesday
    "3": { open: "11:00", close: "19:00" },    // Wednesday
    "4": { open: "11:00", close: "19:00" },    // Thursday
    "5": { open: "11:00", close: "19:00" },    // Friday
    "6": { open: "12:00", close: "19:00" },    // Saturday
  },
};

const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

/** Reject anything that is not a well-formed hours config. */
function validate(raw: unknown): StoreHoursConfig | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Partial<StoreHoursConfig>;
  if (!c.days || typeof c.days !== "object") return null;

  const days: Record<string, DayHours | null> = {};
  for (let d = 0; d <= 6; d++) {
    const v = (c.days as Record<string, unknown>)[String(d)];
    if (v === null || v === undefined) {
      days[String(d)] = null;
      continue;
    }
    const dh = v as Partial<DayHours>;
    if (
      typeof dh.open !== "string" ||
      typeof dh.close !== "string" ||
      !TIME_RE.test(dh.open) ||
      !TIME_RE.test(dh.close) ||
      dh.open >= dh.close
    ) {
      return null;
    }
    days[String(d)] = { open: dh.open, close: dh.close };
  }

  const num = (v: unknown, fallback: number, lo: number, hi: number): number =>
    typeof v === "number" && Number.isFinite(v) && v >= lo && v <= hi
      ? Math.floor(v)
      : fallback;

  return {
    timezone:
      typeof c.timezone === "string" && c.timezone
        ? c.timezone
        : DEFAULT_HOURS.timezone,
    slotMinutes: num(c.slotMinutes, DEFAULT_HOURS.slotMinutes, 5, 240),
    durationMinutes: num(
      c.durationMinutes,
      DEFAULT_HOURS.durationMinutes,
      15,
      480
    ),
    maxDaysAhead: num(c.maxDaysAhead, DEFAULT_HOURS.maxDaysAhead, 1, 365),
    days,
  };
}

function parse(text: string | null | undefined): StoreHoursConfig | null {
  if (!text) return null;
  try {
    return validate(JSON.parse(text));
  } catch {
    return null;
  }
}

export async function resolveStoreHours(env: Env): Promise<StoreHoursConfig> {
  if (env.MERCHANDISING) {
    try {
      const fromKv = parse(await env.MERCHANDISING.get("storeHours:v1"));
      if (fromKv) return fromKv;
    } catch {
      // KV unreachable - fall through, never fail the picker.
    }
  }
  return parse(env.STORE_HOURS_JSON) ?? DEFAULT_HOURS;
}

export const onRequestGet: PagesFunction<Env> = async (ctx) => {
  const hours = await resolveStoreHours(ctx.env);
  return new Response(JSON.stringify(hours), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      // Public, non-personal, identical for everyone. Safe to cache hard.
      "Cache-Control": "public, max-age=600, s-maxage=3600",
    },
  });
};
