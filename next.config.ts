import type { NextConfig } from "next";
import { PORTRAIT_VERSION } from "./src/lib/portrait-version";

const nextConfig: NextConfig = {
  images: {
    // Hero portraits are served with a cache-busting `?v=` query string.
    localPatterns: [
      { pathname: "/heroes/**", search: `?v=${PORTRAIT_VERSION}` },
      { pathname: "/**", search: "" },
    ],
  },
};

export default nextConfig;
