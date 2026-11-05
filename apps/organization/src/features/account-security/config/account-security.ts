/** The Platform API's error code when an action needs a recent authenticator check. */
export const STEP_UP_REQUIRED_ERROR_CODE = "AUTH_STEP_UP_REQUIRED";

/** The Platform API's error code when the current password is wrong. */
export const INVALID_CURRENT_PASSWORD_ERROR_CODE = "AUTH_INVALID_CREDENTIALS";

/** Sent with `POST /v1/auth/password/change`; the API asks for at least one character. */
export const CURRENT_PASSWORD_MAXIMUM_LENGTH = 128;

export const SESSION_DATE_FORMATTER = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lagos",
});

export const PLATFORM_SESSIONS_QUERY_KEY = "platform-sessions";
