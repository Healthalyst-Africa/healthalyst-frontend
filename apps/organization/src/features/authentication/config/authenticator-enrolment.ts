export const CODE_LENGTH = 6;
export const TOTAL_STEPS = 2;
export const RECOVERY_CODES_FILE_NAME = "healthalyst-recovery-codes.txt";

/** Codes that mean the enrolment token can no longer be used. */
export const EXPIRED_ENROLMENT_CODES = new Set([
  "AUTH_TOKEN_EXPIRED",
  "AUTH_TOKEN_INVALID",
  "AUTH_TOKEN_MISSING",
  "MFA_ALREADY_CONFIRMED",
]);

export const SET_UP_STEPS = [
  {
    title: "Get an authenticator app",
    description:
      "Google Authenticator, Microsoft Authenticator or any app that shows 6-digit codes.",
  },
  {
    title: "Add HealthAlyst to the app",
    description:
      "Scan the QR code with the app, or use the setup key if you cannot scan it.",
  },
  {
    title: "Enter the code it shows",
    description: "The code changes every 30 seconds.",
  },
] as const;
