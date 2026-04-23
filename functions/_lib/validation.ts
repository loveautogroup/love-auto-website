/**
 * Validation for merchandising config payloads submitted to the admin API.
 *
 * We don't pull Zod into Functions (it'd bloat the Worker) — this is a
 * hand-rolled validator that returns clear error messages for the admin UI.
 * Keep it in sync with src/data/merchandising.ts.
 */

const STATUS_KINDS = [
  "just-arrived",
  "price-reduced",
  "price-drop",
  "staff-pick",
  "low-mileage",
  "sale-pending",
] as const;

type StatusKind = (typeof STATUS_KINDS)[number];

export interface MerchandisingConfigInput {
  featuredVins: string[];
  textPhone?: string;
  overlays: Record<string, VehicleOverlayInput>;
}

export interface VehicleOverlayInput {
  status?: StatusKind;
  carfax?: boolean;
  featurePills?: [string?, string?, string?];
  warranty?: string;
  hidden?: boolean;
  marketEstimate?: number;
}

export interface ValidationOk {
  ok: true;
  value: MerchandisingConfigInput;
}
export interface ValidationFail {
  ok: false;
  issues: string[];
}

const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/; // 17 chars, no I/O/Q
const MAX_FEATURED = 12;
const MAX_PILL_LENGTH = 40;
const MAX_WARRANTY_LENGTH = 80;

/**
 * Defense-in-depth character filter for user-supplied display text.
 *
 * React escapes these automatically when rendering text children, but we
 * reject them at the validator so that:
 *   1. If any downstream consumer ever renders this outside React (email
 *      templates, PDFs, social previews, the native DMS when Bill migrates),
 *      it can't be tricked.
 *   2. No legitimate dealership copy needs `<`, `>`, or `"` — rejecting
 *      them costs nothing.
 *   3. Control chars (except \n) shouldn't appear in display copy.
 *
 * Sam's call. Added during the Phase 2+3 security audit.
 */
function assertSafeText(value: string, fieldLabel: string, issues: string[], allowNewline = false) {
  if (/[<>"]/.test(value)) {
    issues.push(`${fieldLabel} may not contain <, >, or " characters.`);
  }
  // Allowed control char: \n for two-line pills if allowNewline, otherwise none.
  // Regex targets ASCII control chars (0x00–0x1F and 0x7F) except \n when permitted.
  const controlPattern = allowNewline ? /[\x00-\x09\x0B-\x1F\x7F]/ : /[\x00-\x1F\x7F]/;
  if (controlPattern.test(value)) {
    issues.push(`${fieldLabel} contains disallowed control characters.`);
  }
  if (allowNewline && (value.match(/\n/g)?.length ?? 0) > 1) {
    issues.push(`${fieldLabel} may contain at most one line break.`);
  }
}

export function validateMerchandisingConfig(
  input: unknown
): ValidationOk | ValidationFail {
  const issues: string[] = [];

  if (!input || typeof input !== "object") {
    return { ok: false, issues: ["Body must be an object."] };
  }
  const obj = input as Record<string, unknown>;

  // featuredVins
  if (!Array.isArray(obj.featuredVins)) {
    issues.push("featuredVins must be an array of VIN strings.");
  } else if (obj.featuredVins.length > MAX_FEATURED) {
    issues.push(`featuredVins cannot exceed ${MAX_FEATURED} entries.`);
  } else {
    obj.featuredVins.forEach((vin, i) => {
      if (typeof vin !== "string" || !VIN_PATTERN.test(vin)) {
        issues.push(`featuredVins[${i}] is not a valid 17-char VIN: ${String(vin).slice(0, 30)}`);
      }
    });
  }

  // textPhone (optional, digits only, 10-15 chars)
  if (obj.textPhone !== undefined) {
    if (typeof obj.textPhone !== "string") {
      issues.push("textPhone must be a string of digits.");
    } else if (!/^[0-9]{10,15}$/.test(obj.textPhone)) {
      issues.push("textPhone must be 10-15 digits (no spaces or punctuation).");
    }
  }

  // overlays
  if (!obj.overlays || typeof obj.overlays !== "object" || Array.isArray(obj.overlays)) {
    issues.push("overlays must be an object keyed by VIN.");
  } else {
    for (const [vin, raw] of Object.entries(obj.overlays as Record<string, unknown>)) {
      if (!VIN_PATTERN.test(vin)) {
        issues.push(`overlays key is not a valid VIN: ${vin.slice(0, 30)}`);
        continue;
      }
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
        issues.push(`overlays[${vin}] must be an object.`);
        continue;
      }
      const o = raw as Record<string, unknown>;
      if (o.status !== undefined && !STATUS_KINDS.includes(o.status as StatusKind)) {
        issues.push(`overlays[${vin}].status must be one of ${STATUS_KINDS.join(", ")}.`);
      }
      if (o.carfax !== undefined && typeof o.carfax !== "boolean") {
        issues.push(`overlays[${vin}].carfax must be boolean.`);
      }
      if (o.hidden !== undefined && typeof o.hidden !== "boolean") {
        issues.push(`overlays[${vin}].hidden must be boolean.`);
      }
      if (o.warranty !== undefined) {
        if (typeof o.warranty !== "string") {
          issues.push(`overlays[${vin}].warranty must be a string.`);
        } else if (o.warranty.length > MAX_WARRANTY_LENGTH) {
          issues.push(`overlays[${vin}].warranty too long.`);
        } else {
          assertSafeText(o.warranty, `overlays[${vin}].warranty`, issues);
        }
      }
      if (o.featurePills !== undefined) {
        if (!Array.isArray(o.featurePills) || o.featurePills.length > 3) {
          issues.push(`overlays[${vin}].featurePills must be an array of up to 3 strings.`);
        } else {
          o.featurePills.forEach((pill, i) => {
            if (pill !== undefined && typeof pill !== "string") {
              issues.push(`overlays[${vin}].featurePills[${i}] must be a string or undefined.`);
            } else if (typeof pill === "string") {
              if (pill.length > MAX_PILL_LENGTH) {
                issues.push(`overlays[${vin}].featurePills[${i}] exceeds ${MAX_PILL_LENGTH} characters.`);
              } else {
                // Pill text allows one \n for two-line formatting.
                assertSafeText(pill, `overlays[${vin}].featurePills[${i}]`, issues, true);
              }
            }
          });
        }
      }
    }
  }

  if (issues.length > 0) return { ok: false, issues };

  // Cast is safe — we've validated all the fields above.
  return { ok: true, value: input as MerchandisingConfigInput };
}
