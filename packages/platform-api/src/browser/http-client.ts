import { PLATFORM_SESSION_SIGNALS } from "../config/browser-config";
import {
  createPlatformClient,
  type PlatformClient,
} from "./create-platform-client";
import { validatePlatformApiAddress } from "./config/api-address";

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
  return validatePlatformApiAddress(
    process.env.NEXT_PUBLIC_HEALTHALYST_PLATFORM_API_URL
  );
}

export function clearPlatformSession() {
  getPlatformClient().clearSession();
}

/** Each product app owns one client per product API; all refreshes use Platform API. */
export function createProductHttpClient(productAddress: string) {
  return getPlatformClient().createProductHttpClient(productAddress);
}
