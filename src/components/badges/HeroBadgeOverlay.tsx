"use client";

/**
 * HeroBadgeOverlay — the owner-approved FINAL hero badge design (2026-10-04).
 *
 * Spec: artifact 4kqCdyhjzSYnEWJqdJ8EGg, "Final build spec for Bill", stage
 * 4:3 (owner, 2026-10-04). Every size is a percentage of the STAGE WIDTH in
 * `cqw`, so the same numbers hold at 1248px, on a 300px grid card and on a
 * phone. The parent must be the photo box with `@container` (container-type:
 * inline-size) and `position: relative`.
 *
 * BAKE RULES: this is the HTML twin of composite_hero_v3 in
 * dms-inventory-api/photo_overlay.py, and the DMS carries a verbatim copy at
 * love-auto-dms/src/components/inventory/HeroBadgeOverlay.tsx. Change all
 * three in the same session. The only allowed difference is hover.
 *
 * Elements: top bar (HeroTopBar — also the ONLY overlay on gallery photos 2+,
 * via GalleryBarOverlay; owner 2026-10-04) ·
 * up to three feature pills (available only) · Google Reviews badge (live
 * rating, no count) · CALL pill (ASK ABOUT SIMILAR CARS when Pending/Sold) ·
 * Sale Pending plate or Sold stamp (Sold also greys the photo). Fills are 85%
 * opaque over an 8px-at-1248 blur + saturate(1.2). No price. No free-CARFAX
 * card — the VDP keeps its own "Show me the CARFAX" button.
 */

import { useId } from "react";

export type HeroBadgeStatus = "available" | "pending" | "sold";

export interface HeroBadgeOverlayProps {
  status: HeroBadgeStatus;
  /** Resolved pills (Railway badge_pills.py). Ignored unless available. */
  pills?: string[];
  /** Live Google star average. */
  rating: number;
  /** Display form, e.g. "630-359-3643". */
  phone?: string;
  /** tel: target; omit to render the pill as plain text. */
  phoneHref?: string;
  /** Google reviews page; omit to render the badge as plain text. */
  reviewsUrl?: string;
  logoSrc?: string;
  shieldSrc?: string;
  /** Called on badge clicks so the host can stop a lightbox opening. */
  onBadgeClick?: (e: React.MouseEvent) => void;
}

const FONT = "var(--font-montserrat, var(--font-display, 'Montserrat')), 'Montserrat', sans-serif";
const INK = "rgba(10,10,10,0.85)";
const RED = "#dc2626";
// blur(8px) at the 1248px design stage = 0.641cqw, so the frost scales too.
const GLASS = "blur(0.641cqw) saturate(1.2)";
const glass = { backdropFilter: GLASS, WebkitBackdropFilter: GLASS } as const;
const STAR = "12,2 15.1,8.7 22.4,9.5 17,14.5 18.5,21.8 12,18.1 5.5,21.8 7,14.5 1.6,9.5 8.9,8.7";

function GoogleG() {
  return (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: "block", width: "100%", height: "100%" }}>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

/** Star i is filled min(1, max(0, rating - i)) from the left (spec). */
function Stars({ rating }: { rating: number }) {
  const uid = useId().replace(/:/g, "");
  return (
    <span style={{ display: "flex", alignItems: "center", gap: "0.15cqw" }} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((i) => {
        const pct = (Math.min(1, Math.max(0, rating - i)) * 100).toFixed(1) + "%";
        const id = `hbs-${uid}-${i}`;
        return (
          <svg key={i} viewBox="0 0 24 24" style={{ width: "2.1cqw", height: "2.1cqw", display: "block", flex: "none" }}>
            <defs>
              <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
                <stop offset={pct} stopColor="#FBBC04" />
                <stop offset={pct} stopColor="#80868B" />
              </linearGradient>
            </defs>
            <polygon points={STAR} fill={`url(#${id})`} stroke={`url(#${id})`} strokeWidth={1.8} strokeLinejoin="round" />
          </svg>
        );
      })}
    </span>
  );
}

/**
 * The top bar alone: logo (30%), "NO DEALER FEES" (3.8%, FEES brand red) and
 * the CARFAX Advantage Dealer shield on an 85% glass bar. ONE component for
 * the hero (inside HeroBadgeOverlay) and every gallery photo
 * (GalleryBarOverlay) so the two cannot drift. Baked twin: _draw_top_bar in
 * dms-inventory-api/photo_overlay.py.
 */
