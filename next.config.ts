import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static files only, so GitHub Pages can host the site. The export is written to `out/`.
  output: "export",
  devIndicators: false,
};

export default nextConfig;
