/* eslint-disable no-undef */

import { getPlatformApiBrowserAddress } from "@healthalyst/config/platform-api-environment";

/** A transport-only proxy for the existing API cookie contract. No session is stored here. */
export function createPlatformApiRewrites({ browserAddress, upstreamAddress }) {
  if (browserAddress?.trim() !== "/") return [];
  if (!upstreamAddress?.trim()) {
    throw new Error(
      "HEALTHALYST_PLATFORM_API_URL is required when NEXT_PUBLIC_HEALTHALYST_PLATFORM_API_URL is /."
    );
  }
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
      "HEALTHALYST_PLATFORM_API_URL must be an HTTPS API origin, or a local HTTP API origin."
    );
  return [
    { source: "/v1/:path*", destination: `${parsedAddress.origin}/v1/:path*` },
  ];
}

/** Builds rewrites from the same shared environment contract used by the apps. */
export function createPlatformApiRewritesFromEnvironment() {
  return createPlatformApiRewrites({
    browserAddress: getPlatformApiBrowserAddress(),
    upstreamAddress: process.env.HEALTHALYST_PLATFORM_API_URL,
  });
}
