import {
  getOrganizationAppAddress,
  ORGANIZATION_APP_ROUTES,
} from "~/config/organization-app";

export type OrganizationAppLinks = {
  registration: string;
  signIn: string;
  application: string;
  accountSecurity: string;
  organizationSettings: string;
};

/**
 * Organisation registration, sign-in, settings and account security are
 * owned by the account hub. Links name HealthSchedule so registration pre-selects it, and
 * sign-in and account security return here.
 */
export function getOrganizationAppLinks(): OrganizationAppLinks | null {
  const organizationAppAddress = getOrganizationAppAddress();
  if (!organizationAppAddress) return null;
  return {
    registration: `${organizationAppAddress}${ORGANIZATION_APP_ROUTES.registration}?product=${ORGANIZATION_APP_ROUTES.product}`,
    signIn: `${organizationAppAddress}${ORGANIZATION_APP_ROUTES.signIn}?product=${ORGANIZATION_APP_ROUTES.product}`,
    application: `${organizationAppAddress}${ORGANIZATION_APP_ROUTES.application}`,
    accountSecurity: `${organizationAppAddress}${ORGANIZATION_APP_ROUTES.accountSecurity}?product=${ORGANIZATION_APP_ROUTES.product}`,
    organizationSettings: `${organizationAppAddress}${ORGANIZATION_APP_ROUTES.organizationSettings}`,
  };
}
