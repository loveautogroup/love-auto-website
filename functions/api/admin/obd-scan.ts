/**
 * Admin /api/admin/obd-scan — the OBD scan helper for the recon team.
 *
 * Owner, 2026-10-06: "Something that reads pictures of obd scans and then
 * searches for resolution or fixes." Internal use only, real search summary.
 * Then: "Can we combine to use both [Claude and Gemini] rather than a
 * switch?" So both run at every step and cross-check each other.
 *
 * TWO STEPS, TWO REQUESTS. The tech photographs the scan tool screen, the
 * first call reads the codes off it, the tech corrects anything misread,
 * and only then does the second call spend money on web research. A misread
 * "P0401" researched as "P0461" would be worse than no answer, and the
 * research step is the expensive one (web searches are billed per search on
 * top of tokens), so the cheap step is confirmed before the dear one runs.
 *
 *   POST {action:"extract",  images:[{mediaType,data}]}
 *     -> {codes:[{code,description,status,module,readers}], scannerNotes,
 *         vehicleHint, providers:[{provider,state,detail}]}
 *
 *   POST {action:"research", vehicle:{year,make,model,trim,engine,mileage,vin},
 *                            codes:[{code,description,status,module}], notes}
 *     -> {summary (markdown), combined, briefs:[{provider,summary,sources,
 *         searches}], sources:[{title,url,providers}], searches, providers}
 *
 * TWO PROVIDERS, BOTH EVERY TIME. Claude (Anthropic Messages API, with its
 * server-side web search) and Gemini (Google generateContent, with Grounding
 * with Google Search). Both read the photo and the code lists are merged:
 * a code both saw is marked so, a code only one saw is flagged for the tech
 * to check against the screen. Both research the codes; the two briefs are
 * then folded into one by Claude, which keeps every claim's link and says
 * where the two disagree. Either provider failing or being unconfigured
 * degrades to the other with the reason reported, never to an empty answer.
 *
 * Raw fetch to both APIs, the same shape as scripts/audit-live-heroes.ts:
 * the Pages Functions bundle carries no npm dependencies and this keeps it
 * that way.
 *
 * Required Pages env vars (Production + Preview), set as SECRETS:
 *   ANTHROPIC_API_KEY   the same key docs/admin-runbook.md lists for the
 *                       photo classifier.
 *   GEMINI_API_KEY      from Google AI Studio. NOT the GOOGLE_CLOUD_API_KEY
 *                       the classifier can use; that is Cloud Vision.
 * Optional:
 *   GEMINI_MODEL        defaults to gemini-3.5-flash.
 * Neither key reaches the browser: the page calls this same-origin route,
 * as functions/api/chat.ts does for the DMS intake key.
 *
 * Auth: requireAdmin() from _lib/admin-auth (the __Secure-lag_admin session
 * cookie). Fails closed when no key is set (503, never a silent empty
 * answer).
 */

import { requireAdmin, type AdminAuthEnv } from "../../_lib/admin-auth";

interface Env extends AdminAuthEnv {
  ANTHROPIC_API_KEY?: string;
  GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
}

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-opus-5-5";
const GEMINI_URL_BASE = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_DEFAULT_MODEL = "gemini-3.5-flash";

/** Base64 image payload cap. Photos are downscaled in the browser before
 *  upload (see ObdScanHelper.tsx), so a real request is well under this. */
const MAX_BODY_BYTES = 6 * 1024 * 1024;
const MAX_IMAGES = 4;
const MAX_CODES = 12;
/** Claude web searches per research request. Each is billed; six covers a
 *  typical 1-3 code scan with room for a TSB / recall lookup. Gemini's
 *  grounding decides its own search count. */
const MAX_SEARCHES = 6;
/** Server-side tool loops stop after 10 iterations with pause_turn; resume
 *  at most this many times before giving the tech what we have. */
const MAX_PAUSE_RESUMES = 2;

const ALLOWED_MEDIA = new Set(["image/jpeg", "image/png", "image/webp"]);
const CODE_RE = /^[PBCU][0-9A-F]{4}$/;

// ─── Types ────────────────────────────────────────────────────────────

type Provider = "claude" | "gemini";

interface ProviderStatus {
  provider: Provider;
  state: "ok" | "skipped" | "error";
  detail?: string;
}

type CodeStatus = "confirmed" | "pending" | "permanent" | "history" | "unknown";

