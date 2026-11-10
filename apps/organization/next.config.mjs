/* eslint-disable no-undef */
import { fileURLToPath } from "node:url";
import { withHealthAlystPwa } from "@healthalyst/pwa/next-config";
import { createPlatformApiRewritesFromEnvironment } from "@healthalyst/platform-api/next-config";

const nextConfiguration = {
  reactStrictMode: true,
  rewrites() {
    return createPlatformApiRewritesFromEnvironment();
  },
  headers() {
    return [
      {
        source: "/v1/:path*",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
  output: "standalone",
  outputFileTracingRoot: fileURLToPath(new URL("../..", import.meta.url)),
  transpilePackages: [
    "@healthalyst/config",
    "@healthalyst/ui",
    "@healthalyst/icons",
    "@healthalyst/platform-api",
    "@healthalyst/pwa",
  ],
  typescript: {
    ignoreBuildErrors: false,
  },
};

export default withHealthAlystPwa(nextConfiguration);
