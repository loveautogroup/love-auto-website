"use client";

/**
 * VDPWalkaround — inline video player for the walkaround walkthrough video.
 *
 * Renders only when `walkaroundUrl` is non-null (Phase 2 of the photo
 * pipeline — populated once Lisa's WalkAroundScreen uploads to R2).
 * In Phase 1 the backend returns walkaround_url=null so this component
 * renders nothing and adds zero layout shift.
 *
 * Design decisions:
 *  - Native HTML5 <video> with controls, muted autoplay on hover via
 *    onMouseEnter/onMouseLeave. No external player library — keeps the
 *    bundle small and works with Cloudflare's edge cache headers.
 *  - posterUrl: if R2 ships a poster frame (walkaround_poster_url) it's
 *    shown as the thumbnail while the video loads. Falls back to the
 *    vehicle's hero photo.
 *  - 16:9 aspect ratio container — matches the most common phone video
 *    orientation. WalkAroundScreen records landscape so this is correct.
 *  - Section is visually consistent with PhotoGallery — black bg, brand
 *    red play indicator, Montserrat label.
 */

import { useRef } from "react";

interface VDPWalkaroundProps {
  walkaroundUrl: string;
  posterUrl?: string | null;
  vehicleLabel?: string; // e.g. "2022 Toyota Camry"
}

export default function VDPWalkaround({
  walkaroundUrl,
  posterUrl,
  vehicleLabel,
}: VDPWalkaroundProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleMouseEnter = () => {
    videoRef.current?.play().catch(() => {
      // Autoplay blocked (mobile, policy) — user will click the controls.
    });
  };

  const handleMouseLeave = () => {
    if (videoRef.current && !videoRef.current.paused) {
      videoRef.current.pause();
    }
  };

  return (
    <section className="mt-6" aria-label="Vehicle walkaround video">
      <h2 className="text-base font-semibold text-brand-text mb-2 font-brand">
        Walkaround Video
      </h2>
      <div
        className="relative w-full rounded-lg overflow-hidden bg-black aspect-video"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <video
          ref={videoRef}
          src={walkaroundUrl}
          poster={posterUrl ?? undefined}
          controls
          muted
          playsInline
          preload="metadata"
          className="w-full h-full object-contain"
          aria-label={
            vehicleLabel
              ? `${vehicleLabel} walkaround video`
              : "Vehicle walkaround video"
          }
        >
          <p className="text-white text-sm p-4">
            Your browser doesn&apos;t support HTML5 video.{" "}
            <a
              href={walkaroundUrl}
              className="underline text-brand-red"
              download
            >
              Download the video
            </a>
          </p>
        </video>
      </div>
    </section>
  );
}