interface DtcCode {
  code: string;
  description: string;
  status: CodeStatus;
  /** Control unit that set it (Engine, Brake/EPB, SRS Airbag...). */
  module: string;
}

interface ReadCode extends DtcCode {
  /** Which readers saw this exact code + status on the photo. */
  readers: Provider[];
}

interface ExtractResult {
  codes: DtcCode[];
  scannerNotes: string;
  vehicleHint: string;
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

interface Source {
  title: string;
  url: string;
}

interface Brief {
  provider: Provider;
  summary: string;
  sources: Source[];
  searches: number;
  truncated: boolean;
}

interface ImageInput {
  mediaType: string;
  data: string;
}

// Anthropic response shapes (the subset read here)
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
type AnthropicBlock = AnthropicTextBlock | AnthropicSearchResultBlock | AnthropicOtherBlock;

interface AnthropicMessage {
  content: AnthropicBlock[];
  stop_reason: string | null;
  stop_details?: { category?: string | null; explanation?: string | null } | null;
  usage?: { server_tool_use?: { web_search_requests?: number } };
}

// Gemini response shapes (the subset read here)
interface GeminiResponse {
  candidates?: Array<{
    content?: { parts?: Array<{ text?: string }> };
    finishReason?: string;
    groundingMetadata?: {
      groundingChunks?: Array<{ web?: { uri?: string; title?: string } }>;
      webSearchQueries?: string[];
    };
  }>;
  promptFeedback?: { blockReason?: string };
}

class ProviderError extends Error {
  provider: Provider;
  status: number;
  constructor(provider: Provider, status: number, message: string) {
    super(message);
    this.provider = provider;
    this.status = status;
  }
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

function errorText(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

function normaliseStatus(v: unknown): CodeStatus {
  const s = typeof v === "string" ? v.toLowerCase() : "";
  if (s === "confirmed" || s === "pending" || s === "permanent" || s === "history") return s;
  return "unknown";
}

/** Keep only well-formed DTCs; the models are told the format but the tech
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
  const res = await fetch(ANTHROPIC_URL, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new ProviderError("claude", res.status, `Anthropic API ${res.status}: ${errText.slice(0, 300)}`);
  }
  return (await res.json()) as AnthropicMessage;
}

async function callGemini(
  apiKey: string,
  model: string,
  body: Record<string, unknown>
): Promise<GeminiResponse> {
  const res = await fetch(`${GEMINI_URL_BASE}/${encodeURIComponent(model)}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new ProviderError("gemini", res.status, `Gemini API ${res.status}: ${errText.slice(0, 300)}`);
  }
  return (await res.json()) as GeminiResponse;
}

function geminiText(r: GeminiResponse): string {
  if (r.promptFeedback?.blockReason) {
    throw new ProviderError("gemini", 200, `Gemini blocked the request (${r.promptFeedback.blockReason}).`);
  }
  const cand = r.candidates?.[0];
  const text = (cand?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) {
    throw new ProviderError("gemini", 200, `Gemini returned no text (${cand?.finishReason ?? "no candidate"}).`);
  }
  return text;
}

/** Gemini's responseSchema is an OpenAPI subset that rejects
 *  additionalProperties; strip it from the shared JSON schema. */
function toGeminiSchema(schema: unknown): unknown {
  if (Array.isArray(schema)) return schema.map(toGeminiSchema);
  if (schema && typeof schema === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(schema as Record<string, unknown>)) {
      if (k === "additionalProperties") continue;
      out[k] = toGeminiSchema(v);
    }
    return out;
  }
  return schema;
}

// ─── Step 1: read the codes off the photo(s) ──────────────────────────

const EXTRACT_SYSTEM = `You read photographs of OBD-II scan tool screens for a used-car dealership's reconditioning team. The photo is often taken at an angle under shop lighting with glare and scratches on the screen; read through that.

Transcribe exactly what the screen shows. Diagnostic trouble codes are one letter (P, B, C or U) followed by four hex characters, e.g. P0420, C1214, U0100, P1E00. Read each character carefully: 0 vs O vs D, 1 vs I, 8 vs B, 5 vs S. If a character is genuinely unreadable, omit that code rather than guess, and say so in scannerNotes.

Full-system scans list codes under the module (control unit) that set them: Engine, Hybrid Control, Brake/EPB, ABS, SRS Airbag, EMPS/Power Steering, TCM, Body, etc. Record that module name for each code. The same code can be listed twice under one module when the scanner shows a current and a history (stored) copy; keep both rows and give each its own status.

Status: current / confirmed / stored = "confirmed"; pending = "pending"; permanent = "permanent"; history / past / cleared = "history". Toyota-style scanners flag each row with a single letter at the right edge: C = current -> "confirmed", H = history -> "history", P = pending -> "pending". Otherwise "unknown".

scannerNotes: one to three sentences of anything else useful. Especially: modules the screen flags with a fault marker whose codes are collapsed or cut off (say which, so the tech expands and photographs them too), freeze frame data, readiness monitors, mileage, a "no codes" message, legibility problems.

vehicleHint: the make, model, generation/platform code, years and VIN if the screen shows them (e.g. "Toyota Prius MXWH60 12/2022-09/2024"), else an empty string.

Respond with JSON only: {"codes":[{"code","description","status","module"}],"scannerNotes","vehicleHint"}.`;

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

function parseExtract(text: string, provider: Provider): ExtractResult {
  let parsed: { codes?: unknown; scannerNotes?: unknown; vehicleHint?: unknown };
  try {
    // Gemini occasionally wraps JSON in a ```json fence even with a schema.
    parsed = JSON.parse(text.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, ""));
  } catch {
    throw new ProviderError(provider, 200, "The reading could not be parsed.");
  }
  return {
    codes: sanitiseCodes(parsed.codes),
    scannerNotes: str(parsed.scannerNotes, 600) ?? "",
    vehicleHint: str(parsed.vehicleHint, 120) ?? "",
  };
}

async function extractWithClaude(apiKey: string, images: ImageInput[]): Promise<ExtractResult> {
  const message = await callAnthropic(apiKey, {
    model: CLAUDE_MODEL,
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
          ...images.map((img) => ({
            type: "image",
            source: { type: "base64", media_type: img.mediaType, data: img.data },
          })),
          {
            type: "text",
            text: `${images.length} photo(s) of the scan tool screen. Transcribe the codes.`,
          },
        ],
      },
    ],
  });
  if (message.stop_reason === "refusal") {
    throw new ProviderError("claude", 200, "Claude declined to read this image.");
  }
  const text = message.content
    .filter((b): b is AnthropicTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return parseExtract(text, "claude");
}

