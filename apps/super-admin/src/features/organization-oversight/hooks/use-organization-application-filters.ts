"use client";

import { useState } from "react";
import type { FilterBarProperties } from "@healthalyst/ui/types/filter-bar";
import {
  APPLICATION_STATUS_FILTER_OPTIONS,
  ORGANIZATION_TYPE_FILTER_OPTIONS,
} from "~/features/organization-oversight/config/organization-application-table";
import {
  organizationStatusSchema,
  organizationTypeSchema,
} from "~/features/organization-oversight/schemas/organization-schemas";
import type { OrganizationApplication } from "~/features/organization-oversight/types/organization-types";
import type { OrganizationApplicationFilters } from "~/features/organization-oversight/types/organization-application-filters";
import {
  EMPTY_ORGANIZATION_APPLICATION_FILTERS,
  filterOrganizationApplications,
  hasAppliedOrganizationApplicationFilters,
} from "~/features/organization-oversight/utilities/organization-application-filters";

/** Holds the applications table's filters and the matching applications. */
export function useOrganizationApplicationFilters(
  applications: readonly OrganizationApplication[]
) {
  const [filters, setFilters] = useState<OrganizationApplicationFilters>(
    EMPTY_ORGANIZATION_APPLICATION_FILTERS
  );

  function updateFilters(changes: Partial<OrganizationApplicationFilters>) {
    setFilters((currentFilters) => ({ ...currentFilters, ...changes }));
  }

  function clearFilters() {
    setFilters(EMPTY_ORGANIZATION_APPLICATION_FILTERS);
  }

  const filterBarProperties: Omit<
    FilterBarProperties,
    "accessibleLabel" | "identifier"
  > = {
    search: {
      label: "Organisation",
      placeholder: "Search by organisation name",
      value: filters.organizationName,
      onValueChange: (organizationName) => updateFilters({ organizationName }),
    },
    filters: [
      {
        key: "status",
        label: "Status",
        allOptionsLabel: "All statuses",
        options: APPLICATION_STATUS_FILTER_OPTIONS,
        value: filters.status,
        onValueChange: (value) => {
          const statusResult = organizationStatusSchema.safeParse(value);
          updateFilters({
            status: statusResult.success ? statusResult.data : "",
          });
        },
      },
      {
        key: "facility-type",
        label: "Facility type",
        allOptionsLabel: "All facility types",
        options: ORGANIZATION_TYPE_FILTER_OPTIONS,
        value: filters.facilityType,
        onValueChange: (value) => {
          const facilityTypeResult = organizationTypeSchema.safeParse(value);
          updateFilters({
            facilityType: facilityTypeResult.success
              ? facilityTypeResult.data
              : "",
          });
        },
      },
    ],
  };

  return {
    filterBarProperties,
    clearFilters,
    hasAppliedFilters: hasAppliedOrganizationApplicationFilters(filters),
    filteredApplications: filterOrganizationApplications(applications, filters),
  };
}
