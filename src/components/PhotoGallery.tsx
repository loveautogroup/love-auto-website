"use client";

import { useState } from "react";

interface PhotoGalleryProps {
  images: string[];
  alt: string;
}

export default function PhotoGallery({ images, alt }: PhotoGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);

  // For now we show placeholders since real photos aren't synced yet.
  // When Bob delivers processed photos, they'll render through Next.js <Image>.
  const hasRealPhotos = images.length > 0 && !images[0]?.includes("placeholder");
  const photoCount = hasRealPhotos ? images.length : 8;

  return (
    <div className="space-y-3">
      {/* Main hero image — large, left-aligned */}
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr] gap-2">
        {/* Primary large image */}
        <div className="relative aspect-[4/3] bg-brand-gray-100 rounded-xl overflow-hidden">
          {hasRealPhotos ? (
            <img
              src={images[selectedIndex]}
              alt={`${alt} — Photo ${selectedIndex + 1}`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-brand-gray-300">
              <div className="text-center">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-16 h-16 mx-auto mb-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="font-medium text-sm">Vehicle Photos</p>
                <p className="text-xs">Synced from Dealer Center</p>
              </div>
            </div>
          )}
          {/* Photo counter badge */}
          <span className="absolute bottom-3 right-3 bg-black/70 text-white text-xs font-medium px-2.5 py-1 rounded-full">
            {selectedIndex + 1} / {photoCount}
          </span>
        </div>

        {/* Thumbnail grid — 2x3 on desktop */}
        <div className="hidden md:grid grid-cols-3 grid-rows-2 gap-2">
          {Array.from({ length: 6 }).map((_, i) => {
            const thumbIndex = i + 1;
            return (
              <button
                key={i}
                onClick={() => setSelectedIndex(thumbIndex)}
                className={`relative aspect-[4/3] bg-brand-gray-100 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedIndex === thumbIndex
                    ? "border-brand-red ring-1 ring-brand-red"
                    : "border-transparent hover:border-brand-gray-300"
                }`}
                aria-label={`View photo ${thumbIndex + 1}`}
              >
                {hasRealPhotos && images[thumbIndex] ? (
                  <img
                    src={images[thumbIndex]}
                    alt={`${alt} — Thumbnail ${thumbIndex + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-brand-gray-200">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Horizontal thumbnail strip on mobile */}
      <div className="flex md:hidden gap-2 overflow-x-auto pb-1">
        {Array.from({ length: photoCount }).map((_, i) => (
          <button
            key={i}
            onClick={() => setSelectedIndex(i)}
            className={`w-16 h-12 bg-brand-gray-100 rounded-lg shrink-0 border-2 transition-all ${
              selectedIndex === i
                ? "border-brand-red"
                : "border-transparent hover:border-brand-gray-300"
            }`}
            aria-label={`View photo ${i + 1}`}
          >
            {hasRealPhotos && images[i] ? (
              <img
                src={images[i]}
                alt=""
                className="w-full h-full object-cover rounded-md"
              />
            ) : null}
          </button>
        ))}
      </div>
    </div>
  );
}
