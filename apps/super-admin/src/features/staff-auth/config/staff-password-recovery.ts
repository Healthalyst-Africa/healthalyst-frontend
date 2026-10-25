/**
 * The Platform API requires at least 12 characters for staff and other
 * privileged accounts, and accepts at most 128.
 */
export const STAFF_PASSWORD_LIMITS = {
  minimum: 12,
  maximum: 128,
} as const;

export const STAFF_EMAIL_ADDRESS_MAXIMUM_LENGTH = 254;
