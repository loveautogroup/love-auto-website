/**
 * Cloudflare Pages Function — /inventory/[slug]
 *
 * Intercepts every VDP request. On a cache-hit static page (pre-rendered by
 * Next.js generateStaticParams), passes straight through. On a 404 — which
 * happens when a vehicle moved to IN_RECON between CF Pages builds — fetches
 * the vehicle from the DMS public inventory API and renders a lightweight
 * "Coming Soon" page so the user never sees a blank 404.
 *
 * The slug matching logic mirrors src/lib/dmsInventory.ts adaptDmsVehicle so
 * slugs are always computed the same way in both places.
 */

interface Env {
  INVENTORY?: KVNamespace;
}

const DMS_PUBLIC_URL =
  "https://dms.loveautogroup.net/api/v1/public/inventory";

const SEED_SLUGS_BY_VIN: Record<string, string> = {
  "1FA6P8TH6H5202495": "2017-ford-mustang-ecoboost-premium-11331",
  "2HNYD2H63AH509874": "2010-acura-mdx-sport-11318",
  "2GKALUEK6D6300009": "2013-gmc-terrain-slt-11316",
  "KMHCT4AE6HU222547": "2017-hyundai-accent-se-11313",
  "JTHHE5BC2G5011456": "2016-lexus-rc-350-11266",
  "JF2SJAGC1HH553881": "2017-subaru-forester-premium-11340",
};

function titleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/(\s+|-)/)
    .map((part) => {
      if (/^\s+$/.test(part) || part === "-") return part;
      if (!part) return part;
      return part.charAt(0).toUpperCase() + part.slice(1);
    })
    .join("");
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface DmsVehicle {
  id: string | number;
  vin: string;
  stockNumber?: string;
  year: number;
  make: string;
  model: string;
  trim?: string | null;
  mileage?: number | null;
  retailPrice?: number | null;
  exteriorColor?: string | null;
  status?: string | null;
  photos?: Array<{ url: string; isPrimary?: boolean }> | null;
  description?: string | null;
}

function vehicleSlug(v: DmsVehicle): string {
  const make = titleCase(v.make ?? "");
  const model = titleCase(v.model ?? "");
  const trim = v.trim ? titleCase(v.trim) : "";
  const stockNumber = v.stockNumber ? String(v.stockNumber) : "";
  const idForSlug =
    stockNumber || String(v.id ?? "").trim() || v.vin.slice(-6);
  const autoSlug = slugify(
    `${v.year}-${slugify(make)}-${slugify(model)}${
      trim ? "-" + slugify(trim) : ""
    }-${slugify(idForSlug)}`
  );
  return SEED_SLUGS_BY_VIN[v.vin] ?? autoSlug;
}

function isComingSoon(status: string | null | undefined): boolean {
  const s = (status ?? "").toLowerCase().trim();
  return (
    s === "coming soon" ||
    s === "coming-soon" ||
    s === "in_recon" ||
    s === "in recon"
  );
}

function isAvailable(status: string | null | undefined): boolean {
  const s = (status ?? "").toLowerCase().trim();
  return (
    s === "available" ||
    s === "retail_ready" ||
    s === "listed" ||
    s === "sale pending" ||
    s === "deal_pending"
  );
}

