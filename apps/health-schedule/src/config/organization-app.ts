import { getOrganizationHubAddress } from "@healthalyst/config/environment";

export const ORGANIZATION_APP_ROUTES = {
  registration: "/",
  signIn: "/sign-in",
  application: "/onboarding",
  product: "healthschedule",
} as const;

export function getOrganizationAppAddress(): string | undefined {
  return getOrganizationHubAddress();
}
