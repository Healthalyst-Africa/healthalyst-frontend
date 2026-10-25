import Link from "next/link";
import { DataTable } from "@healthalyst/ui/components/data-table";
import type { DataTableState } from "@healthalyst/ui/types/data-table";
import { APPLICATION_ROUTES } from "~/config/application-routes";
import {
  ORGANIZATION_APPLICATION_TABLE_COLUMNS,
  ORGANIZATION_DIRECTORY_TABLE_COLUMNS,
} from "~/features/organization-oversight/config/organization-application-table";
import type { OrganizationApplication } from "~/features/organization-oversight/types/organization-types";

type OrganizationApplicationsTableProperties = {
  applications: readonly OrganizationApplication[];
  isLoading: boolean;
  errorMessage?: string;
  onRetry: () => void;
  recentApplicationLimit?: number;
  searchTerm?: string;
};

/** Supplies organisation content and query state to the shared table composition. */
export function OrganizationApplicationsTable({
  applications,
  isLoading,
  errorMessage,
  onRetry,
  recentApplicationLimit,
  searchTerm = "",
}: OrganizationApplicationsTableProperties) {
  const visibleApplications =
    recentApplicationLimit === undefined
      ? applications
      : applications.slice(0, recentApplicationLimit);
  const isRecentApplications = recentApplicationLimit !== undefined;
  const applicationNoun =
    applications.length === 1 ? "application" : "applications";
  const state: DataTableState<OrganizationApplication> = errorMessage
    ? {
        status: "error",
        title: "Applications could not be loaded",
        description: errorMessage,
        retryLabel: "Retry",
        onRetry,
      }
    : isLoading
      ? { status: "loading", label: "Loading organisation applications…" }
      : { status: "ready", rows: visibleApplications };

  return (
    <DataTable
      title={isRecentApplications ? "Recent applications" : "All applications"}
      description={
        searchTerm
          ? `Applications matching “${searchTerm}”.`
          : isRecentApplications
            ? "Latest registrations and their current status."
            : "Organisation registrations and their current status."
      }
      columns={
        isRecentApplications
          ? ORGANIZATION_APPLICATION_TABLE_COLUMNS
          : ORGANIZATION_DIRECTORY_TABLE_COLUMNS
      }
      state={state}
      getRowIdentifier={(application) => application.id}
      emptyState={{
        title: searchTerm ? "No matching organisations" : "No applications yet",
        description: searchTerm
          ? "Try a different organisation name or clear your search."
          : "Organisation registrations will appear here.",
        action: searchTerm ? (
          <Link href={APPLICATION_ROUTES.organizations}>Clear search</Link>
        ) : undefined,
      }}
      summary={
        isRecentApplications
          ? `Showing ${visibleApplications.length} of ${applications.length} ${applicationNoun}`
          : `${applications.length} ${applicationNoun}${searchTerm ? " found" : " recorded"}`
      }
    />
  );
}
