/** Browser routes owned by the organization hub. */
export const ORGANIZATION_ROUTES = {
  registration: "/",
  signIn: "/sign-in",
  onboarding: "/onboarding",
  products: "/products",
  accountSecurity: "/account/security",
  organizationSettings: "/settings",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  verifyEmail: "/verify-email",
} as const;

/** One branch's services and departments in organisation settings. */
export function getBranchSettingsRoute(branchId: string): string {
  return `${ORGANIZATION_ROUTES.organizationSettings}/branches/${encodeURIComponent(branchId)}`;
}
