/*
 * Registration, sign-in and every other organisation screen live in the
 * shared HealthAlyst organisation app, not in HealthSchedule. Its public
 * address comes from `NEXT_PUBLIC_HEALTHALYST_ORGANIZATION_APP_URL`.
 */
const organizationAppAddress =
  process.env.NEXT_PUBLIC_HEALTHALYST_ORGANIZATION_APP_URL?.trim().replace(
    /\/$/,
    ""
  );

/** The product name the organisation app reads to pre-select HealthSchedule. */
const PRODUCT_QUERY_VALUE = "healthschedule";

export type OrganizationAppLinks = {
  registration: string;
  signIn: string;
};

/** Links into the organisation app, or `null` when its address is not set. */
export function getOrganizationAppLinks(): OrganizationAppLinks | null {
  if (!organizationAppAddress) {
    return null;
  }

  return {
    registration: `${organizationAppAddress}/?product=${PRODUCT_QUERY_VALUE}`,
    signIn: `${organizationAppAddress}/sign-in`,
  };
}
