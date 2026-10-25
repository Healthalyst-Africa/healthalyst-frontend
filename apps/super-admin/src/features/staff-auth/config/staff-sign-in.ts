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
      "Keep these codes somewhere safe. Each code can be used once if you lose access to your authenticator.",
  },
} as const;
