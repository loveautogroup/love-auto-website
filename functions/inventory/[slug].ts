/**
 * Cloudflare Pages Function — /inventory/[slug]
 *
 * Intercepts every VDP request. Three outcomes depending on what the
 * static export and the live DMS know about the slug:
 *
 *   1. Static page exists (Next.js generateStaticParams pre-rendered it
 *      at build time) → pass straight through with HTTP 200.
 *
 *   2. No static page, but DMS has a vehicle whose slug matches and is
 *      AVAILABLE or COMING-SOON → render the bridge "Coming Soon /
 *      Available Now" page with HTTP 200. Happens when a vehicle moved
 *      between IN_RECON ↔ RETAIL_READY between CF Pages builds.
 *
 *   3. No static page, but DMS has a vehicle whose slug matches and is
 *      SOLD / WHOLESALE / ARCHIVED → render a "This vehicle has been
 *      sold" page with HTTP 410 Gone. 410 tells Google to deindex the
 *      URL permanently, which it does in days vs the months a 404 takes.
 *      Closes Search Console "Not found (404)" fix-failed loop reported
 *      2026-05-05 (Charlotte audit).
 *
 *   4. No static page AND DMS has no record of the slug at all → fall
 *      through to the static 404 page. Truly unknown URL.
 *
 * The slug matching logic mirrors src/lib/dmsInventory.ts via the shared
 * module shared/slug.ts so all three places (sitemap, inventory feed,
 * VDP bridge) compute the same slug for the same VIN.
 */

import { vehicleSlug, titleCase } from "../../shared/slug";

interface Env {
  INVENTORY?: KVNamespace;
}

const DMS_PUBLIC_URL =
  "https://dms.loveautogroup.net/api/v1/public/inventory";

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

/**
 * SOLD / WHOLESALE / ARCHIVED → render a "Gone" page and serve HTTP 410.
 * Google deindexes 410s far faster than 404s, which closes the "Not
 * found (404)" fix-failed loop in Search Console for vehicles that sold
 * after the last CF Pages build.
 */
