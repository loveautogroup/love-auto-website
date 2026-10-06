/**
 * Admin /api/admin/obd-scan — the OBD scan helper for the recon team.
 *
 * Owner, 2026-10-06: "Something that reads pictures of obd scans and then
 * searches for resolution or fixes." Internal use only, real search summary.
 *
 * TWO STEPS, TWO REQUESTS. The tech photographs the scan tool screen, the
 * first call reads the codes off it, the tech corrects anything misread,
 * and only then does the second call spend money on web research. A misread
 * "P0401" researched as "P0461" would be worse than no answer, and the
 * research step is the expensive one (web searches are billed per search on
 * top of tokens), so the cheap step is confirmed before the dear one runs.
 *
 *   POST {action:"extract",  images:[{mediaType,data}]}
 *     -> {codes:[{code,description,status}], scannerNotes, vehicleHint}
 *
 *   POST {action:"research", vehicle:{year,make,model,trim,engine,mileage,vin},
 *                            codes:[{code,description,status}], notes}
 *     -> {summary (markdown), sources:[{title,url}], searches}
 *
 * Both run on Claude via the Messages API, the same raw-fetch shape as
 * scripts/audit-live-heroes.ts: the Pages Functions bundle carries no npm
 * dependencies and this keeps it that way. Extraction is a vision call with
 * a JSON schema on the output; research hands the model Anthropic's
 * server-side web search tool, so one request does the searching, reading
 * and summarising, and the citations come back with it.
 *
 * Required Pages env var (Production + Preview), set as a SECRET:
 *   ANTHROPIC_API_KEY   the same key docs/admin-runbook.md lists for the
 *                       photo classifier. Never reaches the browser: the
 *                       page calls this same-origin route, as
 *                       functions/api/chat.ts does for the DMS intake key.
 *
 * Auth: requireAdmin() from _lib/admin-auth (the __Secure-lag_admin session
 * cookie). Fails closed when the key is unset (503, never a silent empty
 * answer).
 */

import { requireAdmin, type AdminAuthEnv } from "../../_lib/admin-auth";

interface Env extends AdminAuthEnv {
  ANTHROPIC_API_KEY?: string;
}

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-opus-5-5";

/** Base64 image payload cap. Photos are downscaled in the browser before
 *  upload (see ObdScanHelper.tsx), so a real request is well under this. */
const MAX_BODY_BYTES = 6 * 1024 * 1024;
const MAX_IMAGES = 4;
const MAX_CODES = 12;
/** Web searches per research request. Each is billed; six covers a
 *  typical 1-3 code scan with room for a TSB / recall lookup. */
const MAX_SEARCHES = 6;
/** Server-side tool loops stop after 10 iterations with pause_turn; resume
 *  at most this many times before giving the tech what we have. */
const MAX_PAUSE_RESUMES = 2;

const ALLOWED_MEDIA = new Set(["image/jpeg", "image/png", "image/webp"]);
const CODE_RE = /^[PBCU][0-9A-F]{4}$/;

// ─── Types ────────────────────────────────────────────────────────────

type CodeStatus = "confirmed" | "pending" | "permanent" | "history" | "unknown";

interface DtcCode {
  code: string;
  description: string;
  status: CodeStatus;
  /** Control unit that set it (Engine, Brake/EPB, SRS Airbag...). */
  module: string;
}

interface VehicleInfo {
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
  engine?: string | null;
  mileage?: number | null;
  vin?: string | null;
}

interface AnthropicTextBlock {
  type: "text";
  text: string;
  citations?: Array<{ url?: string; title?: string }> | null;
}
interface AnthropicSearchResultBlock {
  type: "web_search_tool_result";
  content:
    | Array<{ type: string; url?: string; title?: string }>
    | { type: string; error_code?: string };
}
interface AnthropicOtherBlock {
  type: string;
}
type AnthropicBlock =
  | AnthropicTextBlock
  | AnthropicSearchResultBlock
  | AnthropicOtherBlock;

