import type { PlatformRouteConfiguration } from "../types/platform-session";

export const API_REFRESH_COOKIE_NAME =
  process.env.HEALTHALYST_PLATFORM_REFRESH_COOKIE_NAME?.trim() ||
  "__Secure-hs_rt";

export function getSessionStoreConfiguration() {
  return {
    encryptionSecret: process.env.HEALTHALYST_PLATFORM_SESSION_SECRET ?? "",
    redisAddress: process.env.HEALTHALYST_PLATFORM_SESSION_REDIS_URL?.trim(),
    allowDevelopmentStore: process.env.NODE_ENV === "development",
  };
}

export function getExpectedApplicationOrigin(
  configuration: PlatformRouteConfiguration
): string | null {
  const configuredOrigin = process.env.HEALTHALYST_APP_ORIGIN?.trim();
  if (configuredOrigin) {
    try {
      const parsedOrigin = new URL(configuredOrigin);
      if (parsedOrigin.origin !== configuredOrigin.replace(/\/$/, ""))
        return null;
      return parsedOrigin.origin;
    } catch {
      return null;
    }
  }

  return process.env.NODE_ENV === "development"
    ? configuration.localOrigin
    : null;
}

export function getPlatformApiAddress(): string | null {
  const configuredAddress = process.env.HEALTHALYST_PLATFORM_API_URL?.trim();
  if (!configuredAddress) return null;
  try {
    const parsedAddress = new URL(configuredAddress);
    const isLocalHttpAddress =
      parsedAddress.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(parsedAddress.hostname);
    if (parsedAddress.protocol !== "https:" && !isLocalHttpAddress) return null;
    return parsedAddress.origin.replace(/\/$/, "");
  } catch {
    return null;
  }
}
