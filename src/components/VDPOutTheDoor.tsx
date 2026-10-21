"use client";

/**
 * "Out the door" estimate on the car page (owner, 2026-10-21). The buyer types
 * a ZIP and picks new plates or a plate transfer; the card shows the price, our
 * $0 dealer and doc fee, the Illinois sales tax for that address, title and
 * plates, and the total. Rules and rates live in src/lib/outTheDoor.ts.
 */
import { useId, useMemo, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { IL_CHICAGO_RATE, IL_RATE, outTheDoor, placeForZip, type Plates } from "@/lib/outTheDoor";
import { SITE_CONFIG } from "@/lib/constants";
import { useGlobalTextPhone } from "@/data/useMerchandising";

const dashes = (raw: string) => raw.replace(/^1?(\d{3})(\d{3})(\d{4})$/, "$1-$2-$3");

const pct = (r: number) => r.toFixed(2);
const usd = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2 }).format(n);

const COPY = {
  en: {
    title: "Your out-the-door cost",
    lead: "The price plus Illinois tax, title and plates for your ZIP.",
    noFees: "Dealer & doc fee: $0",
    zip: "ZIP code",
    zipHint: "Enter your ZIP for your exact tax rate.",
    newPlates: "New plates",
    transfer: "Transfer my plates",
    price: "Vehicle price",
    fees: "Dealer fees and doc fee",
    tax: "Illinois sales tax",
    chicago: (r: string) => `Chicago address, ${r}%`,
    illinois: (r: string) => `Illinois address, ${r}%`,
    assumed: (r: string) => `Illinois address outside Chicago, ${r}% (enter your ZIP)`,
    confirm: "This ZIP crosses the Chicago city line; your title address decides the rate.",
    title_: "Illinois title",
    newFee: "New passenger plates",
    transferFee: "Plate transfer",
    total: "Estimated total at signing",
    note: `Estimate for a cash purchase with no trade-in. Illinois taxes the car at ${pct(IL_RATE)}% for an Illinois address and ${pct(IL_CHICAGO_RATE)}% for a City of Chicago address. Your Buyer's Order has the final figures.`,
    invalid: "Enter a 5-digit ZIP code.",
    unknown: "We could not place that ZIP. The figures assume an Illinois address outside Chicago.",
    oos: (s: string) => `Out-of-state buyer (${s}): you pay your home state's tax and registration when you register the car there, so the total depends on your state. We will work out your exact out-the-door figure.`,
    oosTotal: "Price with no dealer fees",
    call: "Call",
    text: "or text",
  },
  es: {
    title: "Su costo total final",
    lead: "El precio más el impuesto, título y placas de Illinois para su código postal.",
    noFees: "Cargo del concesionario y de documentación: $0",
    zip: "Código postal",
    zipHint: "Ingrese su código postal para su tasa exacta.",
    newPlates: "Placas nuevas",
    transfer: "Transferir mis placas",
    price: "Precio del vehículo",
    fees: "Cargos del concesionario y de documentación",
    tax: "Impuesto de ventas de Illinois",
    chicago: (r: string) => `Dirección en Chicago, ${r}%`,
    illinois: (r: string) => `Dirección en Illinois, ${r}%`,
    assumed: (r: string) => `Dirección en Illinois fuera de Chicago, ${r}% (ingrese su código postal)`,
    confirm: "Este código postal cruza el límite de Chicago; la dirección del título decide la tasa.",
    title_: "Título de Illinois",
    newFee: "Placas nuevas de pasajero",
    transferFee: "Transferencia de placas",
    total: "Total estimado al firmar",
    note: `Estimado para una compra en efectivo sin vehículo de intercambio. Illinois cobra ${pct(IL_RATE)}% para una dirección en Illinois y ${pct(IL_CHICAGO_RATE)}% para una dirección en la ciudad de Chicago. Su orden de compra tiene las cifras finales.`,
    invalid: "Ingrese un código postal de 5 dígitos.",
    unknown: "No pudimos ubicar ese código postal. Las cifras suponen una dirección en Illinois fuera de Chicago.",
    oos: (s: string) => `Comprador de otro estado (${s}): usted paga el impuesto y el registro de su estado al registrar el auto allí, así que el total depende de su estado. Calcularemos su costo total exacto.`,
    oosTotal: "Precio sin cargos del concesionario",
    call: "Llame al",
    text: "o envíe un mensaje al",
  },
} as const;

function Line({ label, sub, value, green = false }: { label: string; sub?: string | null; value: string; green?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-brand-gray-200 py-2.5 last:border-b-0">
      <div>
        <div className="text-sm text-brand-gray-700">{label}</div>
        {sub ? <div className="text-xs text-brand-gray-500">{sub}</div> : null}
      </div>
      <div className={`text-sm font-bold whitespace-nowrap ${green ? "text-green-700" : "text-brand-gray-900"}`}>{value}</div>
    </div>
  );
}

