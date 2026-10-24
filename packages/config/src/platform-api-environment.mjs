/* eslint-disable no-undef */

const LOCAL_PLATFORM_ADDRESS_HOSTNAMES = ["localhost", "127.0.0.1", "[::1]"];

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
      throw new Error("Invalid Platform API origin.");
    }

    return parsedAddress.origin;
  } catch {
    throw new EnvironmentConfigurationError(
      "NEXT_PUBLIC_HEALTHALYST_PLATFORM_API_URL",
      "must be the API origin, or / when using the configured /v1 proxy."
    );
  }
}

/** Reads the statically inlined public address used by browser requests. */
export function getPlatformApiBrowserAddress() {
  return parsePlatformApiAddress(
    process.env.NEXT_PUBLIC_HEALTHALYST_PLATFORM_API_URL
  );
}
