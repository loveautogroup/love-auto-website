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
  defaultWarranty: string;
  overlays: Record<string, VehicleOverlayInput>;
}

export interface VehicleOverlayInput {
  status?: StatusKind;
  carfax?: boolean;
  featurePills?: [string?, string?, string?];
  warrantyOverride?: string;
  hidden?: boolean;
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

  // defaultWarranty
  if (typeof obj.defaultWarranty !== "string") {
    issues.push("defaultWarranty must be a string.");
  } else if (obj.defaultWarranty.length > MAX_WARRANTY_LENGTH) {
    issues.push(`defaultWarranty exceeds ${MAX_WARRANTY_LENGTH} characters.`);
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
      if (o.warrantyOverride !== undefined) {
        if (typeof o.warrantyOverride !== "string") {
          issues.push(`overlays[${vin}].warrantyOverride must be a string.`);
        } else if (o.warrantyOverride.length > MAX_WARRANTY_LENGTH) {
          issues.push(`overlays[${vin}].warrantyOverride too long.`);
        }
      }
      if (o.featurePills !== undefined) {
        if (!Array.isArray(o.featurePills) || o.featurePills.length > 3) {
          issues.push(`overlays[${vin}].featurePills must be an array of up to 3 strings.`);
        } else {
          o.featurePills.forEach((pill, i) => {
            if (pill !== undefined && typeof pill !== "string") {
              issues.push(`overlays[${vin}].featurePills[${i}] must be a string or undefined.`);
            } else if (typeof pill === "string" && pill.length > MAX_PILL_LENGTH) {
              issues.push(`overlays[${vin}].featurePills[${i}] exceeds ${MAX_PILL_LENGTH} characters.`);
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
