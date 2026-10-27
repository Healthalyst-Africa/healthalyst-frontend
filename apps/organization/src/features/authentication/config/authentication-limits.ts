/**
 * The Platform API asks privileged accounts, which include organisation
 * owners, for at least 12 characters at registration and password reset.
 */
export const PASSWORD_LIMITS = {
  minimum: 12,
  maximum: 128,
} as const;

/** Limits from the Platform API's `LoginBody` and `MfaVerifyBody`. */
export const SIGN_IN_LIMITS = {
  identifierMinimum: 3,
  identifierMaximum: 254,
  passwordMaximum: PASSWORD_LIMITS.maximum,
  recoveryCodeMaximum: 32,
} as const;
