import { PLATFORM_SESSION_SIGNALS } from "../config/browser-config";
import { getPlatformApiBrowserAddress } from "@healthalyst/config/platform-api-environment";
import {
  createPlatformClient,
  type PlatformClient,
} from "./create-platform-client";
import { PlatformApiConfigurationError } from "./errors/platform-api-configuration-error";

let browserPlatformClient: PlatformClient | undefined;

/** Never share browser credentials through a server process singleton. */
export function getPlatformClient(): PlatformClient {
  if (typeof window === "undefined")
    throw new Error(
      "Platform browser authentication cannot run on the server."
    );
  browserPlatformClient ??= createPlatformClient({
    address: getPlatformApiAddress(),
    onSessionExpired: () =>
      window.dispatchEvent(new Event(PLATFORM_SESSION_SIGNALS.expiredEvent)),
    onContextChanged: () =>
      window.dispatchEvent(
        new Event(PLATFORM_SESSION_SIGNALS.contextChangedEvent)
      ),
  });
  return browserPlatformClient;
}

export function getPlatformHttpClient() {
  return getPlatformClient().httpClient;
}

export function getPlatformApiAddress(): string {
  try {
    return getPlatformApiBrowserAddress();
  } catch {
    throw new PlatformApiConfigurationError();
  }
}

export function clearPlatformSession() {
  getPlatformClient().clearSession();
}

/** Each product app owns one client per product API; all refreshes use Platform API. */
export function createProductHttpClient(productAddress: string) {
  return getPlatformClient().createProductHttpClient(productAddress);
}
