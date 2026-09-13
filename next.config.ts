import type { NextConfig } from "next";
import { ASSET_VERSION } from "./src/lib/asset-version";

const nextConfig: NextConfig = {
  images: {
    // Original image requests carry the browser's invitation cookie. The shared
    // optimizer fetches without it and must not publish cached private artwork.
    unoptimized: true,
    // Every game image is served with a cache-busting `?v=` query string
    // (see src/lib/asset-version.ts).
    localPatterns: [
      { pathname: "/**", search: `?v=${ASSET_VERSION}` },
      { pathname: "/**", search: "" },
    ],
  },
};

export default nextConfig;
