/**
 * Pluggable feed parsers.
 *
 * Set env.PARSER to one of: "stub", "adf-xml", "dealer-xml", "csv".
 *
 * Once Dealer Center sends back the feed format, the team picks the
 * matching parser (or writes a new branch in the switch below).
 *
 * All parsers return SyncedVehicle objects with `images` containing
 * the ORIGINAL Dealer Center photo URLs. The photo pipeline (photos.ts)
 * downloads those into R2 and rewrites `images` to R2-served URLs
 * before the snapshot is persisted.
 */

import type { Drivetrain, SyncedVehicle, SyncLog, VehicleStatus } from "./types";

export function parseFeed(
  body: string,
  parser: string,
  log: SyncLog
): SyncedVehicle[] {
  switch (parser) {
    case "stub":
      return parseStub(body, log);
    case "adf-xml":
      return parseAdfXml(body, log);
    case "dealer-xml":
      return parseDealerXml(body, log);
    case "csv":
      return parseCsv(body, log);
    default:
      log.errors.push(`Unknown PARSER: "${parser}". Returning empty.`);
      return [];
  }
}

// ─── Stub ───────────────────────────────────────────────────────────
//
// Returns nothing. Useful for "feed URL exists but we haven't picked a
// parser yet" — the cron runs without errors and the site keeps using
// the previous snapshot (or build-time fallback if nothing is in KV).
function parseStub(_body: string, log: SyncLog): SyncedVehicle[] {
  log.errors.push("PARSER=stub — no vehicles parsed. Set PARSER once DC's format is confirmed.");
  return [];
}

