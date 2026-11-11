/** Limits from the Platform API's `LoginBody` and `MfaVerifyBody`. */
export const SIGN_IN_LIMITS = {
  identifierMinimum: 3,
  identifierMaximum: 254,
  passwordMaximum: 128,
  recoveryCodeMinimum: 6,
  recoveryCodeMaximum: 32,
} as const;

/** Prefixes the sign-in fields' ids, so focus can find the first invalid one. */
export const SIGN_IN_FORM_IDENTIFIER = "sign-in";

/** The Platform API's codes for a sign-in challenge that has run out. */
export const EXPIRED_CHALLENGE_ERROR_CODES: readonly string[] = [
  "AUTH_TOKEN_EXPIRED",
  "AUTH_TOKEN_INVALID",
];
