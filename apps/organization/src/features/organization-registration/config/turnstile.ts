export const TURNSTILE_SCRIPT_URL =
  "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

export const TURNSTILE_RENDER_CONFIGURATION = {
  retry: "never",
  "refresh-expired": "manual",
  "refresh-timeout": "manual",
} as const;
export const TURNSTILE_STATUS_MESSAGES = {
  loading: "Loading the human check…",
  ready: "Complete the human check to continue.",
  complete: "Human check complete.",
  expired: "The human check expired. Check again to continue.",
  error:
    "The human check could not be completed. Check again, or refresh the page if it keeps failing.",
} as const;
