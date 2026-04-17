import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Inject build ID at build time for version checking
  env: {
    NEXT_PUBLIC_BUILD_ID: Date.now().toString(),
  },

  // Security headers are applied in middleware.ts for all routes
  poweredByHeader: false,
  reactStrictMode: true,
};

export default nextConfig;
