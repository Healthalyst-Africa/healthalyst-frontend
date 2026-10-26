import { parsePlatformApiAddress } from "@healthalyst/config/platform-api-environment";
import { PlatformApiConfigurationError } from "../errors/platform-api-configuration-error";

/** Services supply /v1 paths. Configuration is an origin or the app root. */
export function validatePlatformApiAddress(
  configuredAddress: string | undefined
): string {
  try {
    return parsePlatformApiAddress(configuredAddress);
  } catch {
    throw new PlatformApiConfigurationError();
  }
}
