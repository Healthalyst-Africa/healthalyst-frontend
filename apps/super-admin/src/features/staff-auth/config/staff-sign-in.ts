export const STAFF_AUTHENTICATOR_CONFIGURATION = {
  codeLength: 6,
  recoveryCodeMinimumLength: 6,
  recoveryCodeMaximumLength: 32,
  imageSize: 176,
} as const;

export const STAFF_SIGN_IN_HEADINGS = {
  password: {
    title: "Staff sign in",
    description:
      "Use your HealthAlyst staff account to open the company dashboard.",
  },
  verification: {
    title: "Enter your sign-in code",
    description:
      "Open your authenticator app and enter the code for HealthAlyst.",
  },
  "enrollment-loading": {
    title: "Protect your account",
    description:
      "Add HealthAlyst to an authenticator app. You will use a code from it each time you sign in.",
  },
  enrollment: {
    title: "Protect your account",
    description:
      "Add HealthAlyst to an authenticator app. You will use a code from it each time you sign in.",
  },
  "recovery-codes": {
    title: "Save your recovery codes",
    description:
      "Use one of these to sign in if you lose your phone or cannot open your authenticator app.",
  },
} as const;

/** The text file staff recovery codes download as, and its first line. */
export const STAFF_RECOVERY_CODES_FILE = {
  name: "healthalyst-recovery-codes.txt",
  heading: "HealthAlyst recovery codes",
} as const;
