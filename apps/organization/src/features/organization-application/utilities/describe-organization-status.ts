import { ORGANIZATION_STATUS_LABELS } from "~/features/organization-application/config/application-presentation";

export function describeOrganizationStatus(status: string): string {
  return (
    ORGANIZATION_STATUS_LABELS[status] ??
    status.charAt(0) + status.slice(1).toLowerCase().replace(/_/g, " ")
  );
}
