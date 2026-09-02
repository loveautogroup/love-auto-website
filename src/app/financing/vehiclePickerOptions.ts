/**
 * Pure helpers for the financing forms' vehicle picker.
 *
 * WHY THIS EXISTS (2026-09-01): every credit application on file reached the
 * DMS with year / make / VIN / stock / price EMPTY. The form only had a
 * free-text box ("Mustang ecoboost premium"); VIN/stock/price arrived only via
 * query params when the applicant came from a car's own page. Anyone who
 * opened Financing directly typed a description, and the lender document went
 * out with the car's year, VIN and price blank. The picker replaces the guess
 * with a choice from live inventory; the free-text box survives as "another
 * vehicle" for a car we do not hold.
 *
 * Kept free of React so the rules (what is pickable, how a row is labelled,
 * how a VDP link preselects) can be read and tested without a browser.
 */

export interface PickableVehicle {
  vin: string;
  stockNumber?: string | null;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  price?: number | null;
  status?: string | null;
}

/** What the form sends to the DMS once a car is chosen. */
export interface PickedVehicle {
  vin: string;
  stock?: string;
  year: number;
  make: string;
  /** model + trim, the way the DMS list labels a car. */
  model: string;
  price?: number;
  /** The human line shown in the dropdown, kept as the record's interest text. */
  label: string;
}

/** A car a customer may apply for: on the lot, or already spoken for but not gone. */
export function pickable<T extends PickableVehicle>(vehicles: T[]): T[] {
  return vehicles.filter((v) => v.status === "available" || v.status === "sale-pending");
}

/** Exact cents — this site once rounded $13,999.99 up to "$14,000". */
export function exactPrice(price: number): string {
  return `$${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function optionLabel(v: PickableVehicle, salePendingWord: string): string {
  const name = [v.year, v.make, v.model, v.trim].filter(Boolean).join(" ");
  const price = v.price != null && v.price > 0 ? ` · ${exactPrice(v.price)}` : "";
  const stock = v.stockNumber ? ` · #${v.stockNumber}` : "";
  const pending = v.status === "sale-pending" ? ` (${salePendingWord})` : "";
  return `${name}${price}${stock}${pending}`;
}

export function toPicked(v: PickableVehicle, label: string): PickedVehicle {
  return {
    vin: v.vin,
    stock: v.stockNumber ?? undefined,
    year: v.year,
    make: v.make,
    model: [v.model, v.trim].filter(Boolean).join(" "),
    price: v.price != null && v.price > 0 ? v.price : undefined,
    label,
  };
}

/** The car a VDP apply link pointed at (?stock= or ?vin=), if it is still pickable. */
export function findPreselect<T extends PickableVehicle>(
  vehicles: T[],
  q: { stock?: string | null; vin?: string | null },
): T | undefined {
  const stock = (q.stock ?? "").trim();
  const vin = (q.vin ?? "").trim().toUpperCase();
  if (!stock && !vin) return undefined;
  return vehicles.find(
    (v) => (stock && (v.stockNumber ?? "") === stock) || (vin && v.vin.toUpperCase() === vin),
  );
}
