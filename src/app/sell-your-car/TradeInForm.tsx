"use client";

// W1 acquisition funnel (Jun 7 2026). The previous version of this form
// never POSTed anywhere — submissions were silently dropped. This one:
//   - optional VIN decode (NHTSA vPIC, client-side) autofills Y/M/M/trim
//   - up to 6 photos, downscaled client-side to ~1280px JPEG
//   - POSTs to /api/sell-your-car (CF Pages Function -> KV -> DMS
//     Acquisitions page + notification bell)

import { useRef, useState } from "react";

const inputCls =
  "w-full border border-brand-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-red";
const labelCls = "block text-sm font-medium text-brand-gray-900 mb-1";

async function compressImage(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxDim = 1280;
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.72);
}

export default function TradeInForm() {
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [vin, setVin] = useState("");
  const [decoding, setDecoding] = useState(false);
  const [decodeMsg, setDecodeMsg] = useState("");
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [photos, setPhotos] = useState<string[]>([]);
  const [photoErr, setPhotoErr] = useState("");
  const startedAt = useRef(Date.now());
  const fileRef = useRef<HTMLInputElement>(null);

  const decodeVin = async () => {
    const v = vin.trim().toUpperCase();
    if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(v)) {
      setDecodeMsg("VIN must be 17 characters.");
      return;
    }
    setDecoding(true);
    setDecodeMsg("");
    try {
      const res = await fetch(
        `https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/${v}?format=json`
      );
      const json = await res.json();
      const r = json?.Results?.[0] ?? {};
      if (r.ModelYear) setYear(String(r.ModelYear));
      if (r.Make) setMake(r.Make.charAt(0) + r.Make.slice(1).toLowerCase());
      if (r.Model) setModel(r.Model);
      if (r.Trim) setTrim(r.Trim);
      setDecodeMsg(r.Make ? "Decoded. Check the details below." : "Couldn't decode that VIN. Fill in the details below.");
    } catch {
      setDecodeMsg("Decode unavailable. Fill in the details below.");
    } finally {
      setDecoding(false);
    }
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    setPhotoErr("");
    const room = 6 - photos.length;
    const picked = [...files].slice(0, room);
    try {
      const compressed = await Promise.all(picked.map(compressImage));
      const ok = compressed.filter((c) => c.length <= 600_000);
      if (ok.length < compressed.length) setPhotoErr("Some photos were too large and were skipped.");
      setPhotos((cur) => [...cur, ...ok].slice(0, 6));
    } catch {
      setPhotoErr("Couldn't read one of those photos.");
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  if (submitted) {
    return (
      <div className="bg-brand-green/10 border border-brand-green/20 rounded-xl p-8 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-brand-green mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-xl font-bold text-brand-gray-900 mb-2">Submitted!</h3>
        <p className="text-brand-gray-600">
          We&apos;ve received your vehicle info{photos.length > 0 ? " and photos" : ""}. We&apos;ll review it and get
          back to you with an offer, usually within 24 hours.
        </p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setSending(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/sell-your-car", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vin: vin.trim() || undefined,
          year: Number(year || fd.get("year")),
          make: make || String(fd.get("make") ?? ""),
          model: model || String(fd.get("model") ?? ""),
          trim: trim || String(fd.get("trim") ?? ""),
          mileage: Number(fd.get("mileage")),
          condition: String(fd.get("condition") ?? ""),
          askingPrice: fd.get("askingPrice") ? Number(fd.get("askingPrice")) : undefined,
          notes: String(fd.get("notes") ?? ""),
          name: String(fd.get("name") ?? ""),
          phone: String(fd.get("phone") ?? ""),
          email: String(fd.get("email") ?? ""),
          photos,
          website: String(fd.get("website") ?? ""),
          startedAt: startedAt.current,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error || "Something went wrong. Please try again or call us.");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again or call us at (630) 359-3643.");
    } finally {
      setSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-brand-gray-200 p-6 space-y-5">
      <h2 className="text-xl font-bold text-brand-gray-900">Tell Us About Your Vehicle</h2>

      {/* Honeypot — humans never see it */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      {/* VIN decode */}
      <div>
        <label htmlFor="trade-vin" className={labelCls}>VIN <span className="text-brand-gray-500 font-normal">(fastest way — we&apos;ll fill in the rest)</span></label>
        <div className="flex gap-2">
          <input id="trade-vin" value={vin} onChange={(e) => setVin(e.target.value.toUpperCase())} maxLength={17}
            className={`${inputCls} font-mono flex-1`} placeholder="17-character VIN (on the driver door jamb)" />
          <button type="button" onClick={decodeVin} disabled={decoding}
            className="shrink-0 bg-brand-gray-900 hover:bg-black text-white px-4 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
            {decoding ? "Decoding…" : "Decode"}
          </button>
        </div>
        {decodeMsg && <p className="mt-1 text-xs text-brand-gray-500">{decodeMsg}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="trade-year" className={labelCls}>Year <span className="text-brand-red">*</span></label>
          <input id="trade-year" name="year" type="number" required min="1980" max="2027" value={year}
            onChange={(e) => setYear(e.target.value)} className={inputCls} placeholder="2020" />
        </div>
        <div>
          <label htmlFor="trade-make" className={labelCls}>Make <span className="text-brand-red">*</span></label>
          <input id="trade-make" name="make" type="text" required value={make}
            onChange={(e) => setMake(e.target.value)} className={inputCls} placeholder="Honda" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="trade-model" className={labelCls}>Model <span className="text-brand-red">*</span></label>
          <input id="trade-model" name="model" type="text" required value={model}
            onChange={(e) => setModel(e.target.value)} className={inputCls} placeholder="Civic" />
        </div>
        <div>
          <label htmlFor="trade-trim" className={labelCls}>Trim</label>
          <input id="trade-trim" name="trim" type="text" value={trim}
            onChange={(e) => setTrim(e.target.value)} className={inputCls} placeholder="EX-L (optional)" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="trade-mileage" className={labelCls}>Mileage <span className="text-brand-red">*</span></label>
          <input id="trade-mileage" name="mileage" type="number" required className={inputCls} placeholder="85,000" />
        </div>
        <div>
          <label htmlFor="trade-condition" className={labelCls}>Condition <span className="text-brand-red">*</span></label>
          <select id="trade-condition" name="condition" required className={`${inputCls} bg-white`}>
            <option value="">Select</option>
            <option value="excellent">Excellent</option>
            <option value="good">Good</option>
            <option value="fair">Fair</option>
            <option value="poor">Poor</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="trade-asking" className={labelCls}>Asking Price <span className="text-brand-gray-500 font-normal">(optional)</span></label>
          <input id="trade-asking" name="askingPrice" type="number" min="0" className={inputCls} placeholder="$ what you'd like to get" />
        </div>
        <div>
          <label htmlFor="trade-notes" className={labelCls}>Anything we should know?</label>
          <input id="trade-notes" name="notes" type="text" className={inputCls} placeholder="Known issues, recent work, second key…" />
        </div>
      </div>

      {/* Photos */}
      <div>
        <label className={labelCls}>Photos <span className="text-brand-gray-500 font-normal">(optional, up to 6 — exterior, interior, dash)</span></label>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={(e) => addPhotos(e.target.files)}
          className="block w-full text-sm text-brand-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-brand-red file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-red-dark" />
        {photoErr && <p className="mt-1 text-xs text-brand-red">{photoErr}</p>}
        {photos.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <div key={i} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p} alt={`Photo ${i + 1}`} className="h-16 w-24 rounded-lg object-cover border border-brand-gray-200" />
                <button type="button" onClick={() => setPhotos((cur) => cur.filter((_, j) => j !== i))}
                  aria-label="Remove photo"
                  className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-brand-gray-900 text-white text-xs leading-none">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <hr className="border-brand-gray-100" />

      <h3 className="font-semibold text-brand-gray-900">Your Contact Info</h3>

      <div>
        <label htmlFor="trade-name" className={labelCls}>Full Name <span className="text-brand-red">*</span></label>
        <input id="trade-name" name="name" type="text" required className={inputCls} placeholder="Your full name" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="trade-phone" className={labelCls}>Phone <span className="text-brand-red">*</span></label>
          <input id="trade-phone" name="phone" type="tel" required className={inputCls} placeholder="(555) 123-4567" />
        </div>
        <div>
          <label htmlFor="trade-email" className={labelCls}>Email <span className="text-brand-red">*</span></label>
          <input id="trade-email" name="email" type="email" required className={inputCls} placeholder="you@email.com" />
        </div>
      </div>

      {error && (
        <p className="rounded-lg border border-brand-red/30 bg-brand-red/5 px-4 py-3 text-sm text-brand-red">{error}</p>
      )}

      <button type="submit" disabled={sending}
        className="w-full bg-brand-red hover:bg-brand-red-dark text-white py-3.5 rounded-xl font-semibold text-lg transition-colors disabled:opacity-60">
        {sending ? "Sending…" : "Get My Offer"}
      </button>
    </form>
  );
}