function formatCurrency(n: number | null | undefined): string {
  if (!n || n === 0) return "Call for price";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function renderComingSoonPage(v: DmsVehicle, slug: string): string {
  const make = titleCase(v.make ?? "");
  const model = titleCase(v.model ?? "");
  const trim = v.trim ? titleCase(v.trim) : "";
  const title = `${v.year} ${make} ${model}${trim ? " " + trim : ""}`;
  const price = formatCurrency(v.retailPrice);
  const mileage = v.mileage
    ? new Intl.NumberFormat("en-US").format(v.mileage) + " mi"
    : "";
  const color = v.exteriorColor ?? "";
  const heroUrl =
    v.photos?.find((p) => p.isPrimary)?.url ?? v.photos?.[0]?.url ?? "";
  const canonicalUrl = `https://www.loveautogroup.net/inventory/${slug}/`;
  const available = isAvailable(v.status);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} — Coming Soon | Love Auto Group</title>
  <meta name="description" content="${title} coming soon to Love Auto Group in Villa Park, IL. Contact us to get notified when this vehicle is ready." />
  <link rel="canonical" href="${canonicalUrl}" />
  <meta property="og:title" content="${title} — Coming Soon | Love Auto Group" />
  <meta property="og:description" content="This vehicle is currently in reconditioning and will be available soon. Contact us to get notified." />
  <meta property="og:type" content="website" />
  ${heroUrl ? `<meta property="og:image" content="${heroUrl}" />` : ""}
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f5f5; color: #1a1a1a; }
    a { color: inherit; text-decoration: none; }

    /* Header */
    .header { background: #fff; border-bottom: 1px solid #e5e5e5; padding: 0 1.5rem; }
    .header-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 64px; }
    .logo { font-size: 1.1rem; font-weight: 800; letter-spacing: -0.5px; color: #dc2626; }
    .logo span { color: #1a1a1a; }
    .back-link { font-size: 0.875rem; color: #666; display: flex; align-items: center; gap: 0.375rem; }
    .back-link:hover { color: #dc2626; }

    /* Main */
    .main { max-width: 960px; margin: 2.5rem auto; padding: 0 1.5rem 4rem; }

    /* Card */
    .card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }

    /* Photo */
    .photo-wrap { position: relative; background: #1a1a1a; aspect-ratio: 16/9; overflow: hidden; }
    .photo-wrap img { width: 100%; height: 100%; object-fit: cover; opacity: 0.9; }
    .photo-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; min-height: 260px; }
    .photo-placeholder svg { width: 64px; height: 64px; color: #444; }
    .coming-soon-badge { position: absolute; top: 1rem; left: 1rem; background: rgba(0,0,0,0.7); color: #fff; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; padding: 0.35rem 0.75rem; border-radius: 999px; backdrop-filter: blur(4px); }

    /* Info */
    .info { padding: 2rem; }
    .vehicle-title { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2; }
    .vehicle-sub { font-size: 1rem; color: #666; margin-top: 0.25rem; }
    .chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
    .chip { background: #f5f5f5; border-radius: 999px; padding: 0.3rem 0.75rem; font-size: 0.8125rem; color: #444; }
    .price { font-size: 2rem; font-weight: 800; color: #dc2626; margin-top: 1.5rem; }

    /* CTA */
    .cta-box { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; padding: 1.5rem; margin-top: 1.5rem; }
    .cta-title { font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; }
    .cta-body { font-size: 0.9rem; color: #555; margin-bottom: 1.25rem; line-height: 1.6; }
    .cta-buttons { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
    .btn:hover { opacity: 0.85; }
    .btn-primary { background: #dc2626; color: #fff; }
    .btn-secondary { background: #fff; color: #1a1a1a; border: 1.5px solid #d4d4d4; }

    /* Footer note */
    .footer-note { margin-top: 2rem; font-size: 0.8125rem; color: #888; text-align: center; }

    @media (max-width: 640px) {
      .vehicle-title { font-size: 1.35rem; }
      .price { font-size: 1.6rem; }
      .info { padding: 1.25rem; }
      .cta-buttons { flex-direction: column; }
      .btn { justify-content: center; }
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-inner">
      <a class="logo" href="/">LOVE <span>AUTO GROUP</span></a>
      <a class="back-link" href="/inventory/">
        <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
        All inventory
      </a>
    </div>
  </header>

  <main class="main">
    <div class="card">
      <div class="photo-wrap">
        ${
          heroUrl
            ? `<img src="${heroUrl}" alt="${title}" loading="eager" />`
            : `<div class="photo-placeholder"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"/></svg></div>`
        }
        <span class="coming-soon-badge">${available ? "AVAILABLE NOW" : "COMING SOON"}</span>
      </div>

      <div class="info">
        <h1 class="vehicle-title">${title}</h1>
        ${trim ? `<p class="vehicle-sub">${trim}</p>` : ""}

        <div class="chips">
          ${mileage ? `<span class="chip">${mileage}</span>` : ""}
          ${color ? `<span class="chip">${color}</span>` : ""}
          <span class="chip">${available ? "Available" : "In Reconditioning"}</span>
        </div>

        <p class="price">${price}</p>

        <div class="cta-box">
          <p class="cta-title">${available ? "Ready to make a deal?" : "This vehicle is being prepared for sale"}</p>
          <p class="cta-body">
            ${available
              ? `This ${v.year} ${make} ${model} is available now on our lot in Villa Park, IL. Call or text us to schedule a test drive.`
              : `We're finishing up reconditioning on this ${v.year} ${make} ${model}. Contact us to get first dibs — we'll reach out the moment it's lot-ready.`
            }
          </p>
          <div class="cta-buttons">
            <a class="btn btn-primary" href="tel:+16303593643">
              <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"/></svg>
              Call (630) 359-3643
            </a>
            <a class="btn btn-secondary" href="/inventory/">
              Browse available inventory
            </a>
          </div>
        </div>
      </div>
    </div>

    <p class="footer-note">
      Love Auto Group · 735 N Yale Ave, Villa Park, IL 60181 ·
      <a href="tel:+16303593643">(630) 359-3643</a>
    </p>
  </main>
</body>
</html>`;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  // Try the static pre-rendered page first. If the build included this slug
  // (vehicle was IN_RECON at build time), this returns 200 and we're done.
  const staticResponse = await context.next();
  if (staticResponse.status !== 404) return staticResponse;

  // Static page not found — vehicle likely moved to IN_RECON after the last
  // build. Fetch live DMS data and render a Coming Soon page.
  const slug = (context.params as Record<string, string>).slug as string;
  if (!slug) return staticResponse;

  try {
    const res = await fetch(DMS_PUBLIC_URL, {
      headers: { Accept: "application/json" },
      // Workers fetch: no Next.js cache semantics, standard Cache-Control.
      cf: { cacheTtl: 30, cacheEverything: false },
    });
    if (!res.ok) return staticResponse;

    const json = (await res.json()) as { data?: DmsVehicle[] };
    const vehicles = Array.isArray(json.data) ? json.data : [];

    // Find the vehicle whose computed slug matches the requested slug.
    const match = vehicles.find((v) => vehicleSlug(v) === slug);
    if (!match) return staticResponse; // Truly doesn't exist — serve 404

    // Render a bridge page for any vehi