import type { NextConfig } from "next";
import { ASSET_VERSION } from "./src/lib/asset-version";

const nextConfig: NextConfig = {
  images: {
    // Every game image is served with a cache-busting `?v=` query string
    // (see src/lib/asset-version.ts).
    localPatterns: [
      { pathname: "/**", search: `?v=${ASSET_VERSION}` },
      { pathname: "/**", search: "" },
    ],
  },
};

export default nextConfig;
