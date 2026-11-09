/* eslint-disable no-undef */

const LOCAL_PLATFORM_ADDRESS_HOSTNAMES = ["localhost", "127.0.0.1", "[::1]"];

/**
 * A product API proxy is one lowercase path segment on the app's own origin.
 * `/v1` is reserved for the Platform API proxy.
 */
const PRODUCT_API_PROXY_PATH_PATTERN = /^\/[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PLATFORM_API_PROXY_PATH = "/v1";

export const PRODUCT_API_ENVIRONMENT_VARIABLES = {
  healthScheduleBrowserAddress:
    "NEXT_PUBLIC_HEALTHALYST_HEALTH_SCHEDULE_API_URL",
  healthScheduleProxyTarget: "HEALTHALYST_HEALTH_SCHEDULE_API_URL",
};

export class EnvironmentConfigurationError extends Error {
  constructor(environmentVariableName, expectedValue) {
    super(`${environmentVariableName} ${expectedValue}`);
    this.name = "EnvironmentConfigurationError";
  }
}

/** Platform API address must be `/` or a secure origin without extra URL data. */
export function parsePlatformApiAddress(configuredAddress) {
  const normalizedAddress = configuredAddress?.trim();
  if (normalizedAddress === "/") return normalizedAddress;
  if (!normalizedAddress) {
    throw new EnvironmentConfigurationError(
      "NEXT_PUBLIC_HEALTHALYST_PLATFORM_API_URL",
      "must be the API origin, or / when using the configured /v1 proxy."
    );
  }

  try {
    return parseSecureApiOrigin(normalizedAddress);
  } catch {
    throw new EnvironmentConfigurationError(
      "NEXT_PUBLIC_HEALTHALYST_PLATFORM_API_URL",
      "must be the API origin, or / when using the configured /v1 proxy."
    );
  }
}

function parseSecureApiOrigin(normalizedAddress) {
  const parsedAddress = new URL(normalizedAddress);
  const isLocalAddress = LOCAL_PLATFORM_ADDRESS_HOSTNAMES.includes(
    parsedAddress.hostname
  );
  const isAllowedProtocol =
    parsedAddress.protocol === "https:" ||
    (isLocalAddress && parsedAddress.protocol === "http:");

  if (
    !isAllowedProtocol ||
    parsedAddress.username ||
    parsedAddress.password ||
    parsedAddress.search ||
    parsedAddress.hash ||
    parsedAddress.pathname !== "/"
  ) {
    throw new Error("Invalid API origin.");
  }

  return parsedAddress.origin;
}

/**
 * A product API address is either its secure origin, called directly, or the
 * path of the app's own proxy to it, such as `/health-schedule-api`.
 */
export function parseProductApiAddress(
  configuredAddress,
  environmentVariableName
) {
  const normalizedAddress = configuredAddress?.trim();
  const expectedValue =
    "must be the API origin, or a one-segment proxy path such as /health-schedule-api.";
  if (!normalizedAddress) {
    throw new EnvironmentConfigurationError(
      environmentVariableName,
      expectedValue
    );
  }
  if (normalizedAddress.startsWith("/")) {
    if (
      !PRODUCT_API_PROXY_PATH_PATTERN.test(normalizedAddress) ||
      normalizedAddress === PLATFORM_API_PROXY_PATH
    ) {
      throw new EnvironmentConfigurationError(
        environmentVariableName,
        expectedValue
      );
    }
    return normalizedAddress;
  }
  try {
    return parseSecureApiOrigin(normalizedAddress);
  } catch {
    throw new EnvironmentConfigurationError(
      environmentVariableName,
      expectedValue
    );
  }
}

/** Reads the statically inlined HealthSchedule API address used by browser requests. */
export function getHealthScheduleApiBrowserAddress() {
  return parseProductApiAddress(
    process.env.NEXT_PUBLIC_HEALTHALYST_HEALTH_SCHEDULE_API_URL,
    PRODUCT_API_ENVIRONMENT_VARIABLES.healthScheduleBrowserAddress
  );
}

/** Reads the statically inlined public address used by browser requests. */
export function getPlatformApiBrowserAddress() {
  return parsePlatformApiAddress(
    process.env.NEXT_PUBLIC_HEALTHALYST_PLATFORM_API_URL
  );
}
