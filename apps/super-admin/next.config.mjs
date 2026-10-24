import { fileURLToPath } from "node:url";
import { createPlatformApiRewrites } from "@healthalyst/platform-api/next-config";

const nextConfiguration = {
  reactStrictMode: true,
  rewrites() {
    return createPlatformApiRewrites({
      browserAddress: process.env.NEXT_PUBLIC_HEALTHALYST_PLATFORM_API_URL,
      upstreamAddress: process.env.HEALTHALYST_PLATFORM_API_URL,
    });
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
    "@healthalyst/ui",
    "@healthalyst/icons",
    "@healthalyst/platform-api",
  ],
  typescript: { ignoreBuildErrors: false },
};

export default nextConfiguration;
