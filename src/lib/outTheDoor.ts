/**
 * Out-the-door estimate for a car page (owner, 2026-10-21: "Can we have the
 * deal calculator implemented on our website?").
 *
 * Price + Illinois sales tax + title + plates, and nothing else: Love Auto
 * charges no dealer or doc fee.
 *
 * The rates are Love Auto's, NOT a Chicago dealer's. Illinois vehicle tax is
 * sourced to where the dealer sells from (Villa Park, DuPage), so every Illinois
 * buyer pays 7.25% and a City of Chicago title address adds the 1.25% Chicago
 * use tax: 8.50%. A dealer located in Chicago shows 8.75% for the same ZIP; that
 * is their rate, not ours (the DMS records 8.75% as a past overcharge).
 *
 * MIRRORS love-auto-dms src/lib/zip-tax-location.ts and the phone's
 * zipTaxLocation.ts: same Chicago ZIP sets, same Census ZIP3 -> state map. The
 * deal desk is the authority; this is a labelled estimate. Change one, change all.
 *
 * Out-of-state buyers get no tax figure here: they pay their home state's tax
 * and registration when they register (or, for a few states, Illinois collects
 * at that state's rate), so the page asks them to call for an exact total
 * rather than guessing.
 *
 * PURE: no React, no fetch.
 */
import ZIP3_STATE from "@/data/zip3-state.json";

const ZIP3: Record<string, string> = ZIP3_STATE as Record<string, string>;

export const IL_RATE = 7.25;
export const IL_CHICAGO_RATE = 8.5;
export const IL_TITLE_FEE = 165;
export const IL_NEW_PLATES_FEE = 151;
/** Illinois registration transfer: moving the buyer's existing plates to this car. */
export const IL_PLATE_TRANSFER_FEE = 25;
export const DEALER_FEES = 0;

const CHICAGO_ZIPS = new Set<string>([
  "60601", "60602", "60603", "60604", "60605", "60606", "60607", "60608",
  "60609", "60610", "60611", "60612", "60613", "60614", "60615", "60616",
  "60617", "60618", "60619", "60620", "60621", "60622", "60623", "60624",
  "60625", "60626", "60628", "60629", "60630", "60631", "60632", "60634",
  "60636", "60637", "60639", "60640", "60641", "60642", "60643", "60644",
  "60645", "60646", "60647", "60649", "60651", "60652", "60653", "60654",
  "60655", "60656", "60657", "60659", "60660", "60661",
]);
/** Split by the city line: default to Chicago, but ask the buyer to confirm. */
const CHICAGO_BORDER_ZIPS = new Set<string>(["60638", "60633"]);
/** Split by the city line: default to outside Chicago, but ask to confirm. */
const SUBURB_BORDER_ZIPS = new Set<string>(["60707", "60827", "60706"]);

export type ZipPlace =
  | { kind: "none" }
  | { kind: "invalid" }
  | { kind: "illinois"; chicago: boolean; confident: boolean }
  | { kind: "out_of_state"; state: string }
  | { kind: "unknown" };

export function placeForZip(raw: string): ZipPlace {
  const zip = (raw ?? "").replace(/\D/g, "");
  if (!zip) return { kind: "none" };
  if (zip.length !== 5) return { kind: "invalid" };
  const state = ZIP3[zip.slice(0, 3)];
  if (!state) return { kind: "unknown" };
  if (state !== "IL") return { kind: "out_of_state", state };
  if (CHICAGO_ZIPS.has(zip)) return { kind: "illinois", chicago: true, confident: true };
  if (CHICAGO_BORDER_ZIPS.has(zip)) return { kind: "illinois", chicago: true, confident: false };
  if (SUBURB_BORDER_ZIPS.has(zip)) return { kind: "illinois", chicago: false, confident: false };
  return { kind: "illinois", chicago: false, confident: true };
}

export type Plates = "new" | "transfer";

export interface OutTheDoor {
  price: number;
  dealerFees: number;
  /** null when no Illinois tax applies to this estimate (out of state). */
  taxRate: number | null;
  tax: number | null;
  title: number | null;
  plates: number | null;
  /** null when the total cannot be estimated here (out of state). */
  total: number | null;
}

const cents = (n: number) => Math.round(n * 100) / 100;

/**
 * The estimate. With no ZIP yet (or an unrecognised one) it assumes an
 * Illinois address outside Chicago, the most common case, and the page says so.
 */
export function outTheDoor(price: number, place: ZipPlace, plates: Plates): OutTheDoor {
  if (place.kind === "out_of_state") {
    return { price, dealerFees: DEALER_FEES, taxRate: null, tax: null, title: null, plates: null, total: null };
  }
  const chicago = place.kind === "illinois" && place.chicago;
  const taxRate = chicago ? IL_CHICAGO_RATE : IL_RATE;
  const tax = cents((price * taxRate) / 100);
  const plateFee = plates === "transfer" ? IL_PLATE_TRANSFER_FEE : IL_NEW_PLATES_FEE;
  const total = cents(price + DEALER_FEES + tax + IL_TITLE_FEE + plateFee);
  return { price, dealerFees: DEALER_FEES, taxRate, tax, title: IL_TITLE_FEE, plates: plateFee, total };
}
