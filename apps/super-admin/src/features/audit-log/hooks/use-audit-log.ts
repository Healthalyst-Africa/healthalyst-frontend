"use client";

import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { auditLogQueryKeys } from "~/features/audit-log/config/audit-log";
import {
  checkAuditChains,
  searchAuditEvents,
} from "~/features/audit-log/services/audit-log-service";
import type { AuditSearch } from "~/features/audit-log/types/audit-log";
import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";

export function useAuditEventsQuery(
  staffIdentity: StaffIdentity,
  search: AuditSearch,
  enabled: boolean
) {
  return useInfiniteQuery({
    queryKey: auditLogQueryKeys.events(staffIdentity.staffAccountId, search),
    queryFn: ({ pageParam }) => searchAuditEvents(search, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.page.hasMore && lastPage.page.nextCursor
        ? lastPage.page.nextCursor
        : undefined,
    enabled,
  });
}

/** Marks a check of every chain rather than one organisation's. */
const ALL_CHAINS = "all";

/**
 * The integrity check recomputes every fingerprint and can be slow, so it runs
 * only once someone asks for it. `organizationId` undefined checks every chain.
 */
export function useAuditChainCheckQuery(
  staffIdentity: StaffIdentity,
  requestedCheck: { organizationId?: string } | null
) {
  const organizationId = requestedCheck?.organizationId;
  return useQuery({
    queryKey: auditLogQueryKeys.chains(
      staffIdentity.staffAccountId,
      organizationId ?? ALL_CHAINS
    ),
    queryFn: () => checkAuditChains(organizationId),
    enabled: requestedCheck !== null,
    staleTime: 0,
    gcTime: 0,
    retry: false,
  });
}