interface AnthropicMessage {
  content: AnthropicBlock[];
  stop_reason: string | null;
  stop_details?: { category?: string | null; explanation?: string | null } | null;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    server_tool_use?: { web_search_requests?: number };
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────

function json(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

function str(v: unknown, max = 200): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t ? t.slice(0, max) : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function normaliseStatus(v: unknown): CodeStatus {
  const s = typeof v === "string" ? v.toLowerCase() : "";
  if (s === "confirmed" || s === "pending" || s === "permanent" || s === "history") return s;
  return "unknown";
}

/** Keep only well-formed DTCs; the model is told the format but the tech
 *  can also type codes by hand, so the shape is checked here regardless.
 *  The same code may legitimately appear twice (current + history copies on
 *  a Toyota scan), so rows are de-duplicated on code + status, not code. */
function sanitiseCodes(raw: unknown): DtcCode[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: DtcCode[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as { code?: unknown; description?: unknown; status?: unknown; module?: unknown };
    const code = (str(o.code, 8) ?? "").toUpperCase().replace(/\s+/g, "");
    if (!CODE_RE.test(code)) continue;
    const status = normaliseStatus(o.status);
    const key = `${code}:${status}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({
      code,
      description: str(o.description, 160) ?? "",
      status,
      module: str(o.module, 60) ?? "",
    });
    if (out.length >= MAX_CODES) break;
  }
  return out;
}

class AnthropicError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function callAnthropic(
  apiKey: string,
  body: Record<string, unknown>,
  betas: string[] = []
): Promise<AnthropicMessage> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  };
  if (betas.length) headers["anthropic-beta"] = betas.join(",");
  const res = await fetch(ANTHROPIC_URL, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new AnthropicError(res.status, `Anthropic API ${res.status}: ${errText.slice(0, 300)}`);
  }
  return (await res.json()) as AnthropicMessage;
}

// ─── Step 1: read the codes off the photo(s) ──────────────────────────

const EXTRACT_SYSTEM = `You read photographs of OBD-II scan tool screens for a used-car dealership's reconditioning team. The photo is often taken at an angle under shop lighting with glare and scratches on the screen; read through that.

Transcribe exactly what the screen shows. Diagnostic trouble codes are one letter (P, B, C or U) followed by four hex characters, e.g. P0420, C1214, U0100, P1E00. Read each character carefully: 0 vs O vs D, 1 vs I, 8 vs B, 5 vs S. If a character is genuinely unreadable, omit that code rather than guess, and say so in scannerNotes.

Full-system scans list codes under the module (control unit) that set them: Engine, Hybrid Control, Brake/EPB, ABS, SRS Airbag, EMPS/Power Steering, TCM, Body, etc. Record that module name for each code. The same code can be listed twice under one module when the scanner shows a current and a history (stored) copy; keep both rows and give each its own status.

Status: current / confirmed / stored = "confirmed"; pending = "pending"; permanent = "permanent"; history / past / cleared = "history". Toyota-style scanners flag each row with a single letter at the right edge: C = current -> "confirmed", H = history -> "history", P = pending -> "pending". Otherwise "unknown".

scannerNotes: one to three sentences of anything else useful. Especially: modules the screen flags with a fault marker whose codes are collapsed or cut off (say which, so the tech expands and photographs them too), freeze frame data, readiness monitors, mileage, a "no codes" message, legibility problems.

vehicleHint: the make, model, generation/platform code, years and VIN if the screen shows them (e.g. "Toyota Prius MXWH60 12/2022-09/2024"), else an empty string.`;

const EXTRACT_SCHEMA = {
  type: "object",
  properties: {
    codes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          code: { type: "string" },
          description: { type: "string" },
          status: {
            type: "string",
            enum: ["confirmed", "pending", "permanent", "history", "unknown"],
          },
          module: { type: "string" },
        },
        required: ["code", "description", "status", "module"],
        additionalProperties: false,
      },
    },
    scannerNotes: { type: "string" },
    vehicleHint: { type: "string" },
  },
  required: ["codes", "scannerNotes", "vehicleHint"],
  additionalProperties: false,
};

async function handleExtract(apiKey: string, body: Record<string, unknown>): Promise<Response> {
  const rawImages = Array.isArray(body.images) ? body.images : [];
  if (rawImages.length === 0) return json({ error: "Attach at least one photo." }, 400);
  if (rawImages.length > MAX_IMAGES) {
    return json({ error: `At most ${MAX_IMAGES} photos per scan.` }, 400);
  }

  const imageBlocks: Array<Record<string, unknown>> = [];
  for (const img of rawImages) {
    const mediaType = str((img as { mediaType?: unknown })?.mediaType, 40);
    const data = typeof (img as { data?: unknown })?.data === "string" ? (img as { data: string }).data : "";
    if (!mediaType || !ALLOWED_MEDIA.has(mediaType) || !data) {
      return json({ error: "Photos must be JPEG, PNG or WebP." }, 400);
    }
    imageBlocks.push({
      type: "image",
      source: { type: "base64", media_type: mediaType, data },
    });
  }

  const message = await callAnthropic(apiKey, {
    model: MODEL,
    max_tokens: 4000,
    system: EXTRACT_SYSTEM,
    output_config: {
      effort: "medium",
      format: { type: "json_schema", schema: EXTRACT_SCHEMA },
    },
    messages: [
      {
        role: "user",
        content: [
          ...imageBlocks,
          {
            type: "text",
            text: `${imageBlocks.length} photo(s) of the scan tool screen. Transcribe the codes.`,
          },
        ],
      },
    ],
  });

  if (message.stop_reason === "refusal") {
    return json({ error: "The model declined to read this image. Try a clearer photo." }, 502);
  }
  const text = message.content
    .filter((b): b is AnthropicTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  let parsed: { codes?: unknown; scannerNotes?: unknown; vehicleHint?: unknown };
  try {
    parsed = JSON.parse(text);
  } catch {
    return json({ error: "Could not parse the reading. Try again." }, 502);
  }

  return json({
    codes: sanitiseCodes(parsed.codes),
    scannerNotes: str(parsed.scannerNotes, 600) ?? "",
    vehicleHint: str(parsed.vehicleHint, 120),
  });
}

// ─── Step 2: research the fixes ───────────────────────────────────────

const RESEARCH_SYSTEM = `You are the diagnostic research assistant for a used-car dealership's reconditioning shop in Illinois. A technician gives you a vehicle and the trouble codes pulled from it. Research the codes AS THEY APPLY TO THIS SPECIFIC VEHICLE and write a practical brief the tech can act on today.

Use web search. Prefer, in this order: manufacturer technical service bulletins (TSBs) and recalls (NHTSA), OEM-specific repair references, established repair guides (e.g. OBD-Codes, RepairPal, AutoCodes, ALLDATA/Identifix-style write-ups), and make-specific owner/tech forums where a fix was confirmed. Search per code with the make, model and engine in the query. Skip generic definitions when a vehicle-specific pattern exists; a known-weak part on this platform matters more than the textbook meaning.

Write in Markdown using only headings (##, ###), short paragraphs, bullet lists, bold, and inline links. No tables, no images, no code blocks.

Structure:
## Summary
Two or three sentences: what is most likely going on and how serious it is (drive it / fix before sale / safety issue).

### <CODE> — <short meaning>
(one section per code, most important first)
- **Most likely causes on this vehicle**, ranked, with why.
- **Check first**: the quickest diagnostic steps in order.
- **Typical fix and rough cost**: parts and labor range in USD, say "estimate".
- **TSB / recall**: cite the bulletin or campaign if one exists for this vehicle, else say none found.

## Recommendation
What to do first, and whether the codes are related (one root cause) or separate.

Cite sources inline as links next to the claims they support. Be specific and concise; aim for under 700 words. If a code is not a standard DTC or you cannot find reliable information, say so plainly instead of inventing a cause.`;

function vehicleLabel(v: VehicleInfo): string {
  const main = [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ").trim();
  const extra: string[] = [];
  if (v.engine) extra.push(`engine ${v.engine}`);
  if (v.mileage) extra.push(`${v.mileage.toLocaleString("en-US")} miles`);
  if (v.vin) extra.push(`VIN ${v.vin}`);
  return [main || "Unknown vehicle", ...extra].join(", ");
}

function collectSources(blocks: AnthropicBlock[]): Array<{ title: string; url: string }> {
  const byUrl = new Map<string, string>();
  const add = (url?: string, title?: string) => {
    if (!url || !/^https?:\/\//.test(url)) return;
    if (!byUrl.has(url) || (!byUrl.get(url) && title)) byUrl.set(url, title ?? "");
  };
  for (const b of blocks) {
    if (b.type === "text") {
      for (const c of (b as AnthropicTextBlock).citations ?? []) add(c.url, c.title);
    } else if (b.type === "web_search_tool_result") {
      const content = (b as AnthropicSearchResultBlock).content;
      // Success is a list; an error is a single object (e.g. max_uses_exceeded).
      if (Array.isArray(content)) {
        for (const r of content) if (r.type === "web_search_result") add(r.url, r.title);
      }
    }
  }
  return [...byUrl.entries()].map(([url, title]) => ({ title: title || url, url }));
}

async function handleResearch(apiKey: string, body: Record<string, unknown>): Promise<Response> {
  const codes = sanitiseCodes(body.codes);
  if (codes.length === 0) {
    return json({ error: "Add at least one valid code (like P0420) before researching." }, 400);
  }
  const rawVehicle = (body.vehicle && typeof body.vehicle === "object" ? body.vehicle : {}) as Record<
    string,
    unknown
  >;
  const vehicle: VehicleInfo = {
    year: num(rawVehicle.year),
    make: str(rawVehicle.make, 40),
    model: str(rawVehicle.model, 60),
    trim: str(rawVehicle.trim, 60),
    engine: str(rawVehicle.engine, 60),
    mileage: num(rawVehicle.mileage),
    vin: str(rawVehicle.vin, 17),
  };
  const notes = str(body.notes, 1000);

  // One line per code. A current + history pair of the same code (common on
  // Toyota full-system scans) is one fault, so it becomes one line that
  // says it recurred rather than two lines the model might treat separately.
  const byCode = new Map<string, DtcCode[]>();
  for (const c of codes) byCode.set(c.code, [...(byCode.get(c.code) ?? []), c]);
  const codeLines = [...byCode.entries()]
    .map(([code, rows]) => {
      const first = rows[0];
      const statuses = [...new Set(rows.map((r) => r.status).filter((st) => st !== "unknown"))];
      const parts = [`- ${code}`];
      if (first.module) parts.push(`[${first.module} module]`);
      if (first.description) parts.push(`— scanner says "${first.description}"`);
      if (statuses.length) parts.push(`(${statuses.join(" + ")})`);
      return parts.join(" ");
    })
    .join("\n");

  const prompt = `Vehicle: ${vehicleLabel(vehicle)}

Trouble codes from the scan:
${codeLines}
${notes ? `\nTech's notes / symptoms: ${notes}\n` : ""}
Research these for this vehicle and write the brief.`;

  const messages: Array<Record<string, unknown>> = [{ role: "user", content: prompt }];
  const request = {
    model: MODEL,
    max_tokens: 8000,
    system: RESEARCH_SYSTEM,
    output_config: { effort: "medium" },
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: MAX_SEARCHES }],
    messages,
  };

  // The fallback parameter is a beta. If the API ever rejects it (a 400
  // naming the parameter or header), run the same request without it
  // rather than leaving the tech with nothing: a declined request is far
  // rarer than a beta being retired.
  let betas = ["server-side-fallback-2026-07-01"];
  const send = async (): Promise<AnthropicMessage> => {
    try {
      return await callAnthropic(apiKey, { ...request, fallbacks: betas.length ? "default" : undefined }, betas);
    } catch (err) {
      if (err instanceof AnthropicError && err.status === 400 && betas.length) {
        betas = [];
        return callAnthropic(apiKey, { ...request, fallbacks: undefined }, betas);
      }
      throw err;
    }
  };

  const allBlocks: AnthropicBlock[] = [];
  let searches = 0;
  let message = await send();
  let resumes = 0;
  for (;;) {
    allBlocks.push(...message.content);
    searches += message.usage?.server_tool_use?.web_search_requests ?? 0;
    if (message.stop_reason !== "pause_turn" || resumes >= MAX_PAUSE_RESUMES) break;
    // Resume where the server-side search loop paused: echo the assistant
    // turn back with no new user message.
    resumes += 1;
    messages.push({ role: "assistant", content: message.content });
    message = await send();
  }

  if (message.stop_reason === "refusal") {
    return json(
      {
        error: `Research was declined${
          message.stop_details?.category ? ` (${message.stop_details.category})` : ""
        }. Try rephrasing the notes.`,
      },
      502
    );
  }

  const summary = allBlocks
    .filter((b): b is AnthropicTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  if (!summary) return json({ error: "The research came back empty. Try again." }, 502);

  return json({
    summary,
    sources: collectSources(allBlocks),
    searches,
    truncated: message.stop_reason === "max_tokens" || message.stop_reason === "pause_turn",
  });
}

// ─── Route ────────────────────────────────────────────────────────────

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

  const apiKey = env.ANTHROPIC_API_KEY ?? "";
  if (!apiKey) {
    return json(
      { error: "ANTHROPIC_API_KEY is not set on this Pages project. See docs/admin-runbook.md." },
      503
    );
  }

  const length = Number(request.headers.get("content-length") ?? "0");
  if (length > MAX_BODY_BYTES) return json({ error: "Photos too large. Try fewer or smaller." }, 413);

  let body: Record<string, unknown>;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) return json({ error: "Photos too large." }, 413);
    body = JSON.parse(text);
    if (!body || typeof body !== "object") throw new Error("not an object");
  } catch {
    return json({ error: "Invalid request body." }, 400);
  }

  try {
    if (body.action === "extract") return await handleExtract(apiKey, body);
    if (body.action === "research") return await handleResearch(apiKey, body);
    return json({ error: 'action must be "extract" or "research".' }, 400);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return json({ error: `Upstream failure: ${msg}` }, 502);
  }
};
