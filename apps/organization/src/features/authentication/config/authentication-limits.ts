export const PASSWORD_LIMITS = {
  minimum: 10,
  maximum: 128,
} as const;

/** Limits from the Platform API's `LoginBody` and `MfaVerifyBody`. */
export const SIGN_IN_LIMITS = {
  identifierMinimum: 3,
  identifierMaximum: 254,
  passwordMaximum: PASSWORD_LIMITS.maximum,
  recoveryCodeMaximum: 32,
} as const;