export function HeroTopBar({
  logoSrc = "/images/badges/logo-primary.png",
  shieldSrc = "/images/badges/carfax-advantage-dealer.png",
}: { logoSrc?: string; shieldSrc?: string }) {
  return (
    <div
      style={{
        position: "absolute", left: 0, right: 0, top: 0, height: "12cqw", boxSizing: "content-box",
        borderBottom: `0.5cqw solid ${RED}`, background: INK, ...glass,
        display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 2cqw",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={logoSrc} alt="Love Auto Group" style={{ width: "30cqw", height: "auto", flex: "none", display: "block" }} />
      <span style={{ fontWeight: 900, fontSize: "3.8cqw", lineHeight: 1.219, color: "#fff", whiteSpace: "nowrap" }}>
        NO DEALER <span style={{ color: RED }}>FEES</span>
      </span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={shieldSrc}
        alt="CARFAX Advantage Dealer"
        style={{ height: "9.4cqw", width: "auto", flex: "none", display: "block", filter: "drop-shadow(0 0.4cqw 1cqw rgba(0,0,0,0.6))" }}
      />
    </div>
  );
}

/**
 * Gallery photos 2 onward (owner 2026-10-04: "bring only the header to the
 * remaining pictures in the gallery"): the hero's top bar and nothing else —
 * no pills, Google, CALL, URL or status stamp, whatever the car's status.
 * Baked twin: composite_gallery_bar in photo_overlay.py. Parent must be the
 * @container photo box, as for HeroBadgeOverlay.
 */
export function GalleryBarOverlay({ logoSrc, shieldSrc }: { logoSrc?: string; shieldSrc?: string }) {
  return (
    <div className="hero-badges" style={{ position: "absolute", inset: 0, fontFamily: FONT, pointerEvents: "none", zIndex: 10 }}>
      <HeroTopBar logoSrc={logoSrc} shieldSrc={shieldSrc} />
    </div>
  );
}

/**
 * Size of each hero pill by how many there are (owner 2026-10-09: "reduce size
 * of the badges when using more than 3"). 1-3 full size; 4 / 5 / 6 at 80% /
 * 70% / 62%. MIRRORED in photo_overlay.py pill_scale() and the other
 * HeroBadgeOverlay.tsx (website / DMS). Change all three.
 */
export function pillScale(count: number): number {
  return ({ 4: 0.8, 5: 0.7, 6: 0.62 } as Record<number, number>)[count] ?? 1;
}

export default function HeroBadgeOverlay({
  status,
  pills = [],
  rating,
  phone = "630-359-3643",
  phoneHref,
  reviewsUrl,
  logoSrc = "/images/badges/logo-primary.png",
  shieldSrc = "/images/badges/carfax-advantage-dealer.png",
  onBadgeClick,
}: HeroBadgeOverlayProps) {
  const r = Math.round((Number(rating) || 0) * 10) / 10;
  // Up to six since 2026-10-09 (owner), matching badge_pills.MAX_PILLS and the bake.
  const shownPills = status === "available" ? pills.filter(Boolean).slice(0, 6) : [];
  const ps = pillScale(shownPills.length);
  const sim = status !== "available";
  const stop = (e: React.MouseEvent) => {
    e.stopPropagation();
    onBadgeClick?.(e);
  };

  const googleInner = (
    <>
      <span
        style={{
          width: "4.6cqw", height: "4.6cqw", flex: "none", background: "#fff",
          borderRadius: "50%", padding: "0.5cqw", boxSizing: "border-box", display: "block",
        }}
      >
        <GoogleG />
      </span>
      <span style={{ display: "flex", flexDirection: "column", gap: "0.45cqw" }}>
        <span style={{ fontWeight: 700, fontSize: "1.8cqw", lineHeight: 1.15, letterSpacing: "0.08em", color: "#fff", whiteSpace: "nowrap" }}>
          GOOGLE REVIEWS
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "0.7cqw" }}>
          <span style={{ fontWeight: 900, fontSize: "3.3cqw", lineHeight: 1, color: "#fff" }}>{r.toFixed(1)}</span>
          <Stars rating={r} />
        </span>
      </span>
    </>
  );
  const googleStyle: React.CSSProperties = {
    position: "absolute", right: "2.2cqw", bottom: "11cqw", height: "7cqw", boxSizing: "border-box",
    display: "flex", alignItems: "center", gap: "1.2cqw", padding: "0 2cqw 0 1.3cqw",
    background: INK, ...glass, borderRadius: 99, boxShadow: "0 0.4cqw 1.2cqw rgba(0,0,0,0.533)",
    fontFamily: FONT, textDecoration: "none", zIndex: 12,
  };

  const phoneInner = (
    <>
      <span
        style={{
          fontWeight: 700, fontSize: sim ? "1.7cqw" : "1.9cqw", lineHeight: sim ? 1.15 : 1.1,
          letterSpacing: "0.06em", color: "#fff", whiteSpace: "nowrap", display: "block",
        }}
      >
        {sim ? (<>ASK ABOUT<br />SIMILAR CARS</>) : "CALL"}
      </span>
      <span
        style={{
          fontWeight: 900, fontSize: "3.9cqw", lineHeight: 1.219, letterSpacing: "0.01em", color: "#fff",
          borderLeft: "0.3cqw solid rgba(255,255,255,0.667)", paddingLeft: "1.8cqw", whiteSpace: "nowrap", display: "block",
        }}
      >
        {phone}
      </span>
    </>
  );
  const phoneStyle: React.CSSProperties = {
    position: "absolute", right: "2.2cqw", bottom: "2.2cqw", height: "7.8cqw", boxSizing: "border-box",
    display: "flex", alignItems: "center", gap: "1.6cqw", padding: `0 3cqw 0 ${sim ? 1.8 : 2}cqw`,
    background: "rgba(220,38,38,0.85)", ...glass, borderRadius: 99,
    boxShadow: "0 0.4cqw 1.2cqw rgba(0,0,0,0.533)", fontFamily: FONT, textDecoration: "none", zIndex: 12,
  };

  return (
    <div className="hero-badges" style={{ position: "absolute", inset: 0, fontFamily: FONT, pointerEvents: "none", zIndex: 10 }}>
      {/* Sold: the photo goes grey at 82% brightness. */}
      {status === "sold" && (
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, backdropFilter: "grayscale(1) brightness(0.82)", WebkitBackdropFilter: "grayscale(1) brightness(0.82)" }} />
      )}

      {/* Top bar: logo · NO DEALER FEES · CARFAX Advantage Dealer shield. */}
      <HeroTopBar logoSrc={logoSrc} shieldSrc={shieldSrc} />

      {/* Feature pills, stacked bottom-left (available cars only). */}
      {shownPills.length > 0 && (
        <div style={{ position: "absolute", left: "1.8cqw", bottom: "2.2cqw", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: `${0.9 * ps}cqw` }}>
          {shownPills.map((p) => (
            <span
              key={p}
              style={{
                background: INK, ...glass, color: "#fff", fontWeight: 800, fontSize: `${3.1 * ps}cqw`, lineHeight: 1.219,
                padding: `${0.9 * ps}cqw ${2.4 * ps}cqw ${0.9 * ps}cqw ${1.8 * ps}cqw`, borderRadius: 99, borderLeft: `${1.1 * ps}cqw solid ${RED}`,
                boxShadow: `0 ${0.3 * ps}cqw ${1 * ps}cqw rgba(0,0,0,0.467)`, whiteSpace: "nowrap", display: "block",
              }}
            >
              {p}
            </span>
          ))}
        </div>
      )}

      {/* Google Reviews badge, right-aligned 1% above the phone pill. */}
      {reviewsUrl ? (
        <a href={reviewsUrl} target="_blank" rel="noopener noreferrer" onClick={stop}
          aria-label={`Read Love Auto Group's ${r.toFixed(1)} star Google reviews`}
          className="transition-transform duration-150 hover:scale-[1.04]"
          style={{ ...googleStyle, pointerEvents: "auto", transformOrigin: "right center" }}>
          {googleInner}
        </a>
      ) : (
        <div style={googleStyle}>{googleInner}</div>
      )}

      {/* CALL / ASK ABOUT SIMILAR CARS. */}
      {phoneHref ? (
        <a href={phoneHref} onClick={stop} aria-label={`Call Love Auto Group at ${phone}`}
          className="transition-transform duration-150 hover:scale-[1.04]"
          style={{ ...phoneStyle, pointerEvents: "auto", transformOrigin: "right center" }}>
          {phoneInner}
        </a>
      ) : (
        <div style={phoneStyle}>{phoneInner}</div>
      )}

      {/* Sale Pending plate: straight, centred, red SALE / black PENDING. */}
      {status === "pending" && (
        <div aria-hidden="true"
          style={{
            position: "absolute", left: "50%", top: "47%", transform: "translate(-50%, -50%)",
            background: "rgba(255,255,255,0.85)", ...glass, border: `1cqw solid ${RED}`, borderRadius: "1cqw",
            padding: "1.1cqw 3cqw", boxShadow: "0 0.8cqw 2.4cqw rgba(0,0,0,0.667)", whiteSpace: "nowrap", zIndex: 13,
          }}>
          <span style={{ fontWeight: 900, fontSize: "7cqw", lineHeight: 1, letterSpacing: "0.02em", color: "#0a0a0a", display: "block" }}>
            <span style={{ color: RED }}>SALE</span> PENDING
          </span>
        </div>
      )}

      {/* Sold stamp: tilted -11 degrees, red on white. */}
      {status === "sold" && (
        <div aria-hidden="true"
          style={{
            position: "absolute", left: "50%", top: "50%", transform: "translate(-50%, -48%) rotate(-11deg)",
            background: "rgba(255,255,255,0.85)", ...glass, border: `1.4cqw solid ${RED}`, borderRadius: "1.2cqw",
            padding: "0.5cqw 4cqw", whiteSpace: "nowrap", zIndex: 13,
          }}>
          <span style={{ fontWeight: 900, fontSize: "19cqw", lineHeight: 1, letterSpacing: "0.04em", color: RED, display: "block" }}>
            SOLD
          </span>
        </div>
      )}
    </div>
  );
}

/** Website / DMS status -> picture variant. */
export function heroBadgeStatus(status: string | null | undefined): HeroBadgeStatus {
  const s = String(status ?? "").toLowerCase().replace(/[_\s]+/g, "-");
  if (s === "sold") return "sold";
  if (s === "sale-pending" || s === "deal-pending" || s === "pending") return "pending";
  return "available";
}
