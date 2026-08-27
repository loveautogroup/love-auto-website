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
import { displayCase, dedupeTrim } from "../../shared/displayCase";
import { escapeHtml, escapeUrl } from "../../shared/escapeHtml";
import { rewritePhotoHost } from "../../shared/photoHost";

const DMS_PUBLIC_URL =
  "https://dms.loveautogroup.net/api/v1/public/inventory";

/**
 * Slugs of vehicles that have permanently left the public feed (Sold /
 * Archived / Arbitration Return), computed with the SAME slug function the
 * live feed uses. 1,163 of them as of 2026-08-11.
 *
 * This is why the 410 path below can fire at all. The live inventory feed
 * was narrowed to Available / Sale Pending after this Function was written
 * (see the route comment in love-auto-dms: "sold/recon/acquired vehicles
 * are never included in this response"), which quietly made `isGone()`
 * unreachable — a sold car simply vanished from the feed, `match` came back
 * undefined, and the request fell through to a plain 404. Consulting the
 * retired list on a miss is what restores the deindex behavior.
 *
 * Railway already excludes any retired slug that collides with a currently
 * live vehicle, and we only reach this lookup when the live feed had no
 * match, so a for-sale car can never be served a Gone page.
 */
const RETIRED_SLUGS_URL =
  "https://dms.loveautogroup.net/api/v1/public/retired-slugs";

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
/**
 * Sold specifically — as opposed to archived / wholesale / arbitration return.
 * A sold car in the live feed is inside Railway's recently-sold window and has
 * its own static page; the others never appear in the feed at all.
 */
function isSold(status: string | null | undefined): boolean {
  return (status ?? "").toLowerCase().trim() === "sold";
}

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
  // Was maximumFractionDigits:0 with no floor, so $13,999.99 rendered as
  // "$14,000" — a HIGHER price than we charge, on the server-rendered VDP
  // that crawlers and social unfurls read. Now exact.
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Math.round(n * 100) % 100 !== 0 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(n);
}

/**
 * Every DMS-sourced value below is escaped HERE, at the point it's derived,
 * rather than at each of the ~15 places it gets interpolated further down —
 * so a new reference in the template can't silently reintroduce the gap.
 * `title` is assembled from already-escaped parts and must NOT be escaped
 * again. Numeric values (price, mileage) are formatter output and safe.
 */
