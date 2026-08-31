import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // chartjs-node-canvas (and its native `canvas` dependency) uses dynamic
  // requires that Turbopack can't statically bundle — run it as native
  // Node require instead.
  serverExternalPackages: ["chartjs-node-canvas", "canvas"],
  devIndicators: false,
};

export default nextConfig;