async function extractWithGemini(apiKey: string, model: string, images: ImageInput[]): Promise<ExtractResult> {
  const r = await callGemini(apiKey, model, {
    systemInstruction: { parts: [{ text: EXTRACT_SYSTEM }] },
    contents: [
      {
        role: "user",
        parts: [
          ...images.map((img) => ({ inlineData: { mimeType: img.mediaType, data: img.data } })),
          { text: `${images.length} photo(s) of the scan tool screen. Transcribe the codes.` },
        ],
      },
    ],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: toGeminiSchema(EXTRACT_SCHEMA),
    },
  });
  return parseExtract(geminiText(r), "gemini");
}

/** Union of both readings keyed on code + status. A row both saw is
 *  trustworthy; a row one saw is kept and flagged for the tech. */
function mergeReadings(results: Array<{ provider: Provider; result: ExtractResult }>): {
  codes: ReadCode[];
  scannerNotes: string;
  vehicleHint: string;
} {
  const byKey = new Map<string, ReadCode>();
  for (const { provider, result } of results) {
    for (const c of result.codes) {
      const key = `${c.code}:${c.status}`;
      const existing = byKey.get(key);
      if (existing) {
        if (!existing.readers.includes(provider)) existing.readers.push(provider);
        if (c.description.length > existing.description.length) existing.description = c.description;
        if (!existing.module && c.module) existing.module = c.module;
      } else {
        byKey.set(key, { ...c, readers: [provider] });
      }
    }
  }
  // Codes both readers agree on first, then the rest in reading order.
  const codes = [...byKey.values()].sort((a, b) => b.readers.length - a.readers.length).slice(0, MAX_CODES);

  const notes = results
    .map(({ provider, result }) => ({ provider, note: result.scannerNotes }))
    .filter((n) => n.note);
  const scannerNotes =
    notes.length <= 1
      ? (notes[0]?.note ?? "")
      : notes.map((n) => `${n.provider === "claude" ? "Claude" : "Gemini"}: ${n.note}`).join("\n");

  const vehicleHint = results.map((r) => r.result.vehicleHint).find(Boolean) ?? "";
  return { codes, scannerNotes, vehicleHint };
}

