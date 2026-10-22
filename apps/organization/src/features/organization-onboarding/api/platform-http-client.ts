import axios from "axios";

const platformApiAddress =
  process.env.NEXT_PUBLIC_HEALTHALYST_PLATFORM_API_URL?.trim();

export class PlatformApiConfigurationError extends Error {
  constructor() {
    super(
      "The HealthAlyst Platform API address is not configured. Set NEXT_PUBLIC_HEALTHALYST_PLATFORM_API_URL."
    );
    this.name = "PlatformApiConfigurationError";
  }
}

/*
 * Calls go straight from the browser to the Platform API. If its CORS policy
 * does not allow this site yet, the browser blocks the response: the console
 * and network panel show the CORS error, and the request fails without a
 * response.
 *
 * The timeout allows for the development server waking from sleep.
 */
const platformHttpClient = platformApiAddress
  ? axios.create({
      baseURL: platformApiAddress.replace(/\/$/, ""),
      timeout: 30_000,
      withCredentials: false,
      headers: { "Content-Type": "application/json" },
    })
  : null;

export function getPlatformHttpClient() {
  if (!platformHttpClient) {
    throw new PlatformApiConfigurationError();
  }

  return platformHttpClient;
}

export function getPlatformApiAddress(): string | null {
  return platformApiAddress ? platformApiAddress.replace(/\/$/, "") : null;
}
