import { PLATFORM_HTTP_CONFIGURATION } from "../../config/browser-config";

export const ACCESS_TOKEN_REFRESH_WINDOW_MILLISECONDS = 30_000;
export const SESSION_LOCK_LEASE_MILLISECONDS = 35_000;
export const SESSION_LOCK_WAIT_MILLISECONDS = 35_000;
export const SESSION_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;
export const AUTHENTICATION_CHALLENGE_COOKIE_MAX_AGE_SECONDS = 60 * 10;
export const AUTHENTICATION_CHALLENGE_COOKIE_PATH = `${PLATFORM_HTTP_CONFIGURATION.basePath}/v1/auth`;
export const REDIS_SESSION_PREFIX = "healthalyst:platform-bff:session";
export const REDIS_LOCK_PREFIX = "healthalyst:platform-bff:refresh-lock";

export const SESSION_REFRESH_POLL_INTERVAL_MILLISECONDS = 100;
export const REDIS_CONNECTION_CONFIGURATION = {
  connectionTimeoutMilliseconds: 5_000,
  retriesPerRequest: 1,
  retryDelayMilliseconds: 100,
  maximumRetryDelayMilliseconds: 1_000,
} as const;