async function handleExtract(env: Env, body: Record<string, unknown>): Promise<Response> {
  const rawImages = Array.isArray(body.images) ? body.images : [];
  if (rawImages.length === 0) return json({ error: "Attach at least one photo." }, 400);
  if (rawImages.length > MAX_IMAGES) {
    return json({ error: `At most ${MAX_IMAGES} photos per scan.` }, 400);
  }
  const images: ImageInput[] = [];
  for (const img of rawImages) {
    const mediaType = str((img as { mediaType?: unknown })?.mediaType, 40);
    const data = typeof (img as { data?: unknown })?.data === "string" ? (img as { data: string }).data : "";
    if (!mediaType || !ALLOWED_MEDIA.has(mediaType) || !data) {
      return json({ error: "Photos must be JPEG, PNG or WebP." }, 400);
    }
    images.push({ mediaType, data });
  }

  const { settled, providers } = await runBoth(env, {
    claude: (key) => extractWithClaude(key, images),
    gemini: (key, model) => extractWithGemini(key, model, images),
  });
  if (settled.length === 0) return failedResponse(providers);

  const merged = mergeReadings(settled);
  return json({ ...merged, providers });
}

// ─── Step 2: research the fixes ───────────────────────────────────────

const RESEARCH_SYSTEM = `You are the diagnostic research assistant for a used-car dealership's reconditioning shop in Illinois. A technician gives you a vehicle and the trouble codes pulled from it. Research the codes AS THEY APPLY TO THIS SPECIFIC VEHICLE and write a practical brief the tech can act on today.

Use web search. Prefer, in this order: manufacturer technical service bulletins (TSBs) and recalls (NHTSA), OEM-specific repair references, established repair guides (e.g. OBD-Codes, RepairPal, AutoCodes, ALLDATA/Identifix-style write-ups), and make-specific owner/tech forums where a fix was confirmed. Search per code with the make, model and engine in the query. Skip generic definitions when a vehicle-specific pattern exists; a known-weak part on this platform matters more than the textbook meaning. A code that set in a specific module (brake, airbag, steering) means that module's fault, not the generic powertrain reading.

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

const MERGE_SYSTEM = `You combine two independently researched diagnostic briefs about the same vehicle and trouble codes into one brief for a used-car dealership's reconditioning tech. Brief A was researched by Claude with web search; Brief B was researched by Gemini with Google Search. Neither is authoritative.

