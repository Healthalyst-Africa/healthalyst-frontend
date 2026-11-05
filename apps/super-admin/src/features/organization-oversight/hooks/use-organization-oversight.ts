"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { StaffIdentity } from "~/features/staff-auth/types/staff-identity";
import {
  addOrganizationInternalNote,
  assignOrganizationOwner,
  claimOrganizationApplication,
  deactivateOrganization,
  getOrganizationDetail,
  getOrganizationDocumentViewAddress,
  listOrganizationApplications,
  listReviewQueue,
  recordReviewDecision,
  reinstateOrganization,
  releaseOrganizationApplication,
  suspendOrganization,
} from "~/features/organization-oversight/services/organization-service";
import type { ReviewDecision } from "~/features/organization-oversight/types/review-types";
import type { OrganizationLifecycleAction } from "~/features/organization-oversight/config/organization-lifecycle";
import { organizationQueryKeys } from "~/features/organization-oversight/services/organization-query-keys";

export function useOrganizationsQuery(
  staffIdentity: StaffIdentity,
  searchTerm: string
) {
  return useQuery({
    queryKey: organizationQueryKeys.search(
      staffIdentity.staffAccountId,
      searchTerm
    ),
    queryFn: () => listOrganizationApplications(searchTerm),
  });
}

export function useReviewQueueQuery(staffIdentity: StaffIdentity) {
  return useQuery({
    queryKey: organizationQueryKeys.reviewQueue(staffIdentity.staffAccountId),
    queryFn: () => listReviewQueue(),
  });
}

export function useOrganizationDetailQuery(
  staffIdentity: StaffIdentity,
  organizationId: string
) {
  return useQuery({
    queryKey: organizationQueryKeys.detail(
      staffIdentity.staffAccountId,
      organizationId
    ),
    queryFn: () => getOrganizationDetail(organizationId),
  });
}

export function useClaimOrganizationMutation(staffIdentity: StaffIdentity) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: claimOrganizationApplication,
    onSuccess: async (_result, organizationId) => {
      await invalidateOrganizationReviewData(
        queryClient,
        staffIdentity,
        organizationId
      );
    },
  });
}

export function useReleaseOrganizationMutation(staffIdentity: StaffIdentity) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: releaseOrganizationApplication,
    onSuccess: async (_result, organizationId) => {
      await invalidateOrganizationReviewData(
        queryClient,
        staffIdentity,
        organizationId
      );
    },
  });
}

export function useReviewDecisionMutation(staffIdentity: StaffIdentity) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      organizationId,
      decision,
    }: {
      organizationId: string;
      decision: ReviewDecision;
    }) => recordReviewDecision(organizationId, decision),
    onSuccess: async (_result, variables) => {
      await invalidateOrganizationReviewData(
        queryClient,
        staffIdentity,
        variables.organizationId
      );
    },
  });
}

const LIFECYCLE_REQUESTS: Record<
  OrganizationLifecycleAction,
  (organizationId: string, reason: string, version: number) => Promise<void>
> = {
  suspend: suspendOrganization,
  reinstate: reinstateOrganization,
  deactivate: deactivateOrganization,
};

export function useOrganizationLifecycleMutation(staffIdentity: StaffIdentity) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      action,
      organizationId,
      reason,
      version,
    }: {
      action: OrganizationLifecycleAction;
      organizationId: string;
      reason: string;
      version: number;
    }) => LIFECYCLE_REQUESTS[action](organizationId, reason, version),
    onSuccess: async (_result, variables) => {
      await invalidateOrganizationReviewData(
        queryClient,
        staffIdentity,
        variables.organizationId
      );
    },
  });
}

export function useOrganizationInternalNoteMutation(
  staffIdentity: StaffIdentity
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      organizationId,
      note,
    }: {
      organizationId: string;
      note: string;
    }) => addOrganizationInternalNote(organizationId, note),
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.detail(
          staffIdentity.staffAccountId,
          variables.organizationId
        ),
      });
    },
  });
}

export function useAssignOrganizationOwnerMutation(
  staffIdentity: StaffIdentity
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      organizationId,
      userId,
      reason,
    }: {
      organizationId: string;
      userId: string;
      reason: string;
    }) => assignOrganizationOwner(organizationId, { userId, reason }),
    onSuccess: async (_result, variables) => {
      await queryClient.invalidateQueries({
        queryKey: organizationQueryKeys.detail(
          staffIdentity.staffAccountId,
          variables.organizationId
        ),
      });
    },
  });
}

export function useOrganizationDocumentViewAddressMutation() {
  return useMutation({
    mutationFn: ({
      organizationId,
      documentId,
    }: {
      organizationId: string;
      documentId: string;
    }) => getOrganizationDocumentViewAddress(organizationId, documentId),
  });
}

async function invalidateOrganizationReviewData(
  queryClient: ReturnType<typeof useQueryClient>,
  staffIdentity: StaffIdentity,
  organizationId: string
) {
  await Promise.all([
    queryClient.invalidateQueries({
      queryKey: organizationQueryKeys.all(staffIdentity.staffAccountId),
    }),
    queryClient.invalidateQueries({
      queryKey: organizationQueryKeys.reviewQueue(staffIdentity.staffAccountId),
    }),
    queryClient.invalidateQueries({
      queryKey: organizationQueryKeys.detail(
        staffIdentity.staffAccountId,
        organizationId
      ),
    }),
  ]);
}
