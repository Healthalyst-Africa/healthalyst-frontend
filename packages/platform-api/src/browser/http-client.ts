import axios from "axios";

import {
  PLATFORM_HTTP_CONFIGURATION,
  PLATFORM_SESSION_SIGNALS,
} from "../config/browser-config";

const platformHttpClient = axios.create({
  baseURL: PLATFORM_HTTP_CONFIGURATION.basePath,
  timeout: PLATFORM_HTTP_CONFIGURATION.timeoutMilliseconds,
  withCredentials: true,
  headers: { "X-Requested-With": PLATFORM_HTTP_CONFIGURATION.requestedWith },
});

platformHttpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.headers[
        PLATFORM_SESSION_SIGNALS.expiredHeader.toLowerCase()
      ] === "true" &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new Event(PLATFORM_SESSION_SIGNALS.expiredEvent));
    }
    return Promise.reject(error);
  }
);

export function getPlatformHttpClient() {
  return platformHttpClient;
}

export function getPlatformApiAddress(): string {
  return PLATFORM_HTTP_CONFIGURATION.basePath;
}
