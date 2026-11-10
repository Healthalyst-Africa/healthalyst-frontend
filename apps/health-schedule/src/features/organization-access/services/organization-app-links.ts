import {
  getOrganizationAppAddress,
  ORGANIZATION_APP_ROUTES,
} from "~/config/organization-app";

export type OrganizationAppLinks = {
  registration: string;
  signIn: string;
  forgotPassword: string;
  application: string;
  accountSecurity: string;
  organizationSettings: string;
  team: string;
  teamRoles: string;
  products: string;
};

/**
 * Organisation registration, account set-up, settings and account security
 * are owned by the account hub; HealthSchedule signs people in itself. Links
 * name HealthSchedule so registration pre-selects it and account security
 * returns here. Every hub page opens in a new browser window.
 */
export function getOrganizationAppLinks(): OrganizationAppLinks | null {
  const organizationAppAddress = getOrganizationAppAddress();
  if (!organizationAppAddress) return null;
  return {
    registration: `${organizationAppAddress}${ORGANIZATION_APP_ROUTES.registration}?product=${ORGANIZATION_APP_ROUTES.product}`,
    signIn: `${organizationAppAddress}${ORGANIZATION_APP_ROUTES.signIn}?product=${ORGANIZATION_APP_ROUTES.product}`,
    forgotPassword: `${organizationAppAddress}${ORGANIZATION_APP_ROUTES.forgotPassword}`,
    application: `${organizationAppAddress}${ORGANIZATION_APP_ROUTES.application}`,
    accountSecurity: `${organizationAppAddress}${ORGANIZATION_APP_ROUTES.accountSecurity}?product=${ORGANIZATION_APP_ROUTES.product}`,
    organizationSettings: `${organizationAppAddress}${ORGANIZATION_APP_ROUTES.organizationSettings}`,
    team: `${organizationAppAddress}${ORGANIZATION_APP_ROUTES.team}`,
    teamRoles: `${organizationAppAddress}${ORGANIZATION_APP_ROUTES.teamRoles}`,
    products: `${organizationAppAddress}${ORGANIZATION_APP_ROUTES.products}`,
  };
}
