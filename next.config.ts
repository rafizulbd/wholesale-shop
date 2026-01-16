import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // বিল্ড করার সময় ESLint এররগুলো ইগনোর করবে
    ignoreDuringBuilds: true,
  },
  typescript: {
    // বিল্ড করার সময় টাইপ এররগুলো ইগনোর করবে
    ignoreBuildErrors: true,
  },
};

export default nextConfig;