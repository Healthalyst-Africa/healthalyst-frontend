"use client";

import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";
import {
  useOrganizationsQuery,
  useReviewQueueQuery,
} from "~/features/organization-oversight/hooks/use-organization-oversight";
import { getOrganizationOverview } from "~/features/staff-workspace/utilities/organization-overview";

export function useStaffOverview(staffIdentity: StaffIdentity) {
  const organizationsQuery = useOrganizationsQuery(staffIdentity, "");
  const reviewQueue = useReviewQueueQuery(staffIdentity);
  const overview = getOrganizationOverview(organizationsQuery.data ?? []);
  return {
    organizationsQuery,
    reviewQueue,
    ...overview,
    actionableReviewCount: reviewQueue.data?.length ?? 0,
  };
}
