import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "storage.cdn-luma.com" },
      { protocol: "https", hostname: "**.cdn-luma.com" },
      { protocol: "https", hostname: "lumalabs.ai" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
};

export default nextConfig;
