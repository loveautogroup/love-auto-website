import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Cloudflare Pages static export
  output: "export",
  trailingSlash: true,
  images: {
    unoptimized: true,
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.dealercenter.net",
      },
      {
        protocol: "https",
        hostname: "**.carsforsale.com",
      },
    ],
  },
};

export default nextConfig;
