/**
 * Turn the DMS's equipment columns into the two feature lists a listing feed
 * publishes (2026-09-02).
 *
 * WHY THIS IS NOT A BOOLEAN MAP. The nine safety columns carry NHTSA's own
 * vocabulary — "Standard", "Optional", "Not Available" — and null on top of
 * that. Four distinct states, and only two of them are things we may
 * advertise. Collapsing them into "has it / does not have it" would publish
 * "we do not know" as a claim, which is the shape of defect that once put a
 * Pioneer stereo, push-button start and blind-spot monitoring on a 2013
 * Mustang that had none of them.
 *
 * So: default-deny. "Standard" and "Optional" are the ONLY values that
 * produce output. "Not Available", null, blank, and anything unrecognised
 * produce nothing at all.
 *
 * The airbag columns are a different shape again — comma-separated LOCATION
 * lists ("1st Row (Driver and Passenger)"), not the tri-state vocabulary. A
 * populated one means the car has that airbag type, so it is reported as a
 * standard feature; a value that reads as a denial is not.
 *
 * Pure — no Cloudflare or Node globals — so the edge functions share it and
 * it is directly testable.
 */

/** Column -> the words a shopper reads. Order is the publish order. */
const SAFETY_LABELS: ReadonlyArray<readonly [string, string]> = [
  ["abs", "Anti-lock brakes (ABS)"],
  ["esc", "Electronic stability control"],
  ["traction_control", "Traction control"],
  ["backup_camera", "Backup camera"],
  ["blind_spot_monitoring", "Blind-spot monitoring"],
  ["forward_collision_warning", "Forward collision warning"],
  ["lane_departure_warning", "Lane departure warning"],
  ["keyless_ignition", "Keyless ignition"],
  ["adaptive_cruise_control", "Adaptive cruise control"],
] as const;

const AIRBAG_LABELS: ReadonlyArray<readonly [string, string]> = [
  ["airbag_front", "Front airbags"],
  ["airbag_side", "Side airbags"],
  ["airbag_curtain", "Curtain airbags"],
  ["airbag_knee", "Knee airbags"],
] as const;

/** Values that mean "no" however NHTSA or a person phrased it. Matched on the
 *  whole trimmed string, lowercased — never as a substring, because
 *  "Standard" contains no negation but a substring test on "no" would hit
 *  plenty of legitimate text. */
const DENIALS = new Set([
  "not available",
  "not applicable",
  "none",
  "no",
  "n",
  "false",
  "0",
  "unknown",
  "",
]);

function norm(v: unknown): string {
  return typeof v === "string" ? v.trim().toLowerCase() : "";
}

/** The shape this reads. Deliberately loose: it is fed a feed vehicle whose
 *  equipment keys may all be absent on an older payload. */
export interface EquipmentSource {
  abs?: string | null;
  esc?: string | null;
  tractionControl?: string | null;
  backupCamera?: string | null;
  blindSpotMonitoring?: string | null;
  forwardCollisionWarning?: string | null;
  laneDepartureWarning?: string | null;
  keylessIgnition?: string | null;
  adaptiveCruiseControl?: string | null;
  airbagFront?: string | null;
  airbagSide?: string | null;
  airbagCurtain?: string | null;
  airbagKnee?: string | null;
  /** The dealer's own free-text equipment list. */
  features?: string[] | null;
}

/** snake_case column -> the camelCase key the feed layer carries. */
function camel(key: string): keyof EquipmentSource {
  const [head, ...rest] = key.split("_");
  return (head + rest.map((w) => w[0].toUpperCase() + w.slice(1)).join("")) as keyof EquipmentSource;
}

export interface EquipmentLists {
  /** Fitted as standard, plus the dealer's own list. */
  standard: string[];
  /** Fitted as a factory option on this car. */
  optional: string[];
}

/**
 * Split a vehicle's equipment into what to publish as standard vs optional.
 *
 * Nothing is emitted for "Not Available", null, blank or an unrecognised
 * value. Entries are de-duplicated case-insensitively, so a dealer-typed
 * "Backup Camera" and a decoded `backup_camera: "Standard"` publish once.
 */
export function equipmentLists(v: EquipmentSource | null | undefined): EquipmentLists {
  const standard: string[] = [];
  const optional: string[] = [];
  if (!v) return { standard, optional };

  for (const [col, label] of SAFETY_LABELS) {
    const raw = norm(v[camel(col)]);
    if (raw === "standard") standard.push(label);
    else if (raw === "optional") optional.push(label);
    // Everything else — including "Not Available" and null — publishes nothing.
  }

  for (const [col, label] of AIRBAG_LABELS) {
    const raw = norm(v[camel(col)]);
    if (raw && !DENIALS.has(raw)) standard.push(label);
  }

  // The dealer's own list last: it is the least structured, so the decoded
  // facts lead.
  for (const f of v.features ?? []) {
    if (typeof f === "string" && f.trim()) standard.push(f.trim());
  }

  return { standard: dedupe(standard), optional: dedupe(optional) };
}

function dedupe(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of items) {
    const k = s.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seen.has(k)) continue;
    seen.add(k);
    out.push(s);
  }
  return out;
}
