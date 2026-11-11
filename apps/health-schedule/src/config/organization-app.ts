import { getOrganizationHubAddress } from "@healthalyst/config/environment";

export const ORGANIZATION_APP_ROUTES = {
  registration: "/",
  signIn: "/sign-in",
  forgotPassword: "/forgot-password",
  application: "/onboarding",
  accountSecurity: "/account/security",
  organizationSettings: "/settings",
  team: "/team",
  teamRoles: "/team/roles",
  products: "/products",
  product: "healthschedule",
} as const;

export function getOrganizationAppAddress(): string | undefined {
  return getOrganizationHubAddress();
}
