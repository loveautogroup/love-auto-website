"use client";

/**
 * Admin -> OBD Scan Helper.
 *
 * Three panels, top to bottom, in the order the tech works:
 *
 *   1. Vehicle   — pick a unit from the build-time inventory snapshot (year,
 *                  make, model, trim, engine, miles come along for free) or
 *                  type one in for a car that is not on the lot.
 *   2. Codes     — photograph the scan tool screen; /api/admin/obd-scan
 *                  reads the codes off it into an EDITABLE list. The tech
 *                  can also skip the photo and type codes straight in.
 *   3. Research  — one click sends vehicle + confirmed codes to the same
 *                  endpoint, which web-searches and writes the brief.
 *
 * WHY THE CODES ARE CONFIRMED BEFORE RESEARCH. Reading a photo is cheap;
 * the research call is the one that pays for web searches. A misread code
 * researched is worse than no answer. See functions/api/admin/obd-scan.ts.
 *
 * Photos are downscaled in the browser (longest side 1600px, JPEG) before
 * upload. A 12MP phone photo is 4-6MB; the scanner text is perfectly
 * legible at a quarter of that, and the Function body cap is 6MB.
 *
 * The brief comes back as Markdown and is rendered by the small renderer at
 * the bottom of this file -- headings, bullets, bold, links. Nothing is
 * injected as HTML; every node is built as a React element, so a link in a
 * search result cannot become a script on the admin page.
 */

import { useMemo, useRef, useState, type ReactNode } from "react";
import rawSnapshot from "@/data/inventory-snapshot.json";

// ─── Types ────────────────────────────────────────────────────────────

interface SnapshotVehicle {
  vin: string;
  stockNumber: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  engine: string | null;
  mileage: number | null;
  status: string;
}

type CodeStatus = "confirmed" | "pending" | "permanent" | "history" | "unknown";

interface DtcCode {
  code: string;
  description: string;
  status: CodeStatus;
  /** Control unit that set it (Engine, Brake/EPB, SRS Airbag...). */
  module: string;
}

interface VehicleForm {
  year: string;
  make: string;
  model: string;
  trim: string;
  engine: string;
  mileage: string;
  vin: string;
}

interface Photo {
  id: string;
  name: string;
  previewUrl: string;
  mediaType: string;
  data: string; // base64, no prefix
}

interface ResearchResult {
  summary: string;
  sources: Array<{ title: string; url: string }>;
  searches: number;
  truncated: boolean;
}

type Busy = "idle" | "reading" | "researching";

const STATUS_OPTIONS: CodeStatus[] = ["confirmed", "pending", "permanent", "history", "unknown"];
const CODE_RE = /^[PBCU][0-9A-F]{4}$/;
const MAX_PHOTOS = 4;
const MAX_SIDE = 1600;

const snapshotVehicles = (rawSnapshot as { vehicles: SnapshotVehicle[] }).vehicles;

const EMPTY_VEHICLE: VehicleForm = {
  year: "",
  make: "",
  model: "",
  trim: "",
  engine: "",
  mileage: "",
  vin: "",
};

