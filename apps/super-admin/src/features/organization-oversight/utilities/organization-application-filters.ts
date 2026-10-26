import type { OrganizationApplication } from "~/features/organization-oversight/types/organization-types";
import type { OrganizationApplicationFilters } from "~/features/organization-oversight/types/organization-application-filters";

export const EMPTY_ORGANIZATION_APPLICATION_FILTERS: OrganizationApplicationFilters =
  { organizationName: "", status: "", facilityType: "" };

export function hasAppliedOrganizationApplicationFilters(
  filters: OrganizationApplicationFilters
): boolean {
  return Boolean(
    filters.organizationName.trim() || filters.status || filters.facilityType
  );
}

export function filterOrganizationApplications(
  applications: readonly OrganizationApplication[],
  filters: OrganizationApplicationFilters
): OrganizationApplication[] {
  const organizationName = filters.organizationName
    .trim()
    .toLocaleLowerCase("en-NG");
  return applications.filter(
    (application) =>
      (!filters.status || application.status === filters.status) &&
      (!filters.facilityType || application.type === filters.facilityType) &&
      (!organizationName ||
        [application.displayName, application.legalName].some((name) =>
          name.toLocaleLowerCase("en-NG").includes(organizationName)
        ))
  );
}
