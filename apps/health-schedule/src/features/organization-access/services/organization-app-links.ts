import {
  getOrganizationAppAddress,
  ORGANIZATION_APP_ROUTES,
} from "~/config/organization-app";

export type OrganizationAppLinks = {
  registration: string;
  signIn: string;
  application: string;
};

/** Organisation registration and sign-in are owned by the account hub. */
export function getOrganizationAppLinks(): OrganizationAppLinks | null {
  const organizationAppAddress = getOrganizationAppAddress();
  if (!organizationAppAddress) return null;
  return {
    registration: `${organizationAppAddress}${ORGANIZATION_APP_ROUTES.registration}?product=${ORGANIZATION_APP_ROUTES.product}`,
    signIn: `${organizationAppAddress}${ORGANIZATION_APP_ROUTES.signIn}`,
    application: `${organizationAppAddress}${ORGANIZATION_APP_ROUTES.application}`,
  };
}
