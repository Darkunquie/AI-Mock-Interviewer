import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Inject build ID at build time for version checking
  env: {
    NEXT_PUBLIC_BUILD_ID: Date.now().toString(),
  },

  // Fix workspace root detection when parent directories have lockfiles
  turbopack: {
    root: __dirname,
  },

  // Standalone bundle only for the Docker image (Dockerfile sets
  // NEXT_OUTPUT_STANDALONE). PM2 on the VPS runs `next start`, which doesn't
  // support standalone output.
  output: process.env.NEXT_OUTPUT_STANDALONE === "true" ? "standalone" : undefined,

  // Security headers are applied in proxy.ts for all routes
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
