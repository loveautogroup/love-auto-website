/**
 * GA4 Analytics — Love Auto Group (loveautogroup.net)
 *
 * Measurement ID: G-1LHF81EF2G (set via NEXT_PUBLIC_GA_MEASUREMENT_ID)
 * Stream ID:      14553927993
 *
 * CONVERSION EVENTS (mark in GA4 Admin > Events > Mark as conversion):
 *   - lead_contact
 *   - lead_test_drive
 *   - lead_financing   (highest value)
 *   - lead_tradein
 */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

// ---------------------------------------------------------------------------
// Core
// ---------------------------------------------------------------------------

function gtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag(...args);
  }
}

export function sendEvent(name: string, params?: Record<string, unknown>) {
  gtag('event', name, params);
}

// ---------------------------------------------------------------------------
// Vehicle events
// ---------------------------------------------------------------------------

export interface VehiclePayload {
  vin: string;
  year: number;
  make: string;
  model: string;
  trim?: string;
  price: number;
  stockNumber: string;
}

/** Fire once on VDP page load */
export function trackViewVehicle(v: VehiclePayload) {
  sendEvent('view_vehicle', {
    item_id: v.vin,
    item_name: [v.year, v.make, v.model, v.trim].filter(Boolean).join(' '),
    price: v.price,
    stock_number: v.stockNumber,
  });
}

// ---------------------------------------------------------------------------
// Lead / conversion events
// ---------------------------------------------------------------------------

/** General contact / inquiry form submission */
export function trackLeadContact(source: string) {
  sendEvent('lead_contact', { form_source: source });
}

/** Test drive request — optionally attach the vehicle */
export function trackLeadTestDrive(vehicle?: { vin?: string; make?: string; model?: string }) {
  sendEvent('lead_test_drive', {
    vehicle_vin: vehicle?.vin,
    vehicle_name: vehicle ? `${vehicle.make} ${vehicle.model}` : undefined,
  });
}

/** Financing pre-approval — highest-value conversion */
export function trackLeadFinancing() {
  sendEvent('lead_financing', { value: 1, currency: 'USD' });
}

/** Trade-in / sell-your-car form */
export function trackLeadTradeIn() {
  sendEvent('lead_tradein');
}

// ---------------------------------------------------------------------------
// Engagement events
// ---------------------------------------------------------------------------

/** Phone number click — pass location like 'header', 'footer', 'vdp', 'contact' */
export function trackPhoneClick(location: string) {
  sendEvent('click_phone', { click_location: location });
}

/** Get directions click */
export function trackDirectionsClick() {
  sendEvent('click_directions');
}

/** Generic form submission (fires alongside the specific lead event) */
export function trackFormSubmit(formType: string) {
  sendEvent('form_submit', { form_type: formType });
}

/** Inventory filter interaction — pass the active filters */
export function trackInventoryFilter(filters: Record<string, string>) {
  sendEvent('inventory_filter', filters);
}

/** Outbound link click */
export function trackOutboundClick(url: string, label?: string) {
  sendEvent('outbound_click', { link_url: url, link_text: label });
}
