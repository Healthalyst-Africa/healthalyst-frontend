/* eslint-disable no-undef */

import {
  getPlatformApiBrowserAddress,
  parseProductApiAddress,
  PRODUCT_API_ENVIRONMENT_VARIABLES,
} from "@healthalyst/config/platform-api-environment";

/** The proxy target must be a bare HTTPS origin, or a local HTTP origin. */
function parseProxyTarget(upstreamAddress, environmentVariableName) {
  const parsedAddress = new URL(upstreamAddress.trim());
  const isLocalAddress = ["localhost", "127.0.0.1", "[::1]"].includes(
    parsedAddress.hostname
  );
  if (
    (parsedAddress.protocol !== "https:" &&
      !(isLocalAddress && parsedAddress.protocol === "http:")) ||
    parsedAddress.username ||
    parsedAddress.password ||
    parsedAddress.pathname !== "/" ||
    parsedAddress.search ||
    parsedAddress.hash
  )
    throw new Error(
      `${environmentVariableName} must be an HTTPS API origin, or a local HTTP API origin.`
    );
  return parsedAddress.origin;
}

/** A transport-only proxy for the existing API cookie contract. No session is stored here. */
export function createPlatformApiRewrites({ browserAddress, upstreamAddress }) {
  if (browserAddress?.trim() !== "/") return [];
  if (!upstreamAddress?.trim()) {
    throw new Error(
      "HEALTHALYST_PLATFORM_API_URL is required when NEXT_PUBLIC_HEALTHALYST_PLATFORM_API_URL is /."
    );
  }
  const upstreamOrigin = parseProxyTarget(
    upstreamAddress,
    "HEALTHALYST_PLATFORM_API_URL"
  );
  return [{ source: "/v1/:path*", destination: `${upstreamOrigin}/v1/:path*` }];
}

/** Builds rewrites from the same shared environment contract used by the apps. */
export function createPlatformApiRewritesFromEnvironment() {
  return createPlatformApiRewrites({
    browserAddress: getPlatformApiBrowserAddress(),
    upstreamAddress: process.env.HEALTHALYST_PLATFORM_API_URL,
  });
}

/**
 * Proxies a product API's `/v1` paths from the app's own origin, so the
 * browser never needs that API's cross-origin permission. Product APIs use
 * bearer tokens only; no cookie or session passes through here.
 */
export function createProductApiRewrites({
  browserAddress,
  browserVariableName,
  upstreamAddress,
  upstreamVariableName,
}) {
  const productAddress = parseProductApiAddress(
    browserAddress,
    browserVariableName
  );
  if (!productAddress.startsWith("/")) return [];
  if (!upstreamAddress?.trim()) {
    throw new Error(
      `${upstreamVariableName} is required when ${browserVariableName} is a proxy path.`
    );
  }
  const upstreamOrigin = parseProxyTarget(
    upstreamAddress,
    upstreamVariableName
  );
  return [
    {
      source: `${productAddress}/v1/:path*`,
      destination: `${upstreamOrigin}/v1/:path*`,
    },
  ];
}

/** The HealthSchedule app's proxy to the HealthSchedule API. */
export function createHealthScheduleApiRewritesFromEnvironment() {
  return createProductApiRewrites({
    browserAddress: process.env.NEXT_PUBLIC_HEALTHALYST_HEALTH_SCHEDULE_API_URL,
    browserVariableName:
      PRODUCT_API_ENVIRONMENT_VARIABLES.healthScheduleBrowserAddress,
    upstreamAddress: process.env.HEALTHALYST_HEALTH_SCHEDULE_API_URL,
    upstreamVariableName:
      PRODUCT_API_ENVIRONMENT_VARIABLES.healthScheduleProxyTarget,
  });
}
