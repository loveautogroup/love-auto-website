"use client";

/**
 * HomeCustomerVideo — the "happy customers" video in its own band partway
 * down the homepage.
 *
 * Owner, 2026-11-12: move the video out of the top section and into the
 * middle of the page. Before that it sat behind the headline at the top
 * (see HomeHero history). The whole 16:9 frame still shows, uncropped, so
 * the cars stay visible (owner, 2026-09-27).
 *
 * Muted, looped and autoplaying like before, with native controls kept on:
 * a silent looping video always needs a reachable pause button. The full
 * video also lives on /reviews.
 */

import { useRef } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { sendEvent } from "@/lib/analytics";

export default function HomeCustomerVideo() {
  const { t } = useLanguage();
  const firedPlayEvent = useRef(false);

  const handlePlay = () => {
    if (firedPlayEvent.current) return;
    firedPlayEvent.current = true;
    sendEvent("video_play", { video: "happy_customers", location: "homepage_middle" });
  };

  return (
    <section className="bg-[#0a0a0a] text-white py-12 sm:py-16" aria-labelledby="customer-video-heading">
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-6 sm:mb-8">
          <h2 id="customer-video-heading" className="text-2xl sm:text-3xl font-heading font-extrabold">
            {t.homePage.videoHeading}
          </h2>
          <p className="mt-2 text-sm sm:text-base text-ink-300">{t.homePage.videoBody}</p>
        </div>
        <div className="relative w-full aspect-video overflow-hidden">
          <video
            autoPlay
            muted
            loop
            playsInline
            controls
            preload="metadata"
            poster="/videos/happy-customers-v2-poster.jpg"
            aria-label="Love Auto Group customers and their cars"
            onPlay={handlePlay}
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="/videos/happy-customers-v2.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  );
}