// ─── ADF/IMS XML ────────────────────────────────────────────────────
//
// Industry-standard format used by many DMS vendors. Wraps each vehicle
// in <vehicle> with sub-elements. Very forgiving — vendors all spell
// the field names slightly differently.
//
// Cloudflare Workers don't have DOMParser. We use a small regex-based
// extraction since these feeds are well-formed and the field shape is
// stable. If the feed is huge (>5MB), revisit with a streaming parser.
function parseAdfXml(body: string, log: SyncLog): SyncedVehicle[] {
  const vehicles: SyncedVehicle[] = [];
  const blocks = matchAll(body, /<vehicle\b[^>]*>([\s\S]*?)<\/vehicle>/gi);
  for (const block of blocks) {
    try {
      const vin = extract(block, "vin")?.toUpperCase();
      if (!vin || vin.length !== 17) continue;

      const year = numericExtract(block, "year");
      const make = extract(block, "make");
      const model = extract(block, "model");
      if (!year || !make || !model) continue;

      const trim = extract(block, "trim") ?? "";
      const stockNumber = extract(block, "stocknumber") ?? extract(block, "stock");
      const mileage = numericExtract(block, "odometer") ?? numericExtract(block, "mileage") ?? 0;
      const price =
        numericExtract(block, "internetprice") ??
        numericExtract(block, "askingprice") ??
        numericExtract(block, "price") ??
        0;

      const exteriorColor = extract(block, "extcolor") ?? extract(block, "exteriorcolor") ?? "";
      const interiorColor = extract(block, "intcolor") ?? extract(block, "interiorcolor") ?? "";
      const transmission = extract(block, "transmission") ?? "";
      const fuelType = extract(block, "fueltype") ?? extract(block, "fuel") ?? "Gasoline";
      const engine = extract(block, "engine") ?? "";
      const bodyStyle = extract(block, "bodystyle") ?? extract(block, "body") ?? "";
      const drivetrainStr = (extract(block, "drivetrain") ?? extract(block, "drivetype") ?? "").toUpperCase();
      const drivetrain: Drivetrain =
        drivetrainStr.includes("AWD") ? "AWD" :
        drivetrainStr.includes("4WD") || drivetrainStr.includes("4X4") ? "4WD" :
        drivetrainStr.includes("RWD") ? "RWD" : "FWD";

      const statusStr = (extract(block, "status") ?? extract(block, "stockstatus") ?? "available").toLowerCase();
      const status: VehicleStatus =
        statusStr.includes("sold") ? "sold" :
        statusStr.includes("pending") ? "sale-pending" : "available";

      // Photos
      const photoBlock = matchOne(block, /<photos?\b[^>]*>([\s\S]*?)<\/photos?>/i);
      const images = photoBlock
        ? matchAll(photoBlock, /<(?:photo|url)\b[^>]*>(?:<!\[CDATA\[)?([^<\]]+)/gi).map((m) => m.trim())
        : matchAll(block, /<photourl\b[^>]*>(?:<!\[CDATA\[)?([^<\]]+)/gi).map((m) => m.trim());

      // Features
      const featureBlock = matchOne(block, /<(?:features?|options?)\b[^>]*>([\s\S]*?)<\/(?:features?|options?)>/i);
      const features = featureBlock
        ? matchAll(featureBlock, /<(?:feature|option)\b[^>]*>(?:<!\[CDATA\[)?([^<\]]+)/gi).map((m) => m.trim())
        : [];

      const dateInStock = extract(block, "datereceived") ?? new Date().toISOString().slice(0, 10);
      const daysOnLot = Math.max(0, Math.floor(
        (Date.now() - new Date(dateInStock).getTime()) / 86_400_000
      ));

      vehicles.push({
        vin,
        stockNumber,
        slug: makeSlug(year, make, model, trim, stockNumber ?? vin.slice(-5)),
        year,
        make,
        model,
        trim,
        bodyStyle,
        drivetrain,
        transmission,
        fuelType,
        engine,
        exteriorColor,
        interiorColor,
        mileage,
        price,
        status,
        features,
        daysOnLot,
        dateInStock,
        images,
        // First/lastSeen get stamped by the runner, not the parser.
        dealerCenterFirstSeen: "",
        dealerCenterLastSeen: "",
      });
    } catch (err) {
      log.errors.push(`adf-xml parse error: ${(err as Error).message}`);
    }
  }
  return vehicles;
}

// ─── Custom Dealer XML ──────────────────────────────────────────────
//
// Placeholder for if Dealer Center's format isn't ADF/IMS but their
// own custom XML. Until they send the URL + format, this is a copy of
// the ADF parser — adjust the field names once we see real data.
function parseDealerXml(body: string, log: SyncLog): SyncedVehicle[] {
  log.errors.push("dealer-xml parser is a placeholder; review and adjust field names against the real DC feed shape before relying on it.");
  return parseAdfXml(body, log);
}

// ─── CSV ────────────────────────────────────────────────────────────
//
// Most DMSes that don't ship XML ship CSV with one row per vehicle.
// Header column names vary; we try common variants. Once we have the
// real CSV, normalize the column-name map at the top.
function parseCsv(body: string, log: SyncLog): SyncedVehicle[] {
  const lines = body.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) {
    log.errors.push("CSV had fewer than 2 lines (no data rows).");
    return [];
  }
  const headers = parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());

  // Map DC column name → our internal field
  const COLUMN_MAP: Record<string, keyof SyncedVehicle | "_skip"> = {
    vin: "vin",
    stocknumber: "stockNumber",
    "stock number": "stockNumber",
    stock: "stockNumber",
    year: "year",
    make: "make",
    model: "model",
    trim: "trim",
    bodystyle: "bodyStyle",
    "body style": "bodyStyle",
    body: "bodyStyle",
    drivetrain: "drivetrain",
    drivetype: "drivetrain",
    transmission: "transmission",
    fueltype: "fuelType",
    "fuel type": "fuelType",
    fuel: "fuelType",
    engine: "engine",
    extcolor: "exteriorColor",
    "exterior color": "exteriorColor",
    intcolor: "interiorColor",
    "interior color": "interiorColor",
    odometer: "mileage",
    mileage: "mileage",
    price: "price",
    askingprice: "price",
    "asking price": "price",
    internetprice: "price",
    "internet price": "price",
    status: "status",
    stockstatus: "status",
    photos: "images",
    photourls: "images",
    "photo urls": "images",
    datereceived: "dateInStock",
    "date received": "dateInStock",
  };

  const vehicles: SyncedVehicle[] = [];
  for (let i = 1; i < lines.length; i++) {
    try {
      const row = parseCsvLine(lines[i]);
      const v: Partial<SyncedVehicle> = {
        features: [],
        images: [],
      };
      for (let j = 0; j < headers.length; j++) {
        const colName = headers[j];
        const target = COLUMN_MAP[colName];
        if (!target || target === "_skip") continue;
        const raw = row[j]?.trim() ?? "";
        if (!raw) continue;

        if (target === "year" || target === "mileage" || target === "price") {
          (v as Record<string, unknown>)[target] = Number(raw.replace(/[^0-9.-]/g, ""));
        } else if (target === "drivetrain") {
          const u = raw.toUpperCase();
          v.drivetrain = u.includes("AWD") ? "AWD" : u.includes("4WD") ? "4WD" : u.includes("RWD") ? "RWD" : "FWD";
        } else if (target === "status") {
          const u = raw.toLowerCase();
          v.status = u.includes("sold") ? "sold" : u.includes("pending") ? "sale-pending" : "available";
        } else if (target === "images") {
          v.images = raw.split(/[|;,]/).map((s) => s.trim()).filter(Boolean);
        } else {
          (v as Record<string, unknown>)[target] = raw;
        }
      }
      if (!v.vin || !v.year || !v.make || !v.model) continue;

      const dateInStock = v.dateInStock ?? new Date().toISOString().slice(0, 10);
      vehicles.push({
        vin: v.vin.toUpperCase(),
        stockNumber: v.stockNumber,
        slug: makeSlug(v.year, v.make, v.model, v.trim ?? "", v.stockNumber ?? v.vin.slice(-5)),
        year: v.year,
        make: v.make,
        model: v.model,
        trim: v.trim ?? "",
        bodyStyle: v.bodyStyle ?? "",
        drivetrain: v.drivetrain ?? "FWD",
        transmission: v.transmission ?? "",
        fuelType: v.fuelType ?? "Gasoline",
        engine: v.engine ?? "",
        exteriorColor: v.exteriorColor ?? "",
        interiorColor: v.interiorColor ?? "",
        mileage: v.mileage ?? 0,
        price: v.price ?? 0,
        status: v.status ?? "available",
        features: v.features ?? [],
        daysOnLot: Math.max(0, Math.floor((Date.now() - new Date(dateInStock).getTime()) / 86_400_000)),
        dateInStock,
        images: v.images ?? [],
        dealerCenterFirstSeen: "",
        dealerCenterLastSeen: "",
      });
    } catch (err) {
      log.errors.push(`csv row ${i} error: ${(err as Error).message}`);
    }
  }
  return vehicles;
}

// ─── Helpers ────────────────────────────────────────────────────────

function extract(block: string, tag: string): string | undefined {
  // Case-insensitive, accepts attributes, handles CDATA. Returns the
  // first match's content, trimmed.
  const re = new RegExp(`<${tag}\\b[^>]*>(?:<!\\[CDATA\\[)?([^<\\]]+)`, "i");
  const m = block.match(re);
  return m?.[1]?.trim();
}

function numericExtract(block: string, tag: string): number | undefined {
  const v = extract(block, tag);
  if (!v) return undefined;
  const n = Number(v.replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

function matchAll(body: string, re: RegExp): string[] {
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    out.push(m[1]);
  }
  return out;
}

function matchOne(body: string, re: RegExp): string | undefined {
  return body.match(re)?.[1];
}

/**
 * Minimal CSV line parser — handles quoted fields with commas inside.
 * Doesn't do escaped quotes inside quotes (`""`) — extend if real DC
 * data uses that form.
 */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function makeSlug(year: number, make: string, model: string, trim: string, suffix: string): string {
  const parts = [year, make, model, trim, suffix].filter(Boolean);
  return parts
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}
