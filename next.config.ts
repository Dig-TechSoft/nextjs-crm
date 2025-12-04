import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  // Use /admin only in production so local dev runs at the root.
  basePath: isProd ? "/admin" : undefined,
  assetPrefix: isProd ? "/admin" : undefined,
};

export default nextConfig;
