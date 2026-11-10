import { fileURLToPath } from "node:url";
import { withHealthAlystPwa } from "@healthalyst/pwa/next-config";
import {
  createHealthScheduleApiRewritesFromEnvironment,
  createPlatformApiRewritesFromEnvironment,
} from "@healthalyst/platform-api/next-config";
import { getHealthScheduleApiBrowserAddress } from "@healthalyst/config/platform-api-environment";

const NO_STORE_HEADERS = [{ key: "Cache-Control", value: "no-store" }];
const healthScheduleApiAddress = getHealthScheduleApiBrowserAddress();

const nextConfiguration = {
  reactStrictMode: true,
  rewrites() {
    return [
      ...createPlatformApiRewritesFromEnvironment(),
      ...createHealthScheduleApiRewritesFromEnvironment(),
    ];
  },
  headers() {
    return [
      { source: "/v1/:path*", headers: NO_STORE_HEADERS },
      ...(healthScheduleApiAddress.startsWith("/")
        ? [
            {
              source: `${healthScheduleApiAddress}/v1/:path*`,
              headers: NO_STORE_HEADERS,
            },
          ]
        : []),
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