export default function VDPOutTheDoor({ vehiclePrice, className = "" }: { vehiclePrice: number; className?: string }) {
  const { locale } = useLanguage();
  // The page renders one copy for desktop and one for phones; useId keeps the
  // ZIP field and the radio group of each copy separate.
  const uid = useId();
  const zipId = `otd-zip-${uid}`;
  const c = COPY[locale === "es" ? "es" : "en"];
  const [zip, setZip] = useState("");
  const [plates, setPlates] = useState<Plates>("new");
  // The landline cannot take texts: call 630-359-3643, text the configured
  // text number (the same one the header's Text button uses).
  const globalText = useGlobalTextPhone();
  const textRaw = globalText && /^[0-9]{10,15}$/.test(globalText) ? globalText : null;

  const place = useMemo(() => placeForZip(zip), [zip]);
  const est = useMemo(() => outTheDoor(vehiclePrice, place, plates), [vehiclePrice, place, plates]);

  if (!vehiclePrice || vehiclePrice <= 0) return null;

  const taxSub =
    place.kind === "illinois"
      ? place.chicago ? c.chicago(pct(IL_CHICAGO_RATE)) : c.illinois(pct(IL_RATE))
      : c.assumed(pct(IL_RATE));

  return (
    <div data-otd className={`bg-brand-gray-50 rounded-xl border border-brand-gray-200 overflow-hidden ${className}`}>
      <div className="bg-brand-navy text-white px-4 py-3">
        <h3 className="text-sm font-bold uppercase tracking-wide">{c.title}</h3>
        <p className="text-xs text-brand-gray-300 mt-0.5">{c.lead}</p>
      </div>
      <div className="p-4 space-y-3">
        <p className="text-sm font-bold text-green-700">{c.noFees}</p>

        <div className="flex items-center gap-3">
          <label htmlFor={zipId} className="text-xs font-medium text-brand-gray-700">{c.zip}</label>
          <input
            id={zipId}
            inputMode="numeric"
            autoComplete="postal-code"
            maxLength={5}
            value={zip}
            onChange={(e) => setZip(e.target.value.replace(/\D/g, "").slice(0, 5))}
            placeholder="60181"
            className="w-28 text-sm border border-brand-gray-200 rounded-md px-2.5 py-1.5 bg-white"
          />
        </div>
        {place.kind === "none" ? <p className="text-xs text-brand-gray-500">{c.zipHint}</p> : null}
        {place.kind === "invalid" ? <p className="text-xs text-brand-gray-500">{c.invalid}</p> : null}
        {place.kind === "unknown" ? <p className="text-xs text-amber-700">{c.unknown}</p> : null}
        {place.kind === "illinois" && !place.confident ? <p className="text-xs text-amber-700">{c.confirm}</p> : null}

        {place.kind !== "out_of_state" ? (
          <div className="flex flex-wrap gap-x-4 gap-y-1" role="radiogroup">
            {(["new", "transfer"] as const).map((k) => (
              <label key={k} className="inline-flex items-center gap-1.5 text-sm text-brand-gray-900 cursor-pointer">
                <input type="radio" name={`otd-plates-${uid}`} checked={plates === k} onChange={() => setPlates(k)} className="accent-brand-red" />
                {k === "new" ? c.newPlates : c.transfer}
              </label>
            ))}
          </div>
        ) : null}

        <div>
          <Line label={c.price} value={usd(est.price)} />
          <Line label={c.fees} value={usd(est.dealerFees)} green />
          {est.tax != null ? <Line label={c.tax} sub={taxSub} value={usd(est.tax)} /> : null}
          {est.title != null ? <Line label={c.title_} value={usd(est.title)} /> : null}
          {est.plates != null ? <Line label={plates === "transfer" ? c.transferFee : c.newFee} value={usd(est.plates)} /> : null}
        </div>

        {est.total != null ? (
          <div className="flex items-baseline justify-between gap-3 border-t-2 border-brand-gray-900 pt-3">
            <span className="text-sm font-bold text-brand-gray-900">{c.total}</span>
            <span className="text-2xl font-extrabold text-brand-gray-900">{usd(est.total)}</span>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-baseline justify-between gap-3 border-t-2 border-brand-gray-900 pt-3">
              <span className="text-sm font-bold text-brand-gray-900">{c.oosTotal}</span>
              <span className="text-2xl font-extrabold text-brand-gray-900">{usd(est.price)}</span>
            </div>
            <p className="text-xs text-brand-gray-700">{place.kind === "out_of_state" ? c.oos(place.state) : null}</p>
            <p className="text-sm text-brand-gray-900">
              {c.call}{" "}
              <a href={`tel:${SITE_CONFIG.phoneRaw}`} className="font-semibold text-brand-red underline">{SITE_CONFIG.phone}</a>
              {textRaw ? (
                <>
                  {" "}{c.text}{" "}
                  <a href={`sms:${textRaw}`} className="font-semibold text-brand-red underline">{dashes(textRaw)}</a>
                </>
              ) : null}
            </p>
          </div>
        )}

        <p className="text-[11px] leading-snug text-brand-gray-500">{c.note}</p>
      </div>
    </div>
  );
}
