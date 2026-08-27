import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/usa",
  assetPrefix: "/usa",
  trailingSlash: true,
};

export default nextConfig;