// ─── Photo downscale ──────────────────────────────────────────────────

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Could not open ${file.name}`));
    };
    img.src = url;
  });
}

async function fileToPhoto(file: File): Promise<Photo> {
  const img = await loadImage(file);
  const scale = Math.min(1, MAX_SIDE / Math.max(img.naturalWidth, img.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(img.naturalWidth * scale);
  canvas.height = Math.round(img.naturalHeight * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas unavailable in this browser.");
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
  return {
    id: `${file.name}-${file.size}-${Date.now()}`,
    name: file.name,
    previewUrl: dataUrl,
    mediaType: "image/jpeg",
    data: dataUrl.slice(dataUrl.indexOf(",") + 1),
  };
}

// ─── Component ────────────────────────────────────────────────────────

export default function ObdScanHelper() {
  // Vehicle
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [selectedVin, setSelectedVin] = useState<string>("");
  const [manual, setManual] = useState(false);
  const [vehicle, setVehicle] = useState<VehicleForm>(EMPTY_VEHICLE);

  // Codes
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [codes, setCodes] = useState<DtcCode[]>([]);
  const [scannerNotes, setScannerNotes] = useState("");
  const [vehicleHint, setVehicleHint] = useState("");
  const [techNotes, setTechNotes] = useState("");

  // Research
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [busy, setBusy] = useState<Busy>("idle");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const lotVehicles = useMemo(() => {
    const q = vehicleQuery.trim().toLowerCase();
    const list = [...snapshotVehicles].sort((a, b) =>
      a.status === b.status ? b.year - a.year : a.status === "available" ? -1 : 1
    );
    if (!q) return list;
    return list.filter((v) =>
      `${v.year} ${v.make} ${v.model} ${v.trim ?? ""} ${v.stockNumber} ${v.vin}`
        .toLowerCase()
        .includes(q)
    );
  }, [vehicleQuery]);

  function pickLotVehicle(vin: string) {
    setSelectedVin(vin);
    const v = snapshotVehicles.find((x) => x.vin === vin);
    if (!v) return;
    setVehicle({
      year: String(v.year),
      make: v.make,
      model: v.model,
      trim: v.trim ?? "",
      engine: v.engine ?? "",
      mileage: v.mileage ? String(v.mileage) : "",
      vin: v.vin,
    });
  }

  function switchToManual() {
    setManual(true);
    setSelectedVin("");
    setVehicle(EMPTY_VEHICLE);
  }

  function updateVehicle<K extends keyof VehicleForm>(key: K, value: string) {
    setVehicle((v) => ({ ...v, [key]: value }));
  }

  async function onFiles(list: FileList | null) {
    if (!list) return;
    setError(null);
    const room = MAX_PHOTOS - photos.length;
    const files = Array.from(list).slice(0, Math.max(0, room));
    if (files.length < list.length) setError(`Only ${MAX_PHOTOS} photos per scan; extras were skipped.`);
    try {
      const next = await Promise.all(files.map(fileToPhoto));
      setPhotos((p) => [...p, ...next]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  function removePhoto(id: string) {
    setPhotos((p) => p.filter((x) => x.id !== id));
  }

  // ── Codes list editing ──
  function updateCode(i: number, patch: Partial<DtcCode>) {
    setCodes((c) => c.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
  }
  function removeCode(i: number) {
    setCodes((c) => c.filter((_, idx) => idx !== i));
  }
  function addCode() {
    setCodes((c) => [...c, { code: "", description: "", status: "unknown", module: "" }]);
  }

  const validCodes = codes
    .map((c) => ({ ...c, code: c.code.trim().toUpperCase() }))
    .filter((c) => CODE_RE.test(c.code));
  const invalidCount = codes.filter((c) => c.code.trim() && !CODE_RE.test(c.code.trim().toUpperCase())).length;

  async function post(body: unknown): Promise<Response> {
    return fetch("/api/admin/obd-scan", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function readError(res: Response): Promise<string> {
    if (res.status === 401) return "Your admin session expired. Reload the page to sign in again.";
    const j = await res.json().catch(() => ({}));
    return (j as { error?: string }).error ?? `Request failed (${res.status}).`;
  }

  async function readCodes() {
    if (photos.length === 0 || busy !== "idle") return;
    setBusy("reading");
    setError(null);
    try {
      const res = await post({
        action: "extract",
        images: photos.map((p) => ({ mediaType: p.mediaType, data: p.data })),
      });
      if (!res.ok) {
        setError(await readError(res));
        return;
      }
      const data = (await res.json()) as {
        codes: DtcCode[];
        scannerNotes: string;
        vehicleHint: string | null;
      };
      // Keep anything the tech already typed; add what the photo shows. The
      // same code can appear twice on a full-system scan (current + history),
      // so a row is a duplicate only when code AND status match.
      setCodes((existing) => {
        const have = new Set(existing.map((c) => `${c.code.trim().toUpperCase()}:${c.status}`));
        return [...existing, ...data.codes.filter((c) => !have.has(`${c.code}:${c.status}`))];
      });
      setScannerNotes(data.scannerNotes ?? "");
      setVehicleHint(data.vehicleHint ?? "");
      if (data.codes.length === 0) {
        setError("No codes could be read from the photo. Try a straighter, closer shot, or type the codes in below.");
      }
    } catch (err) {
      setError(`Network error: ${(err as Error).message}`);
    } finally {
      setBusy("idle");
    }
  }

  async function research() {
    if (validCodes.length === 0 || busy !== "idle") return;
    setBusy("researching");
    setError(null);
    setResult(null);
    setCopied(false);
    try {
      const res = await post({
        action: "research",
        vehicle: {
          year: vehicle.year ? Number(vehicle.year) : null,
          make: vehicle.make || null,
          model: vehicle.model || null,
          trim: vehicle.trim || null,
          engine: vehicle.engine || null,
          mileage: vehicle.mileage ? Number(vehicle.mileage.replace(/[^0-9]/g, "")) : null,
          vin: vehicle.vin || null,
        },
        codes: validCodes,
        notes: [scannerNotes, techNotes].filter(Boolean).join("\n"),
      });
      if (!res.ok) {
        setError(await readError(res));
        return;
      }
      setResult((await res.json()) as ResearchResult);
    } catch (err) {
      setError(`Network error: ${(err as Error).message}`);
    } finally {
      setBusy("idle");
    }
  }

  async function copySummary() {
    if (!result) return;
    const label = [vehicle.year, vehicle.make, vehicle.model, vehicle.trim].filter(Boolean).join(" ");
    const text = `OBD scan brief — ${label}\nCodes: ${validCodes.map((c) => c.code).join(", ")}\n\n${result.summary}\n\nSources:\n${result.sources
      .map((s) => `- ${s.title}: ${s.url}`)
      .join("\n")}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      setError("Couldn't copy to the clipboard in this browser.");
    }
  }

  function startOver() {
    setPhotos([]);
    setCodes([]);
    setScannerNotes("");
    setVehicleHint("");
    setTechNotes("");
    setResult(null);
    setError(null);
    setCopied(false);
  }

  const vehicleReady = Boolean(vehicle.make && vehicle.model);

  return (
    <div className="space-y-8">
      {/* 1. Vehicle */}
      <Panel step="1" title="Vehicle">
        {!manual ? (
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="search"
                value={vehicleQuery}
                onChange={(e) => setVehicleQuery(e.target.value)}
                placeholder="Filter by stock #, VIN, make or model"
                className="flex-1 rounded-md border border-brand-gray-300 px-3 py-2 text-sm"
                aria-label="Filter lot vehicles"
              />
              <select
                value={selectedVin}
                onChange={(e) => pickLotVehicle(e.target.value)}
                className="flex-1 rounded-md border border-brand-gray-300 px-3 py-2 text-sm bg-white"
                aria-label="Lot vehicle"
              >
                <option value="">Choose a unit on the lot…</option>
                {lotVehicles.map((v) => (
                  <option key={v.vin} value={v.vin}>
                    #{v.stockNumber} · {v.year} {v.make} {v.model} {v.trim ?? ""}
                    {v.status !== "available" ? ` (${v.status})` : ""}
                  </option>
                ))}
              </select>
            </div>
            <button type="button" onClick={switchToManual} className="text-sm text-brand-red hover:underline">
              Not on the lot? Enter the vehicle by hand
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setManual(false)}
            className="text-sm text-brand-red hover:underline mb-3"
          >
            ← Pick a unit from the lot instead
          </button>
        )}

        {(manual || selectedVin) && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            <Field label="Year" value={vehicle.year} onChange={(v) => updateVehicle("year", v)} inputMode="numeric" />
            <Field label="Make" value={vehicle.make} onChange={(v) => updateVehicle("make", v)} />
            <Field label="Model" value={vehicle.model} onChange={(v) => updateVehicle("model", v)} />
            <Field label="Trim" value={vehicle.trim} onChange={(v) => updateVehicle("trim", v)} />
            <Field label="Engine" value={vehicle.engine} onChange={(v) => updateVehicle("engine", v)} placeholder="3.5L V6" />
            <Field label="Mileage" value={vehicle.mileage} onChange={(v) => updateVehicle("mileage", v)} inputMode="numeric" />
            <div className="col-span-2">
              <Field label="VIN" value={vehicle.vin} onChange={(v) => updateVehicle("vin", v.toUpperCase())} />
            </div>
          </div>
        )}
        {vehicleHint && (
          <p className="mt-3 text-xs text-brand-gray-500">
            The scanner screen showed: <span className="font-medium text-brand-gray-700">{vehicleHint}</span>
          </p>
        )}
      </Panel>

      {/* 2. Codes */}
      <Panel step="2" title="Codes">
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => onFiles(e.target.files)}
            className="hidden"
            id="obd-photos"
          />
          <label
            htmlFor="obd-photos"
            className="cursor-pointer rounded-md border border-brand-gray-300 bg-white px-4 py-2 text-sm font-medium text-brand-gray-900 hover:bg-brand-gray-50"
          >
            📷 Add photo of the scanner screen
          </label>
          <button
            type="button"
            onClick={readCodes}
            disabled={photos.length === 0 || busy !== "idle"}
            className="rounded-md bg-brand-red px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-dark disabled:opacity-50 disabled:cursor-default"
          >
            {busy === "reading" ? "Reading…" : "Read codes from photo"}
          </button>
          <span className="text-xs text-brand-gray-500">
            {photos.length}/{MAX_PHOTOS} photos
          </span>
        </div>

        {photos.length > 0 && (
          <ul className="mt-4 flex flex-wrap gap-3">
            {photos.map((p) => (
              <li key={p.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element -- local data URL preview */}
                <img
                  src={p.previewUrl}
                  alt={p.name}
                  className="h-28 w-28 rounded-md object-cover border border-brand-gray-200"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(p.id)}
                  aria-label={`Remove ${p.name}`}
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-brand-gray-900 text-white text-xs leading-6 text-center"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium uppercase tracking-wide text-brand-gray-500">
              Codes to research — check each one against the screen
            </p>
            <button type="button" onClick={addCode} className="text-sm text-brand-red hover:underline">
              + Add a code by hand
            </button>
          </div>
          {codes.length === 0 ? (
            <p className="text-sm text-brand-gray-400">
              Nothing yet. Read a photo, or add a code by hand.
            </p>
          ) : (
            <ul className="space-y-2">
              {codes.map((c, i) => {
                const normalised = c.code.trim().toUpperCase();
                const bad = normalised !== "" && !CODE_RE.test(normalised);
                return (
                  <li key={i} className="grid grid-cols-[6rem_8rem_1fr_auto_auto] gap-2 items-center">
                    <input
                      value={c.code}
                      onChange={(e) => updateCode(i, { code: e.target.value.toUpperCase() })}
                      placeholder="P0420"
                      maxLength={5}
                      aria-label="Trouble code"
                      aria-invalid={bad}
                      className={`rounded-md border px-2 py-1.5 font-mono text-sm uppercase ${
                        bad ? "border-red-400 bg-red-50" : "border-brand-gray-300"
                      }`}
                    />
                    <input
                      value={c.module}
                      onChange={(e) => updateCode(i, { module: e.target.value })}
                      placeholder="Module"
                      aria-label="Module that set the code"
                      className="rounded-md border border-brand-gray-300 px-2 py-1.5 text-sm"
                    />
                    <input
                      value={c.description}
                      onChange={(e) => updateCode(i, { description: e.target.value })}
                      placeholder="Scanner description (optional)"
                      aria-label="Scanner description"
                      className="rounded-md border border-brand-gray-300 px-2 py-1.5 text-sm"
                    />
                    <select
                      value={c.status}
                      onChange={(e) => updateCode(i, { status: e.target.value as CodeStatus })}
                      aria-label="Code status"
                      className="rounded-md border border-brand-gray-300 px-2 py-1.5 text-sm bg-white"
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeCode(i)}
                      aria-label={`Remove ${c.code || "code"}`}
                      className="text-brand-gray-400 hover:text-brand-red px-1"
                    >
                      ✕
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {invalidCount > 0 && (
            <p className="mt-2 text-xs text-red-700">
              A code is one letter (P, B, C or U) and four characters, like P0420. Highlighted rows will be skipped.
            </p>
          )}
        </div>

        {scannerNotes && (
          <p className="mt-4 text-sm text-brand-gray-700 bg-brand-gray-50 border border-brand-gray-200 rounded-md p-3">
            <span className="font-medium">Also on the screen:</span> {scannerNotes}
          </p>
        )}

        <label className="block mt-4">
          <span className="text-xs font-medium uppercase tracking-wide text-brand-gray-500">
            Symptoms or notes from the tech (optional)
          </span>
          <textarea
            value={techNotes}
            onChange={(e) => setTechNotes(e.target.value)}
            rows={2}
            maxLength={1000}
            placeholder="Rough idle when cold, CEL came on after fuel-up, work already done…"
            className="mt-1 w-full rounded-md border border-brand-gray-300 px-3 py-2 text-sm"
          />
        </label>
      </Panel>

      {/* 3. Research */}
      <Panel step="3" title="Research">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={research}
            disabled={validCodes.length === 0 || busy !== "idle"}
            className="rounded-md bg-brand-red px-4 py-2 text-sm font-semibold text-white hover:bg-brand-red-dark disabled:opacity-50 disabled:cursor-default"
          >
            {busy === "researching"
              ? "Researching… this takes a minute"
              : `Research ${validCodes.length || ""} code${validCodes.length === 1 ? "" : "s"}`}
          </button>
          {!vehicleReady && validCodes.length > 0 && (
            <span className="text-xs text-amber-800">
              No vehicle chosen. The brief will be generic; pick the unit above for vehicle-specific causes.
            </span>
          )}
          {(result || codes.length > 0 || photos.length > 0) && busy === "idle" && (
            <button type="button" onClick={startOver} className="text-sm text-brand-gray-500 hover:text-brand-red">
              Start over
            </button>
          )}
        </div>

        {busy === "researching" && (
          <p className="mt-4 text-sm text-brand-gray-500" role="status">
            Searching for {validCodes.map((c) => c.code).join(", ")} on the{" "}
            {[vehicle.year, vehicle.make, vehicle.model].filter(Boolean).join(" ") || "vehicle"}, reading the
            results, and writing the brief. Leave this tab open.
          </p>
        )}

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 text-xs text-brand-gray-500">
              <span>
                {result.searches > 0 ? `${result.searches} web search${result.searches === 1 ? "" : "es"} · ` : ""}
                {result.sources.length} source{result.sources.length === 1 ? "" : "s"}
                {result.truncated ? " · brief was cut short, consider re-running" : ""}
              </span>
              <button
                type="button"
                onClick={copySummary}
                className="rounded-md border border-brand-gray-300 px-3 py-1 hover:bg-brand-gray-50"
              >
                {copied ? "Copied" : "Copy brief"}
              </button>
            </div>
            <article className="prose-like text-sm text-brand-gray-800 space-y-3">
              {renderMarkdown(result.summary)}
            </article>
            {result.sources.length > 0 && (
              <div className="mt-6 pt-4 border-t border-brand-gray-200">
                <p className="text-xs font-medium uppercase tracking-wide text-brand-gray-500 mb-2">Sources</p>
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  {result.sources.map((s) => (
                    <li key={s.url}>
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-brand-red hover:underline break-words"
                      >
                        {s.title}
                      </a>
                      <span className="text-brand-gray-400 break-all"> — {hostOf(s.url)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <p className="mt-6 text-xs text-brand-gray-400">
              Generated from public web sources by an AI model. Costs, part numbers and bulletin numbers should be
              checked against the OEM service information before work is quoted.
            </p>
          </div>
        )}
      </Panel>
    </div>
  );
}

// ─── Small pieces ─────────────────────────────────────────────────────

function Panel({ step, title, children }: { step: string; title: string; children: ReactNode }) {
  return (
    <section className="rounded-xl border border-brand-gray-200 bg-white p-5 shadow-sm">
      <h2 className="flex items-center gap-2 text-base font-semibold text-brand-gray-900 mb-4">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-red text-white text-xs font-bold">
          {step}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  inputMode?: "numeric" | "text";
}) {
  return (
    <label className="block">
      <span className="text-xs font-medium uppercase tracking-wide text-brand-gray-500">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="mt-1 w-full rounded-md border border-brand-gray-300 px-2 py-1.5 text-sm"
      />
    </label>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// ─── Minimal Markdown renderer ────────────────────────────────────────
//
// Covers exactly what the research prompt is allowed to emit: ##/### headings,
// "-" / "*" bullets, "1." numbered lists, paragraphs, **bold**, `code`, and
// [text](https://url). Output is React elements only -- no HTML strings.

function renderInline(text: string, keyBase: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+\*\*)|(`[^`]+`)|(\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let k = 0;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const tok = m[0];
    const key = `${keyBase}-${k++}`;
    if (tok.startsWith("**")) {
      out.push(<strong key={key}>{tok.slice(2, -2)}</strong>);
    } else if (tok.startsWith("`")) {
      out.push(
        <code key={key} className="rounded bg-brand-gray-100 px-1 font-mono text-[0.85em]">
          {tok.slice(1, -1)}
        </code>
      );
    } else {
      const close = tok.indexOf("](");
      const label = tok.slice(1, close);
      const url = tok.slice(close + 2, -1);
      out.push(
        <a key={key} href={url} target="_blank" rel="noreferrer noopener" className="text-brand-red hover:underline">
          {label}
        </a>
      );
    }
    last = m.index + tok.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

/** Exported for the offline renderer check; not used elsewhere. */
export function renderMarkdown(md: string): ReactNode[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) {
      i++;
      continue;
    }

    const heading = /^(#{1,4})\s+(.*)$/.exec(trimmed);
    if (heading) {
      const level = heading[1].length;
      const content = renderInline(heading[2], `h${key}`);
      const cls =
        level <= 2
          ? "text-lg font-bold text-brand-gray-900 mt-5"
          : "text-base font-semibold text-brand-gray-900 mt-4";
      nodes.push(
        level <= 2 ? (
          <h3 key={key++} className={cls}>
            {content}
          </h3>
        ) : (
          <h4 key={key++} className={cls}>
            {content}
          </h4>
        )
      );
      i++;
      continue;
    }

    const bullet = /^[-*]\s+(.*)$/;
    const ordered = /^\d+[.)]\s+(.*)$/;
    if (bullet.test(trimmed) || ordered.test(trimmed)) {
      const isOrdered = ordered.test(trimmed);
      const re = isOrdered ? ordered : bullet;
      const items: ReactNode[] = [];
      while (i < lines.length) {
        const t = lines[i].trim();
        const m = re.exec(t);
        if (!m) break;
        // Fold continuation lines (indented, non-bullet) into the item.
        let body = m[1];
        i++;
        while (i < lines.length && lines[i].trim() && /^\s+/.test(lines[i]) && !re.test(lines[i].trim())) {
          body += " " + lines[i].trim();
          i++;
        }
        items.push(<li key={items.length}>{renderInline(body, `li${key}-${items.length}`)}</li>);
      }
      nodes.push(
        isOrdered ? (
          <ol key={key++} className="list-decimal pl-5 space-y-1">
            {items}
          </ol>
        ) : (
          <ul key={key++} className="list-disc pl-5 space-y-1">
            {items}
          </ul>
        )
      );
      continue;
    }

    // Paragraph: gather until a blank line or a block start.
    const para: string[] = [trimmed];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^#{1,4}\s/.test(lines[i].trim()) &&
      !bullet.test(lines[i].trim()) &&
      !ordered.test(lines[i].trim())
    ) {
      para.push(lines[i].trim());
      i++;
    }
    nodes.push(
      <p key={key++} className="leading-relaxed">
        {renderInline(para.join(" "), `p${key}`)}
      </p>
    );
  }
  return nodes;
}
