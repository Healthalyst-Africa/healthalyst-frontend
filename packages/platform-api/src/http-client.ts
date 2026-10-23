import axios from "axios";

const PLATFORM_BACKEND_FOR_FRONTEND_ADDRESS = "/api/platform";

export class PlatformApiConfigurationError extends Error {
  constructor() {
    super(
      "The same-origin HealthAlyst Platform session service is unavailable."
    );
    this.name = "PlatformApiConfigurationError";
  }
}

const platformHttpClient = axios.create({
  baseURL: PLATFORM_BACKEND_FOR_FRONTEND_ADDRESS,
  timeout: 30_000,
  withCredentials: true,
  headers: { "X-Requested-With": "healthalyst" },
});

platformHttpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.headers["x-platform-session-expired"] === "true" &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new Event("healthalyst-platform-session-expired"));
    }
    return Promise.reject(error);
  }
);

export function getPlatformHttpClient() {
  return platformHttpClient;
}

export function getPlatformApiAddress(): string {
  return PLATFORM_BACKEND_FOR_FRONTEND_ADDRESS;
}
