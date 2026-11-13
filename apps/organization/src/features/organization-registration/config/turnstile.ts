export const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export const TURNSTILE_RENDER_CONFIGURATION = {
  retry: "never",
  "refresh-expired": "manual",
  "refresh-timeout": "manual",
} as const;

/**
 * A challenge that fails for a passing reason is run again a limited number
 * of times before the person is asked to check again.
 */
export const TURNSTILE_AUTOMATIC_RETRY = {
  attemptLimit: 2,
  delayMilliseconds: 2000,
} as const;

/**
 * Cloudflare's client-side error codes that a retry cannot fix, grouped by
 * cause. Every other code is treated as a failed challenge that may pass on
 * another attempt. https://developers.cloudflare.com/turnstile/troubleshooting/client-side-errors/error-codes/
 */
export const TURNSTILE_ERROR_CODE_GROUPS = {
  "site-not-allowed": ["110100", "110110", "110200", "400020", "400070"],
  "browser-not-supported": ["110500", "110510"],
  "device-clock": ["200100"],
  blocked: ["200500"],
} as const;

export const TURNSTILE_STATUS_MESSAGES = {
  loading: "Loading the human check…",
  retrying: "Checking again…",
  ready: "Complete the human check to continue.",
  complete: "Human check complete.",
  expired: "The human check expired. Check again to continue.",
} as const;

export const TURNSTILE_FAILURE_MESSAGES = {
  "site-not-allowed":
    "The human check is not set up for this web address. Please contact HealthAlyst support.",
  "browser-not-supported":
    "This browser cannot complete the human check. Update it or use another browser.",
  "device-clock":
    "The human check failed because this device's date and time are wrong. Correct them, then check again.",
  blocked:
    "Something in this browser blocked the human check, such as an ad blocker or privacy extension. Allow challenges.cloudflare.com, then check again.",
  "challenge-failed":
    "The human check could not be completed. Check again, or refresh the page if it keeps failing.",
} as const;