Write ONE brief in this structure, Markdown only (##/### headings, short paragraphs, bullets, bold, inline links; no tables, no code blocks):
## Summary
### <CODE> — <short meaning>   (one per code; bullets: most likely causes on this vehicle, check first, typical fix and rough cost, TSB / recall)
## Recommendation
## Where the two sources differ   (omit this section if they agree on everything that matters)

Rules:
- Where both briefs agree, state it once and say "both sources agree" where it helps the tech trust it.
- Where they differ on a cause, cost, part or bulletin, keep both positions, label which came from Claude and which from Google, and keep each one's link so the tech can check.
- Keep every inline link that supports a claim, exactly as written. Never invent a link, bulletin number or price that is not in one of the briefs.
- Drop generic filler. Under 800 words.`;

function vehicleLabel(v: VehicleInfo): string {
  const main = [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ").trim();
  const extra: string[] = [];
  if (v.engine) extra.push(`engine ${v.engine}`);
  if (v.mileage) extra.push(`${v.mileage.toLocaleString("en-US")} miles`);
  if (v.vin) extra.push(`VIN ${v.vin}`);
  return [main || "Unknown vehicle", ...extra].join(", ");
}

function addSource(map: Map<string, string>, url?: string, title?: string) {
  if (!url || !/^https?:\/\//.test(url)) return;
  if (!map.has(url) || (!map.get(url) && title)) map.set(url, title ?? "");
}

function sourcesFromMap(map: Map<string, string>): Source[] {
  return [...map.entries()].map(([url, title]) => ({ title: title || url, url }));
}

function claudeSources(blocks: AnthropicBlock[]): Source[] {
  const byUrl = new Map<string, string>();
  for (const b of blocks) {
    if (b.type === "text") {
      for (const c of (b as AnthropicTextBlock).citations ?? []) addSource(byUrl, c.url, c.title);
    } else if (b.type === "web_search_tool_result") {
      const content = (b as AnthropicSearchResultBlock).content;
      // Success is a list; an error is a single object (e.g. max_uses_exceeded).
      if (Array.isArray(content)) {
        for (const r of content) if (r.type === "web_search_result") addSource(byUrl, r.url, r.title);
      }
    }
  }
  return sourcesFromMap(byUrl);
}

async function researchWithClaude(apiKey: string, prompt: string): Promise<Brief> {
  const messages: Array<Record<string, unknown>> = [{ role: "user", content: prompt }];
  const request = {
    model: CLAUDE_MODEL,
    max_tokens: 8000,
    system: RESEARCH_SYSTEM,
    output_config: { effort: "medium" },
    tools: [{ type: "web_search_20260209", name: "web_search", max_uses: MAX_SEARCHES }],
    messages,
  };

  // Safety-classifier declines re-run server-side on Anthropic's recommended
  // fallback model instead of returning an empty brief. The parameter is a
  // beta: if the API ever rejects it (a 400 naming the parameter or header),
  // run the same request without it rather than leaving the tech with
  // nothing. A declined request is far rarer than a beta being retired.
  let betas = ["server-side-fallback-2026-07-01"];
  const send = async (): Promise<AnthropicMessage> => {
    try {
      return await callAnthropic(apiKey, { ...request, fallbacks: betas.length ? "default" : undefined }, betas);
    } catch (err) {
      if (err instanceof ProviderError && err.status === 400 && betas.length) {
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
    const cat = message.stop_details?.category;
    throw new ProviderError("claude", 200, `Claude declined the research${cat ? ` (${cat})` : ""}.`);
  }
  const summary = allBlocks
    .filter((b): b is AnthropicTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  if (!summary) throw new ProviderError("claude", 200, "Claude's research came back empty.");
  return {
    provider: "claude",
    summary,
    sources: claudeSources(allBlocks),
    searches,
    truncated: message.stop_reason === "max_tokens" || message.stop_reason === "pause_turn",
  };
}

async function researchWithGemini(apiKey: string, model: string, prompt: string): Promise<Brief> {
  const r = await callGemini(apiKey, model, {
    systemInstruction: { parts: [{ text: RESEARCH_SYSTEM }] },
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    tools: [{ google_search: {} }],
  });
  const summary = geminiText(r);
  const cand = r.candidates?.[0];
  const byUrl = new Map<string, string>();
  for (const chunk of cand?.groundingMetadata?.groundingChunks ?? []) {
    addSource(byUrl, chunk.web?.uri, chunk.web?.title);
  }
  return {
    provider: "gemini",
    summary,
    sources: sourcesFromMap(byUrl),
    searches: cand?.groundingMetadata?.webSearchQueries?.length ?? 0,
    truncated: cand?.finishReason === "MAX_TOKENS",
  };
}

async function mergeBriefs(apiKey: string, header: string, briefs: Brief[]): Promise<string> {
  const a = briefs.find((b) => b.provider === "claude");
  const g = briefs.find((b) => b.provider === "gemini");
  if (!a || !g) throw new Error("merge needs both briefs");
  const geminiSources = g.sources.map((s) => `- ${s.title}: ${s.url}`).join("\n");
  const message = await callAnthropic(apiKey, {
    model: CLAUDE_MODEL,
    max_tokens: 8000,
    system: MERGE_SYSTEM,
    output_config: { effort: "low" },
    messages: [
      {
        role: "user",
        content: `${header}

--- BRIEF A (Claude, web search) ---
${a.summary}

--- BRIEF B (Gemini, Google Search) ---
${g.summary}
${geminiSources ? `\nGoogle Search sources used by Brief B:\n${geminiSources}\n` : ""}
Combine them into one brief.`,
      },
    ],
  });
  if (message.stop_reason === "refusal") throw new Error("merge declined");
  const text = message.content
    .filter((b): b is AnthropicTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("")
    .trim();
  if (!text) throw new Error("merge came back empty");
  return text;
}

async function handleResearch(env: Env, body: Record<string, unknown>): Promise<Response> {
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

  const header = `Vehicle: ${vehicleLabel(vehicle)}

Trouble codes from the scan:
${codeLines}
${notes ? `\nTech's notes / symptoms: ${notes}\n` : ""}`;
  const prompt = `${header}
Research these for this vehicle and write the brief.`;

  const { settled, providers } = await runBoth(env, {
    claude: (key) => researchWithClaude(key, prompt),
    gemini: (key, model) => researchWithGemini(key, model, prompt),
  });
  if (settled.length === 0) return failedResponse(providers);

  const briefs = settled.map((s) => s.result);
  let summary = briefs[0].summary;
  let combined = false;
  if (briefs.length === 2 && env.ANTHROPIC_API_KEY) {
    try {
      summary = await mergeBriefs(env.ANTHROPIC_API_KEY, header, briefs);
      combined = true;
    } catch (err) {
      // Both briefs still go back; the page shows them side by side.
      providers.push({ provider: "claude", state: "error", detail: `Combining failed: ${errorText(err)}` });
    }
  }

  // Merged source list, tagged with who used each one.
  const merged = new Map<string, { title: string; providers: Provider[] }>();
  for (const b of briefs) {
    for (const s of b.sources) {
      const existing = merged.get(s.url);
      if (existing) {
        if (!existing.providers.includes(b.provider)) existing.providers.push(b.provider);
        if (!existing.title || existing.title === s.url) existing.title = s.title;
      } else {
        merged.set(s.url, { title: s.title, providers: [b.provider] });
      }
    }
  }

  return json({
    summary,
    combined,
    briefs,
    sources: [...merged.entries()].map(([url, v]) => ({ url, title: v.title, providers: v.providers })),
    searches: briefs.reduce((n, b) => n + b.searches, 0),
    truncated: briefs.some((b) => b.truncated),
    providers,
  });
}

// ─── Running both providers ───────────────────────────────────────────

/** Run whichever providers are configured, in parallel. Returns what
 *  succeeded plus a status line per provider so the page can say exactly
 *  what happened; a missing key or a failed call never hides the other. */
async function runBoth<T>(
  env: Env,
  jobs: {
    claude: (apiKey: string) => Promise<T>;
    gemini: (apiKey: string, model: string) => Promise<T>;
  }
): Promise<{ settled: Array<{ provider: Provider; result: T }>; providers: ProviderStatus[] }> {
  const tasks: Array<{ provider: Provider; run: () => Promise<T> }> = [];
  const providers: ProviderStatus[] = [];

  const claudeKey = env.ANTHROPIC_API_KEY;
  if (claudeKey) tasks.push({ provider: "claude", run: () => jobs.claude(claudeKey) });
  else providers.push({ provider: "claude", state: "skipped", detail: "ANTHROPIC_API_KEY not set" });

  const geminiKey = env.GEMINI_API_KEY;
  if (geminiKey) {
    const model = env.GEMINI_MODEL?.trim() || GEMINI_DEFAULT_MODEL;
    tasks.push({ provider: "gemini", run: () => jobs.gemini(geminiKey, model) });
  } else providers.push({ provider: "gemini", state: "skipped", detail: "GEMINI_API_KEY not set" });

  const outcomes = await Promise.allSettled(tasks.map((t) => t.run()));
  const settled: Array<{ provider: Provider; result: T }> = [];
  outcomes.forEach((o, i) => {
    const provider = tasks[i].provider;
    if (o.status === "fulfilled") {
      settled.push({ provider, result: o.value });
      providers.push({ provider, state: "ok" });
    } else {
      providers.push({ provider, state: "error", detail: errorText(o.reason) });
    }
  });
  // Stable order for the page: claude, gemini.
  providers.sort((a, b) => a.provider.localeCompare(b.provider));
  return { settled, providers };
}

function failedResponse(providers: ProviderStatus[]): Response {
  const anyConfigured = providers.some((p) => p.state !== "skipped");
  if (!anyConfigured) {
    return json(
      {
        error:
          "No AI key is set on this Pages project (ANTHROPIC_API_KEY and/or GEMINI_API_KEY). See docs/admin-runbook.md.",
        providers,
      },
      503
    );
  }
  const details = providers
    .filter((p) => p.state === "error")
    .map((p) => `${p.provider}: ${p.detail}`)
    .join("; ");
  return json({ error: `Every configured provider failed. ${details}`, providers }, 502);
}

// ─── Route ────────────────────────────────────────────────────────────

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  const denied = await requireAdmin(request, env);
  if (denied) return denied;

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
    if (body.action === "extract") return await handleExtract(env, body);
    if (body.action === "research") return await handleResearch(env, body);
    return json({ error: 'action must be "extract" or "research".' }, 400);
  } catch (err) {
    return json({ error: `Upstream failure: ${errorText(err)}` }, 502);
  }
};
