import { getHealthScheduleApiBrowserAddress } from "@healthalyst/config/platform-api-environment";
import { createProductHttpClient } from "@healthalyst/platform-api/http-client";

type HealthScheduleHttpClient = ReturnType<typeof createProductHttpClient>;

let browserHealthScheduleHttpClient: HealthScheduleHttpClient | undefined;

/**
 * The one client for the HealthSchedule API. It sends the HealthAlyst access
 * token as a bearer token and renews it through the Platform API; it never
 * sends cookies. The address is the API's origin or this app's proxy path.
 */
export function getHealthScheduleHttpClient(): HealthScheduleHttpClient {
  if (typeof window === "undefined")
    throw new Error("HealthSchedule API requests run only in the browser.");
  browserHealthScheduleHttpClient ??= createProductHttpClient(
    getHealthScheduleApiBrowserAddress()
  );
  return browserHealthScheduleHttpClient;
}
