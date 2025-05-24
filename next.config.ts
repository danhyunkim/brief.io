// next.config.js
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  webpack: (config, { isServer }) => {
    // Ensure 'pdf-parse' is treated as an external CommonJS module
    config.externals = config.externals ?? [];
    (config.externals as string[]).push("pdf-parse");
    return config;
  },
};

export default nextConfig;