function isGone(status: string | null | undefined): boolean {
  const s = (status ?? "").toLowerCase().trim();
  return (
    s === "sold" ||
    s === "wholesale" ||
    s === "archived"
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
  const available = isAvailable(v.status);
  const vehiclePhotoUrl =
    v.photos?.find((p) => p.isPrimary)?.url ?? v.photos?.[0]?.url ?? "";
  // For coming-soon / in-recon vehicles with no photos, use the branded
  // coming-soon placeholder rather than leaving the frame empty.
  const heroUrl = vehiclePhotoUrl
    ? vehiclePhotoUrl
    : available
    ? ""
    : "https://www.loveautogroup.net/images/coming-soon.png";
  const canonicalUrl = `https://www.loveautogroup.net/inventory/${slug}/`;

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
    .header { background: #fff; border-bottom: 1px solid #e5e5e5; padding: 0 1.5rem; }
    .header-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 64px; }
    .logo { font-size: 1.1rem; font-weight: 800; letter-spacing: -0.5px; color: #dc2626; }
    .logo span { color: #1a1a1a; }
    .back-link { font-size: 0.875rem; color: #666; display: flex; align-items: center; gap: 0.375rem; }
    .back-link:hover { color: #dc2626; }
    .main { max-width: 960px; margin: 2.5rem auto; padding: 0 1.5rem 4rem; }
    .card { background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .photo-wrap { position: relative; background: #1a1a1a; aspect-ratio: 16/9; overflow: hidden; }
    .photo-wrap img { width: 100%; height: 100%; object-fit: cover; opacity: 0.9; }
    .photo-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; min-height: 260px; }
    .photo-placeholder svg { width: 64px; height: 64px; color: #444; }
    .coming-soon-badge { position: absolute; top: 1rem; left: 1rem; background: rgba(0,0,0,0.7); color: #fff; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.08em; padding: 0.35rem 0.75rem; border-radius: 999px; backdrop-filter: blur(4px); }
    .info { padding: 2rem; }
    .vehicle-title { font-size: 1.75rem; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2; }
    .vehicle-sub { font-size: 1rem; color: #666; margin-top: 0.25rem; }
    .chips { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 1rem; }
    .chip { background: #f5f5f5; border-radius: 999px; padding: 0.3rem 0.75rem; font-size: 0.8125rem; color: #444; }
    .price { font-size: 2rem; font-weight: 800; color: #dc2626; margin-top: 1.5rem; }
    .cta-box { background: #fafafa; border: 1px solid #e5e5e5; border-radius: 12px; padding: 1.5rem; margin-top: 1.5rem; }
    .cta-title { font-size: 1rem; font-weight: 700; margin-bottom: 0.5rem; }
    .cta-body { font-size: 0.9rem; color: #555; margin-bottom: 1.25rem; line-height: 1.6; }
    .cta-buttons { display: flex; flex-wrap: wrap; gap: 0.75rem; }
    .btn { display: inline-flex; align-items: center; gap: 0.5rem; padding: 0.75rem 1.5rem; border-radius: 8px; font-size: 0.9rem; font-weight: 600; cursor: pointer; transition: opacity 0.15s; }
    .btn:hover { opacity: 0.85; }
    .btn-primary { background: #dc2626; color: #fff; }
    .btn-secondary { background: #fff; color: #1a1a1a; border: 1.5px solid #d4d4d4; }
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
        ${heroUrl ? `<img src="${heroUrl}" alt="${title}" loading="eager" />` : `<div class="photo-placeholder"><svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5z"/></svg></div>`}
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
            ${available ? `This ${v.year} ${make} ${model} is available now on our lot in Villa Park, IL. Call or text us to schedule a test drive.` : `We're finishing up reconditioning on this ${v.year} ${make} ${model}. Contact us to get first dibs — we'll reach out the moment it's lot-ready.`}
          </p>
          <div class="cta-buttons">
            <a class="btn btn-primary" href="tel:+16303593643">Call (630) 359-3643</a>
            <a class="btn btn-secondary" href="/inventory/">Browse available inventory</a>
          </div>
        </div>
      </div>
    </div>
    <p class="footer-note">Love Auto Group · 735 N Yale Ave, Villa Park, IL 60181 · <a href="tel:+16303593643">(630) 359-3643</a></p>
  </main>
</body>
</html>`;
}

/**
 * "This vehicle has been sold" page. Returned with HTTP 410 Gone so
 * Google deindexes the URL on its next crawl (days, not months).
 *
 * Canonical points at /inventory/ (not at the slug itself) — we don't
 * want Google to keep treating the gone URL as canonical for anything.
 */
function renderGonePage(v: DmsVehicle): string {
  const make = titleCase(v.make ?? "");
  const model = titleCase(v.model ?? "");
  const trim = v.trim ? titleCase(v.trim) : "";
  const title = `${v.year} ${make} ${model}${trim ? " " + trim : ""}`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title} has been sold | Love Auto Group</title>
  <meta name="description" content="This ${title} is no longer available. Browse our current inventory of quality used cars in Villa Park, IL." />
  <meta name="robots" content="noindex, follow" />
  <link rel="canonical" href="https://www.loveautogroup.net/inventory/" />
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f5f5; color: #1a1a1a; min-height: 100vh; display: flex; flex-direction: column; }
    a { color: inherit; text-decoration: none; }
    .header { background: #fff; border-bottom: 1px solid #e5e5e5; padding: 0 1.5rem; }
    .header-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; height: 64px; }
    .logo { font-size: 1.1rem; font-weight: 800; letter-spacing: -0.5px; color: #dc2626; }
    .logo span { color: #1a1a1a; }
    .main { flex: 1; max-width: 720px; margin: 4rem auto; padding: 0 1.5rem 4rem; text-align: center; }
    .badge { display: inline-block; background: #1a1a1a; color: #fff; font-size: 0.75rem; font-weight: 700; letter-spacing: 0.1em; padding: 0.4rem 0.9rem; border-radius: 999px; margin-bottom: 1.5rem; }
    h1 { font-size: 2rem; font-weight: 800; letter-spacing: -0.5px; line-height: 1.2; margin-bottom: 0.75rem; }
    .lede { font-size: 1.05rem; color: #555; margin-bottom: 2.5rem; line-height: 1.6; }
    .ctas { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; }
    .btn { display: inline-flex; align-items: center; padding: 0.85rem 1.75rem; border-radius: 8px; font-size: 0.95rem; font-weight: 600; transition: opacity 0.15s; }
    .btn:hover { opacity: 0.85; }
    .btn-primary { background: #dc2626; color: #fff; }
    .btn-secondary { background: #fff; color: #1a1a1a; border: 1.5px solid #d4d4d4; }
    .footer-note { font-size: 0.8125rem; color: #888; text-align: center; padding-bottom: 2rem; }
    @media (max-width: 640px) { h1 { font-size: 1.5rem; } .lede { font-size: 0.95rem; } .ctas { flex-direction: column; } .btn { justify-content: center; } }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-inner">
      <a class="logo" href="/">LOVE <span>AUTO GROUP</span></a>
      <a href="/inventory/" style="font-size: 0.875rem; color: #666;">Browse inventory →</a>
    </div>
  </header>
  <main class="main">
    <span class="badge">SOLD</span>
    <h1>This ${title} found its new owner.</h1>
    <p class="lede">
      The vehicle that lived at this URL has been sold. We move fast on quality
      Japanese used cars — but there's a great chance we have something else
      that fits what you were looking for.
    </p>
    <div class="ctas">
      <a class="btn btn-primary" href="/inventory/">Browse current inventory</a>
      <a class="btn btn-secondary" href="tel:+16303593643">Call (630) 359-3643</a>
    </div>
  </main>
  <p class="footer-note">Love Auto Group · 735 N Yale Ave, Villa Park, IL 60181</p>
</body>
</html>`;
}

export const onRequest: PagesFunction<Env> = async (context) => {
  // Try the static pre-rendered page first. If the build included this slug
  // (vehicle was IN_RECON or RETAIL_READY at build time), this returns 200
  // and we're done.
  const staticResponse = await context.next();
  if (staticResponse.status !== 404) return staticResponse;

  // Static page not found — vehicle moved between statuses after the last
  // build, or is gone entirely. Fetch live DMS data and decide.
  const slug = (context.params as Record<string, string>).slug as string;
  if (!slug) return staticResponse;

  try {
    const res = await fetch(DMS_PUBLIC_URL, {
      headers: { Accept: "application/json" },
      cf: { cacheTtl: 30, cacheEverything: false },
    });
    if (!res.ok) return staticResponse;

    const json = (await res.json()) as { data?: DmsVehicle[] };
    const vehicles = Array.isArray(json.data) ? json.data : [];

    // Find the vehicle whose computed slug matches the requested slug.
    // Uses the SHARED vehicleSlug() so this matches what the sitemap and
    // generateStaticParams emit — no slug drift between modules.
    const match = vehicles.find((v) => vehicleSlug(v) === slug);
    if (!match) return staticResponse; // Truly unknown — serve 404

    // Available or coming-soon — render the bridge page with HTTP 200.
    if (isComingSoon(match.status) || isAvailable(match.status)) {
      const html = renderComingSoonPage(match, slug);
      return new Response(html, {
        status: 200,
        headers: {
          "Content-Type": "text/html;charset=UTF-8",
          // Short cache so the page updates when the vehicle goes
          // retail-ready or, eventually, sold.
          "Cache-Control": "public, max-age=60, s-maxage=60",
        },
      });
    }

    // Sold / wholesale / archived — return HTTP 410 Gone.
    // Google deindexes 410s in days vs months for 404s. Closes the
    // "Not found (404)" fix-failed loop reported in Search Console
    // (Charlotte audit 2026-05-07).
    if (isGone(match.status)) {
      const html = renderGonePage(match);
      return new Response(html, {
        status: 410,
        headers: {
          "Content-Type": "text/html;charset=UTF-8",
          // Short edge cache so a vehicle that comes back (rare) refreshes
          // quickly. noindex meta + 410 status do the deindex work — the
          // cache is just here to keep upstream load low.
          "Cache-Control": "public, max-age=300, s-maxage=300",
          "X-Robots-Tag": "noindex, follow",
        },
      });
    }

    // Unknown status that isn't available/coming-soon/gone (shouldn't
    // happen — DMS public feed only emits the canonical statuses — but
    // belt-and-suspenders fall through to the static 404).
    return staticResponse;
  } catch {
    // DMS unreachable — fall through to the static 404
    return staticResponse;
  }
};
