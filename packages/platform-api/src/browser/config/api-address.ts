import {
  parsePlatformApiAddress,
  parseProductApiAddress,
} from "@healthalyst/config/platform-api-environment";
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

/**
 * Services supply /v1 paths. Configuration is the product API's origin, or
 * the path of the app's own proxy to it, such as `/health-schedule-api`.
 */
export function validateProductApiAddress(
  configuredAddress: string | undefined
): string {
  return parseProductApiAddress(configuredAddress, "The product API address");
}
