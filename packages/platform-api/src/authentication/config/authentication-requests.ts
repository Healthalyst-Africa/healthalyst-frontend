export const BODYLESS_POST_HEADERS = { "Content-Type": null } as const;

export const AUTHENTICATION_ENDPOINTS = {
  refresh: "/v1/auth/refresh",
  profile: "/v1/me",
  signIn: "/v1/auth/login",
  verifySignIn: "/v1/auth/mfa/verify",
  verifyEmail: "/v1/auth/verify-email",
  resendEmail: "/v1/auth/verify-email/resend",
  signOut: "/v1/auth/logout",
  authenticatorSetup: "/v1/auth/mfa/totp/setup",
  authenticatorConfirmation: "/v1/auth/mfa/totp/confirm",
  signOutAll: "/v1/auth/logout-all",
  sessions: "/v1/auth/sessions",
  recoveryCodes: "/v1/auth/mfa/recovery-codes",
  stepUp: "/v1/auth/step-up",
  context: "/v1/auth/context",
  sendPhoneCode: "/v1/auth/phone/send-code",
  verifyPhone: "/v1/auth/phone/verify",
  forgotPassword: "/v1/auth/password/forgot",
  resetPassword: "/v1/auth/password/reset",
  changePassword: "/v1/auth/password/change",
  session: (sessionIdentifier: string) =>
    `/v1/auth/sessions/${encodeURIComponent(sessionIdentifier)}`,
} as const;
