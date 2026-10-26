import { WORKSPACE_OVERVIEW_METRICS } from "~/features/staff-workspace/config/workspace-overview";
import type { OrganizationApplication } from "~/features/organization-oversight/types/organization-types";

export function getOrganizationOverview(
  organizationApplications: OrganizationApplication[]
) {
  const applications = [...organizationApplications].sort(
    (firstApplication, secondApplication) =>
      new Date(
        secondApplication.submittedAt ?? secondApplication.createdAt
      ).getTime() -
      new Date(
        firstApplication.submittedAt ?? firstApplication.createdAt
      ).getTime()
  );
  const metrics = WORKSPACE_OVERVIEW_METRICS.map((metric) => ({
    label: metric.label,
    icon: metric.icon,
    value:
      metric.status === null
        ? applications.length
        : applications.filter(
            (application) => application.status === metric.status
          ).length,
  }));

  return { applications, metrics };
}
