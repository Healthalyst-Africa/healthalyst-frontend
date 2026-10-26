import {
  getOrganizationAppAddress,
  ORGANIZATION_APP_ROUTES,
} from "~/config/organization-app";

export type OrganizationAppLinks = {
  registration: string;
  signIn: string;
  application: string;
};

/**
 * Organisation registration and sign-in are owned by the account hub. Both name
 * HealthSchedule so registration pre-selects it and sign-in returns here.
 */
export function getOrganizationAppLinks(): OrganizationAppLinks | null {
  const organizationAppAddress = getOrganizationAppAddress();
  if (!organizationAppAddress) return null;
  return {
    registration: `${organizationAppAddress}${ORGANIZATION_APP_ROUTES.registration}?product=${ORGANIZATION_APP_ROUTES.product}`,
    signIn: `${organizationAppAddress}${ORGANIZATION_APP_ROUTES.signIn}?product=${ORGANIZATION_APP_ROUTES.product}`,
    application: `${organizationAppAddress}${ORGANIZATION_APP_ROUTES.application}`,
  };
}
