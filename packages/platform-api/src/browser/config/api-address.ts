import { PlatformApiConfigurationError } from "../errors/platform-api-configuration-error";

/** Services supply /v1 paths. Configuration is an origin or the app root. */
export function validatePlatformApiAddress(
  configuredAddress: string | undefined
): string {
  const address = configuredAddress?.trim();
  if (address === "/") return address;
  if (!address) throw new PlatformApiConfigurationError();
  try {
    const parsedAddress = new URL(address);
    const isLocalAddress = ["localhost", "127.0.0.1", "[::1]"].includes(
      parsedAddress.hostname
    );
    if (
      (parsedAddress.protocol !== "https:" &&
        !(isLocalAddress && parsedAddress.protocol === "http:")) ||
      parsedAddress.username ||
      parsedAddress.password ||
      parsedAddress.search ||
      parsedAddress.hash ||
      parsedAddress.pathname !== "/"
    )
      throw new PlatformApiConfigurationError();
    return parsedAddress.origin;
  } catch (error) {
    if (error instanceof PlatformApiConfigurationError) throw error;
    throw new PlatformApiConfigurationError();
  }
}
