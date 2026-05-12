export interface Vehicle {
  id: string;
  slug: string;
  vin: string;
  stockNumber: string;
  year: number;
  make: string;
  model: string;
  trim: string;
  price: number;
  mileage: number;
  exteriorColor: string;
  interiorColor: string;
  drivetrain: string;
  transmission: string;
  engine: string;
  bodyStyle: string;
  fuelType: string;
  description: string;
  features: string[];
  images: string[];
  status: "available" | "sale-pending" | "sold" | "coming-soon";
  dateInStock: string;
  daysOnLot: number;
  /** Public feed flag — true if vehicle had a price decrease in the
   *  last 14 days. Powers the "Recently Reduced" badge on cards + VDP.
   *  Backend logs decreases via pricing_history.log_price_change()
   *  on every dashboard PATCH that changes asking_price. Defaults to
   *  false when absent (back-compat with seed inventory). */
  recentlyReduced?: boolean;
  /** Phase 2 photo pipeline — R2-hosted walkaround video URL.
   *  Null in Phase 1 (VDPWalkaround renders nothing when null).
   *  Populated once Lisa's WalkAroundScreen uploads to R2. */
  walkaroundUrl?: string | null;
  /** Phase 2 photo pipeline — poster frame URL shown before video loads.
   *  Falls back to hero image when null. */
  walkaroundPosterUrl?: string | null;
  /** AS-IS sale flag. True for all Love Auto vehicles (no dealer warranty).
   *  Surfaced from Railway public feed as `as_is`. Defaults to true when
   *  absent (back-compat with KV snapshots that predate the field). */
  asIs?: boolean;
  /** Known defects disclosed by the seller per Diane's legal workflow.
   *  Null when none have been documented. Shown on the VDP so buyers
   *  can make an informed decision before purchase. */
  knownIssues?: string | null;
}

export interface ContactFormData {
  name: string;
  phone: string;
  email: string;
  message: string;
  vehicleOfInterest?: string;
}

export interface FinancingFormData {
  name: string;
  phone: string;
  email: string;
  vehicleOfInterest?: string;
  creditScore: string;
  monthlyBudget: string;
}

export interface TradeInFormData {
  vehicleYear: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleTrim: string;
  vehicleMileage: string;
  condition: "excellent" | "good" | "fair" | "poor";
  name: string;
  phone: string;
  email: string;
}
