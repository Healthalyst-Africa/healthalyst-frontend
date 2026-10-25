"use client";

import Link from "next/link";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { FilterBar } from "@healthalyst/ui/components/filter-bar";
import { EmptyOrganizationsIllustration } from "@healthalyst/ui/illustrations/empty-organizations-illustration";
import { EmptySearchIllustration } from "@healthalyst/ui/illustrations/empty-search-illustration";
import type { DataTableState } from "@healthalyst/ui/types/data-table";
import { APPLICATION_ROUTES } from "~/config/application-routes";
import {
  ORGANIZATION_APPLICATION_TABLE_COLUMNS,
  ORGANIZATION_DIRECTORY_TABLE_COLUMNS,
} from "~/features/organization-oversight/config/organization-application-table";
import { useOrganizationApplicationFilters } from "~/features/organization-oversight/hooks/use-organization-application-filters";
import type { OrganizationApplication } from "~/features/organization-oversight/types/organization-types";

type OrganizationApplicationsTableProperties = {
  applications: readonly OrganizationApplication[];
  isLoading: boolean;
  errorMessage?: string;
  onRetry: () => void;
  recentApplicationLimit?: number;
  searchTerm?: string;
};

/** Supplies organisation content, filters and query state to the shared table compositions. */
export function OrganizationApplicationsTable({
  applications,
  isLoading,
  errorMessage,
  onRetry,
  recentApplicationLimit,
  searchTerm = "",
}: OrganizationApplicationsTableProperties) {
  const {
    filterBarProperties,
    clearFilters,
    hasAppliedFilters,
    filteredApplications,
  } = useOrganizationApplicationFilters(applications);
  const isRecentApplications = recentApplicationLimit !== undefined;
  const visibleApplications = isRecentApplications
    ? filteredApplications.slice(0, recentApplicationLimit)
    : filteredApplications;
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
    <div className="flex flex-col gap-4">
      <FilterBar
        {...filterBarProperties}
        accessibleLabel="Filter organisation applications"
        identifier={
          isRecentApplications
            ? "recent-application-filters"
            : "organization-application-filters"
        }
        disabled={isLoading || Boolean(errorMessage)}
      />
      <DataTable
        accessibleLabel={
          searchTerm
            ? `Organisation applications matching “${searchTerm}”`
            : isRecentApplications
              ? "Recent organisation applications"
              : "All organisation applications"
        }
        columns={
          isRecentApplications
            ? ORGANIZATION_APPLICATION_TABLE_COLUMNS
            : ORGANIZATION_DIRECTORY_TABLE_COLUMNS
        }
        state={state}
        getRowIdentifier={(application) => application.id}
        emptyState={
          hasAppliedFilters
            ? {
                illustration: <EmptySearchIllustration />,
                title: "No organisations match these filters",
                description: "Try different filters or clear them.",
                action: (
                  <ActionButton
                    type="button"
                    variant="outline"
                    onClick={clearFilters}
                  >
                    Clear filters
                  </ActionButton>
                ),
              }
            : {
                illustration: searchTerm ? (
                  <EmptySearchIllustration />
                ) : (
                  <EmptyOrganizationsIllustration />
                ),
                title: searchTerm
                  ? "No matching organisations"
                  : "No applications yet",
                description: searchTerm
                  ? "Try a different organisation name or clear your search."
                  : "Organisation registrations will appear here.",
                action: searchTerm ? (
                  <Link href={APPLICATION_ROUTES.organizations}>
                    Clear search
                  </Link>
                ) : undefined,
              }
        }
      />
    </div>
  );
}
