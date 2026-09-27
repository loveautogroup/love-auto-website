"use client";

/**
 * PromoVideo — shared player for the "happy customers" promo videos.
 *
 * Two modes, one implementation, so /reviews, /about and the homepage never
 * carry three copies of the same IntersectionObserver / GA4 wiring:
 *
 *   - "click": the viewer presses play. Native controls, preload="none",
 *     poster shown until then. Nothing but the poster JPG loads before the
 *     click. Used on /reviews and /about for the full ~1:47 video.
 *
 *   - "auto-in-view": silent, looping, plays only while scrolled into view
 *     and pauses the moment it leaves. The <video> element carries no `src`
 *     attribute at all until an IntersectionObserver first reports the
 *     player is near the viewport (rootMargin gives it a head start so
 *     playback doesn't stutter waiting on the network) — so nothing loads
 *     while the section is off-screen, same promise as "click" mode gets
 *     from preload="none". Used on the homepage for the 27s short cut.
 *
 * `prefers-reduced-motion: reduce` downgrades "auto-in-view" to "click"
 * behavior at mount: no IntersectionObserver, no autoplay, just a paused
 * player with visible controls the viewer can start themselves.
 *
 * Every instance carries native `controls` (not just on hover) — the
 * simplest way to guarantee the "silent loop always has a reachable pause
 * button" accessibility requirement without hand-rolling a custom control
 * that can drift out of sync with real play state.
 *
 * GA4: fires 'video_play' via sendEvent on the FIRST play only (a paused/
 * resumed loop does not re-fire), carrying {video, location} exactly as
 * analyticsVideo/analyticsLocation are passed in.
 */

import { useEffect, useRef, useState } from "react";
import { sendEvent } from "@/lib/analytics";

export interface PromoVideoProps {
  /** Path under /public, e.g. "/videos/happy-customers.mp4" */
  src: string;
  /** Poster JPG shown before playback starts. */
  posterSrc: string;
  mode: "click" | "auto-in-view";
  ariaLabel: string;
  /** {video} value sent with the GA4 video_play event. */
  analyticsVideo: "happy_customers" | "happy_customers_short";
  /** {location} value sent with the GA4 video_play event. */
  analyticsLocation: string;
  /** Anchor id on the wrapping container, e.g. for a "watch on /reviews" deep link. */
  id?: string;
  className?: string;
}

export default function PromoVideo({
  src,
  posterSrc,
  mode,
  ariaLabel,
  analyticsVideo,
  analyticsLocation,
  id,
  className = "",
}: PromoVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const firedPlayEvent = useRef(false);
  const sourceAttached = useRef(false);

  // "auto-in-view" only ever behaves that way when the viewer hasn't asked
  // for reduced motion. Read once at mount — this never needs to react to
  // the setting changing mid-session.
  const [effectiveMode] = useState<"click" | "auto-in-view">(() => {
    if (mode !== "auto-in-view") return mode;
    if (typeof window === "undefined") return mode;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    return prefersReducedMotion ? "click" : "auto-in-view";
  });

  // "click" mode: the src attribute is present from the start, but
  // preload="none" means the browser makes no request for it until the
  // viewer presses play — so this is not a network cost, just a plain,
  // no-JS-required attribute.
  //
  // "auto-in-view" mode: no src at all until the IntersectionObserver below
  // reports we're near the viewport, then it's attached imperatively and
  // .load() is called (React re-rendering a `src` attribute onto an
  // already-mounted <video> does not by itself make the browser pick it up).
  useEffect(() => {
    if (effectiveMode !== "auto-in-view") return;
    const el = containerRef.current;
    const video = videoRef.current;
    if (!el || !video) return;

    const attachSource = () => {
      if (sourceAttached.current) return;
      sourceAttached.current = true;
      video.src = src;
      video.load();
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          attachSource();
          // Only actually play once meaningfully visible, not the instant
          // the expanded rootMargin box is first touched.
          if (entry.intersectionRatio >= 0.4) {
            video.play().catch(() => {
              // Autoplay can still be blocked by the browser; the viewer
              // has native controls to start it themselves.
            });
          } else {
            video.pause();
          }
        } else {
          video.pause();
        }
      },
      { rootMargin: "200px 0px", threshold: [0, 0.4] },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [effectiveMode, src]);

  const handlePlay = () => {
    if (firedPlayEvent.current) return;
    firedPlayEvent.current = true;
    sendEvent("video_play", {
      video: analyticsVideo,
      location: analyticsLocation,
    });
  };

  const isAutoInView = effectiveMode === "auto-in-view";

  return (
    <div
      ref={containerRef}
      id={id}
      className={`relative w-full aspect-video rounded-2xl overflow-hidden bg-brand-navy ${className}`}
    >
      <video
        ref={videoRef}
        {...(effectiveMode === "click" ? { src } : {})}
        poster={posterSrc}
        controls
        muted={isAutoInView}
        loop={isAutoInView}
        playsInline
        preload="none"
        aria-label={ariaLabel}
        onPlay={handlePlay}
        className="w-full h-full object-cover"
      >
        <p className="text-white text-sm p-4">
          Your browser doesn&apos;t support HTML5 video.{" "}
          <a href={src} className="underline text-brand-red-light" download>
            Download the video
          </a>
        </p>
      </video>
    </div>
  );
}
