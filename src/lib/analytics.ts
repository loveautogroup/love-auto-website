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

/**
 * Push a gtag command onto the dataLayer.
 *
 * MUST push the `arguments` object, NOT an Array. gtag.js only dispatches a
 * dataLayer entry as a gtag command when it passes an is-arguments check:
 *   Object.prototype.toString.call(x) === "[object Arguments]"
 *      || Object.prototype.hasOwnProperty.call(x, "callee")
 * A real Array falls into a different branch that reads args[0] as a dotted
 * global-method path, so `['event', name, params]` becomes an attempt to call
 * `window['event'](name, params)` inside a try/catch. window.event is not a
 * function, the TypeError is swallowed, and the event is dropped with no
 * console error and no network beacon. That is exactly what happened between
 * 2026-06-29 (fc483d4) and this fix: every custom event vanished silently
 * while Google's own automatic events kept flowing.
 *
 * We still push straight to the dataLayer instead of gating on window.gtag:
 * VDPTracker fires view_vehicle from a mount effect that can run BEFORE the
 * gtag/js loader defines window.gtag. GA4 drains queued dataLayer entries in
 * order once the library loads, so queuing here never loses an event — the
 * queue was the right instinct, the Array was the bug.
 */
const pushCommand: (...args: unknown[]) => void = function () {
  // eslint-disable-next-line prefer-rest-params
  (window.dataLayer = window.dataLayer || []).push(arguments);
};

function gtag(...args: unknown[]) {
  if (typeof window === 'undefined') return;
  pushCommand(...args);
}

export function sendEvent(name: string, params?: Record<string, unknown>) {
  // Omit the third slot entirely when there are no params, so the queued
  // command matches a plain gtag('event', name) call.
  if (params) gtag('event', name, params);
  else gtag('event', name);
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