function renderComingSoonPage(v: DmsVehicle, slug: string): string {
  const make = escapeHtml(titleCase(v.make ?? ""));
  const model = escapeHtml(titleCase(v.model ?? ""));
  const trim = v.trim ? escapeHtml(titleCase(v.trim)) : "";
  const title = `${escapeHtml(v.year)} ${make} ${model}${trim ? " " + trim : ""}`;
  const price = formatCurrency(v.retailPrice);
  const mileage = v.mileage
    ? new Intl.NumberFormat("en-US").format(v.mileage) + " mi"
    : "";
  const color = escapeHtml(v.exteriorColor ?? "");
  const available = isAvailable(v.status);
  // Found in the website audit: rendered the raw r2.dev URL directly —
  // the same rate-limited host already rewritten away from everywhere
  // else photos are served.
  const vehiclePhotoUrl = escapeUrl(
    rewritePhotoHost(v.photos?.find((p) => p.isPrimary)?.url ?? v.photos?.[0]?.url) ?? ""
  );
  // For coming-soon / in-recon vehicles with no photos, use the branded
  // coming-soon placeholder rather than leaving the frame empty.
  const heroUrl = vehiclePhotoUrl
    ? vehiclePhotoUrl
    : available
    ? ""
    : "https://www.loveautogroup.net/images/coming-soon.png";
  // `slug` reaches here only after matching a DMS-computed vehicleSlug(),
  // so it can't carry arbitrary request input — escaped anyway, since that
  // invariant lives in the caller and could be relaxed later.
  const canonicalUrl = `https://www.loveautogroup.net/inventory/${escapeHtml(slug)}/`;

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

/** Escaped "2016 Lincoln MKX Reserve" display name from a DMS record. */
function escapedVehicleTitle(v: DmsVehicle): string {
  // displayCase, not titleCase: titleCase renders "SLK350" as "Slk350" and
  // "CX-3" as "Cx-3". Same helper the inventory grid uses, so a car is named
  // the same way wherever it appears.
  const make = escapeHtml(displayCase(v.make ?? ""));
  const model = escapeHtml(displayCase(v.model ?? ""));
  // dedupeTrim for the same reason functions/api/inventory.ts uses it: DC
  // repeats the model inside the trim ("Boxster" + "Boxster S").
  const trim = v.trim ? escapeHtml(dedupeTrim(displayCase(v.model ?? ""), displayCase(v.trim))) : "";
  return `${escapeHtml(v.year)} ${make} ${model}${trim ? " " + trim : ""}`;
}

/**
 * "This vehicle is no longer available" page. Returned with HTTP 410 Gone
 * so Google deindexes the URL on its next crawl (days, not months).
 *
 * Canonical points at /inventory/ (not at the slug itself) — we don't
 * want Google to keep treating the gone URL as canonical for anything.
 *
 * `hidden` distinguishes "pulled from the site" (DMS "Hide from site"
 * toggle — status unknown, could still be on the lot) from a genuine sale
 * — the copy shouldn't claim "sold" for a car that was simply hidden. It
 * also covers Arbitration Return, where "found its new owner" would be
 * flatly untrue.
 *
 * `title` is an ALREADY-ESCAPED display name, or null when we only know
 * the slug is retired and not what car it was. The retired-slugs endpoint
 * returns slug/stock/status only, and reconstructing "2014 Lexus ES 350"
 * from "2014-lexus-es-350-11428" reliably is not possible — titleCase
 * renders it "Es 350". Generic copy beats a mangled model name.
 */
/**
 * Pick vehicles to offer someone who just landed on a car that is gone.
 *
 * Ranked, because a Subaru buyer wants another Subaru far more than they want
 * the cheapest thing on the lot:
 *   1. same make          — this lot is a Japanese-makes specialist
 *   2. similar price      — within 30% either way
 *   3. anything available — better than an empty page
 *
 * Availability is the hard filter: never offer a car that is itself sold or
 * coming-soon. That is the whole failure this page exists to avoid.
 */
export function pickSimilar(
  all: DmsVehicle[],
  gone: { make?: string | null; retailPrice?: number | null } | null,
  limit = 3,
): DmsVehicle[] {
  const available = all.filter((v) => isAvailable(v.status));
  if (available.length === 0) return [];

  const wantMake = (gone?.make ?? "").trim().toLowerCase();
  const wantPrice =
    typeof gone?.retailPrice === "number" && gone.retailPrice > 0 ? gone.retailPrice : null;

  const scored = available.map((v) => {
    const sameMake = wantMake && (v.make ?? "").trim().toLowerCase() === wantMake ? 1 : 0;
    const price = typeof v.retailPrice === "number" ? v.retailPrice : null;
    const closePrice =
      wantPrice && price && Math.abs(price - wantPrice) <= wantPrice * 0.3 ? 1 : 0;
    return { v, score: sameMake * 2 + closePrice };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.v);
}

/** One card in the "what we do have" row. */
export function renderSimilarCard(v: DmsVehicle): string {
  // escapeUrl only passes http(s) or ROOT-RELATIVE values — a bare slug
  // fragment comes back as "" and yields href="/inventory//". Build the whole
  // path, then escape it.
  const href = `/inventory/${vehicleSlug(v)}/`;
  const name = escapedVehicleTitle(v);
  const price = formatCurrency(typeof v.retailPrice === "number" ? v.retailPrice : null);
  // photos is Array<{url, isPrimary?}> — NOT string[]. Passing the object
  // straight to rewritePhotoHost renders src="[object Object]".
  const rawPhoto =
    v.photos?.find((ph) => ph?.isPrimary)?.url ?? v.photos?.[0]?.url ?? "";
  const photo = rawPhoto ? rewritePhotoHost(rawPhoto) : "";
  const miles =
    typeof v.mileage === "number" && v.mileage > 0
      ? `${v.mileage.toLocaleString("en-US")} mi`
      : "";
  const media = photo
    ? `<img src="${escapeUrl(photo)}" alt="${name}" loading="lazy" />`
    : `<div class="sim-nophoto">Photos coming soon</div>`;
  return `
      <a class="sim-card" href="${escapeUrl(href)}">
        <div class="sim-photo">${media}</div>
        <div class="sim-body">
          <div class="sim-name">${name}</div>
          <div class="sim-meta">${miles}</div>
          <div class="sim-price">${price}</div>
        </div>
      </a>`;
}

export function renderGonePage(opts: {
  title?: string | null;
  hidden?: boolean;
  /** Cars we actually have, already filtered to available. */
  similar?: DmsVehicle[];
}): string {
  const title = opts.title ?? null;
  const hidden = opts.hidden ?? false;
  const similar = opts.similar ?? [];
  const badgeText = hidden ? "NO LONGER LISTED" : "SOLD";
  const pageTitle = title
    ? `${title}${hidden ? " is no longer listed" : " has been sold"} | Love Auto Group`
    : `${hidden ? "Vehicle no longer listed" : "Vehicle has been sold"} | Love Auto Group`;
  const metaDescription = title
    ? `This ${title} is no longer available. Browse our current inventory of quality used cars in Villa Park, IL.`
    : "This vehicle is no longer available. Browse our current inventory of quality used cars in Villa Park, IL.";
  const heading = hidden
    ? `This ${title ?? "vehicle"} is no longer listed.`
    : `This ${title ?? "vehicle"} found its new owner.`;
  const lede = hidden
    ? "This vehicle is no longer available on our site. There's a great chance we have something else that fits what you were looking for."
    : "The vehicle that lived at this URL has been sold. We move fast on quality used cars — but there's a great chance we have something else that fits what you were looking for.";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${pageTitle}</title>
  <meta name="description" content="${metaDescription}" />
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
    .sim { max-width: 1100px; margin: 3.5rem auto 0; padding: 0 1.5rem; }
    .sim-head { font-size: 1.05rem; font-weight: 700; color: #1a1a1a; margin-bottom: 0.35rem; }
    .sim-sub { font-size: 0.875rem; color: #666; margin-bottom: 1.5rem; }
    .sim-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; }
    .sim-card { background: #fff; border: 1px solid #e5e5e5; border-radius: 10px; overflow: hidden; text-align: left; transition: box-shadow 0.15s, transform 0.15s; display: block; }
    .sim-card:hover { box-shadow: 0 6px 20px rgba(0,0,0,0.09); transform: translateY(-2px); }
    .sim-photo { aspect-ratio: 3 / 2; background: #eee; overflow: hidden; }
    .sim-photo img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .sim-nophoto { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 0.8125rem; color: #999; }
    .sim-body { padding: 0.9rem 1rem 1.1rem; }
    .sim-name { font-size: 0.95rem; font-weight: 700; line-height: 1.3; margin-bottom: 0.25rem; }
    .sim-meta { font-size: 0.8125rem; color: #777; margin-bottom: 0.5rem; min-height: 1em; }
    .sim-price { font-size: 1.05rem; font-weight: 800; color: #dc2626; }
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
    <span class="badge">${badgeText}</span>
    <h1>${heading}</h1>
    <p class="lede">${lede}</p>
    <div class="ctas">
      <a class="btn btn-primary" href="/inventory/">Browse current inventory</a>
      <a class="btn btn-secondary" href="tel:+16303593643">Call (630) 359-3643</a>
    </div>
${
    similar.length > 0
      ? `<section class="sim">
      <div class="sim-head">Here&#39;s what we have right now</div>
      <div class="sim-sub">Hand-picked from our current lot in Villa Park.</div>
      <div class="sim-grid">${similar.map(renderSimilarCard).join("")}</div>
    </section>`
      : ""
  }
  </main>
  <p class="footer-note">Love Auto Group · 735 N Yale Ave, Villa Park, IL 60181</p>
</body>
</html>`;
}

interface Env {
  /** KV namespace binding configured in wrangler.jsonc — same binding
   *  functions/api/merchandising.ts reads. */
  MERCHANDISING: KVNamespace;
}

const MERCH_CONFIG_KEY = "config:v1";

export const onRequest: PagesFunction<Env> = async (context) => {
  const staticResponse = await context.next();
  const slug = (context.params as Record<string, string>).slug as string;
  if (!slug) return staticResponse;

  // Pass redirects straight through, untouched.
  //
  // next.config.ts sets `trailingSlash: true`, so a request to
  // /inventory/<slug> (no slash) gets a 308 to /inventory/<slug>/ from the
  // static handler. Without this guard that 308 would fall through to the
  // logic below: `isRealStaticPage` stays false on a non-200, the live feed
  // matches, and we'd answer the no-slash URL with a 200 bridge page —
  // publishing the same vehicle at two URLs and destroying the canonical
  // form. That is the exact trailing-slash regression that took /inventory,
  // /reviews and the brand pages out of Google for hours on 2026-04-30.
  // It has never bitten in production only because this Function was not
  // routed until 2026-08-11; enabling the route without this guard would
  // have shipped it.
  if (staticResponse.status >= 300 && staticResponse.status < 400) {
    return staticResponse;
  }

  // A genuine pre-rendered VDP for this slug (as opposed to a 404 or a
  // 200-status not-found placeholder). Guard: when Railway hibernates
  // during a CF Pages build, Next.js can't resolve live-only vehicles and
  // calls notFound() — which generates a static file served as HTTP 200
  // (it IS a file, just the not-found page). Next.js embeds the string
  // "NEXT_HTTP_ERROR_FALLBACK;404" in the RSC payload of every not-found
  // page. Real VDPs never contain it. Use that as the signal.
  let isRealStaticPage = false;
  if (staticResponse.status === 200) {
    const body = await staticResponse.clone().text();
    isRealStaticPage = !body.includes("NEXT_HTTP_ERROR_FALLBACK");
  }

  // Found in the website audit: this used to return a genuine static page
  // immediately, without ever checking DMS — so a vehicle that sold (or
  // was hidden) after the page was last built kept showing full price,
  // photos, and live CTAs, with no way to ever change, until the next full
  // site rebuild happened to regenerate that one page. Now every request
  // checks DMS's live status AND the KV "hidden" overlay (both edge-cached
  // 30s, so the added upstream load is small) and overrides a stale static
  // page the moment either says the car is off the site — no rebuild
  // needed to detect a sale or a hide, and none needed to undo one either.
  try {
    const [res, hiddenVins] = await Promise.all([
      fetch(DMS_PUBLIC_URL, {
        headers: { Accept: "application/json" },
        cf: { cacheTtl: 30, cacheEverything: false },
      }),
      fetchHiddenVins(context.env),
    ]);
    if (!res.ok) return staticResponse;

    // The Railway public inventory endpoint returns a plain array at the
    // top level (not { data: [...] }). Handle both shapes defensively so
    // a future API refactor doesn't silently break the bridge again.
    const raw = (await res.json()) as DmsVehicle[] | { data?: DmsVehicle[] };
    const vehicles: DmsVehicle[] = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as { data?: DmsVehicle[] }).data)
      ? (raw as { data: DmsVehicle[] }).data
      : [];

    // Find the vehicle whose computed slug matches the requested slug.
    // Uses the SHARED vehicleSlug() so this matches what the sitemap and
    // generateStaticParams emit — no slug drift between modules.
    const match = vehicles.find((v) => vehicleSlug(v) === slug);
    if (!match) {
      // Not in the live feed. Before falling back, ask whether this slug
      // is one the dealership has RETIRED — sold, archived, or returned to
      // the auction. Those are the URLs Google keeps re-crawling and
      // re-reporting as "Not found (404)", and a 404 takes months to clear
      // where a 410 clears in days.
      //
      // This also overrides a STALE static page: a car that sold after the
      // last CF Pages build still has its pre-rendered VDP on disk, showing
      // a live price and working CTAs. Retired wins over the static file.
      const retired = await fetchRetiredVehicle(slug);
      const retiredStatus = retired?.status ?? null;
      if (retiredStatus) {
        const html = renderGonePage({
          title: retiredTitle(retired),
          // Only a genuine sale gets the "found its new owner" copy.
          // Archived and Arbitration Return get the neutral wording.
          hidden: retiredStatus.trim().toLowerCase() !== "sold",
          // Someone followed a link to a car that is gone. Offering what we
          // DO have is the difference between a dead end and a sale.
          similar: pickSimilar(vehicles, {
            make: retired?.make ?? null,
            retailPrice: null,
          }),
        });
        return new Response(html, {
          status: 410,
          headers: {
            "Content-Type": "text/html;charset=UTF-8",
            "Cache-Control": "public, max-age=300, s-maxage=300",
            "X-Robots-Tag": "noindex, follow",
          },
        });
      }
      // Genuinely unknown. If a real static page still exists, prefer it
      // (DMS may just be between syncs) — otherwise serve the static 404.
      return staticResponse;
    }

    const hidden = hiddenVins.has(match.vin.toUpperCase());

    // Hidden via the DMS "Hide from site" toggle, or gone for good — override
    // even a genuine static page. HTTP 410 so Google deindexes in days rather
    // than months. Closes the "Not found (404)" fix-failed loop reported in
    // Search Console (Charlotte audit 2026-05-07).
    //
    // ⚠️ A car that is IN THIS FEED and sold is RECENTLY sold — Railway only
    // emits sold rows inside its 30-day window — and it has a real static VDP
    // built for it on purpose (Jeremiah, 2026-08-25). Serving it a Gone page
    // here would delete the page we just built. Older sales are not in the
    // feed at all and still 410 via the retired-slugs branch above, which is
    // the path that does the deindexing.
    const recentlySold = isSold(match.status);
    if ((isGone(match.status) && !recentlySold) || hidden) {
      const html = renderGonePage({
        title: escapedVehicleTitle(match),
        hidden: hidden && !isGone(match.status),
        // Same reasoning as the retired-slug branch: offer what we have
        // rather than ending the visit. `match` is excluded by pickSimilar's
        // availability filter, so a sold car never recommends itself.
        similar: pickSimilar(vehicles, {
          make: match.make ?? null,
          retailPrice: typeof match.retailPrice === "number" ? match.retailPrice : null,
        }),
      });
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

    // Still good — prefer the real static page when one exists.
    if (isRealStaticPage) return staticResponse;

    // Available or coming-soon with no static page yet — render the
    // bridge page with HTTP 200.
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

    // Unknown status that isn't available/coming-soon/gone (shouldn't
    // happen — DMS public feed only emits the canonical statuses — but
    // belt-and-suspenders fall through to the static response).
    return staticResponse;
  } catch {
    // DMS/KV unreachable — fall through to whatever the static build has.
    return staticResponse;
  }
};

/**
 * Is this slug a retired vehicle, and with what status? Returns the status
 * string ("Sold" / "Archived" / "Arbitration Return") or null when the slug
 * isn't retired, doesn't look like a vehicle slug, or the lookup fails.
 *
 * Best-effort by design: null means "don't claim it's gone," so a DMS
 * outage degrades to today's behavior (static page or 404) rather than
 * telling a shopper a car for sale has been sold.
 *
 * The list is ~1,163 entries and grows by one per sale, so it is fetched
 * only on a live-feed miss and held in the edge cache for 5 minutes. The
 * digit-suffix test keeps the non-vehicle pages under /inventory/ — the
 * brand hubs like /inventory/used-lexus/ — from spending a fetch at all;
 * every real and retired vehicle slug ends in its stock number.
 */
interface RetiredRow {
  slug?: string;
  status?: string | null;
  year?: number | null;
  make?: string | null;
  model?: string | null;
  trim?: string | null;
}

/**
 * Look a retired slug up. Returns the status AND enough identity to name the
 * car — the endpoint used to hand back slug/stock/status only, so this page
 * could not say WHICH car had sold and fell back to generic copy.
 * (PARITY CHAIN: Railway routers/public.py -> DMS proxy -> here.)
 */
async function fetchRetiredVehicle(slug: string): Promise<RetiredRow | null> {
  if (!/-\d{3,}$/.test(slug)) return null;
  try {
    const res = await fetch(RETIRED_SLUGS_URL, {
      headers: { Accept: "application/json" },
      cf: { cacheTtl: 300, cacheEverything: false },
    });
    if (!res.ok) return null;
    const raw = (await res.json()) as { data?: RetiredRow[] } | RetiredRow[];
    const rows = Array.isArray(raw) ? raw : raw?.data ?? [];
    const hit = rows.find((r) => r?.slug === slug);
    if (!hit) return null;
    // A retired row with a blank status is still retired — don't lose the
    // 410 to a missing field.
    return { ...hit, status: hit.status?.trim() || "Archived" };
  } catch {
    return null;
  }
}

/** "2016 Subaru Outback Premium" from a retired row, HTML-escaped, or null. */
function retiredTitle(r: RetiredRow | null): string | null {
  if (!r) return null;
  const parts = [r.year, displayCase(r.make ?? ""), displayCase(r.model ?? "")]
    .filter((x) => x !== null && x !== undefined && String(x).trim() !== "")
    .map((x) => String(x).trim());
  if (parts.length < 2) return null;
  return escapeHtml(parts.join(" "));
}

/**
 * Same public config the client fetches from /api/merchandising, read
 * directly from KV since this runs server-side. Returns the set of VINs
 * with `hidden: true`. Best-effort — an empty set on any failure means
 * "nothing known to be hidden," never blocks serving the page.
 */
async function fetchHiddenVins(env: Env): Promise<Set<string>> {
  try {
    const raw = await env.MERCHANDISING.get(MERCH_CONFIG_KEY, { type: "json" });
    const overlays = (raw as { overlays?: Record<string, { hidden?: boolean }> } | null)
      ?.overlays;
    if (!overlays) return new Set();
    return new Set(
      Object.entries(overlays)
        .filter(([, o]) => o?.hidden === true)
        .map(([vin]) => vin.toUpperCase())
    );
  } catch {
    return new Set();
  }
}
