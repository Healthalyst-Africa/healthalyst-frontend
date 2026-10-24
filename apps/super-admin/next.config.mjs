import { fileURLToPath } from "node:url";
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
  ],
  typescript: { ignoreBuildErrors: false },
};

export default nextConfiguration;
