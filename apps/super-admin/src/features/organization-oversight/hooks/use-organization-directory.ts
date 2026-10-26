"use client";

import { useSearchParams } from "next/navigation";
import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";
import { useOrganizationsQuery } from "~/features/organization-oversight/hooks/use-organization-oversight";

export function useOrganizationDirectory(staffIdentity: StaffIdentity) {
  const searchTerm = useSearchParams().get("search")?.trim() ?? "";
  const organizationsQuery = useOrganizationsQuery(staffIdentity, searchTerm);
  return {
    searchTerm,
    organizationsQuery,
    matchingOrganizations: organizationsQuery.data ?? [],
  };
}
