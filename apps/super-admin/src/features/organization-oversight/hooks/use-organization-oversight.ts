"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { StaffIdentity } from "~/features/staff-auth/api/staff-service";
import {
  claimOrganizationApplication,
  getOrganizationDetail,
  getOrganizationDocumentViewUrl,
  listOrganizationApplications,
  listReviewQueue,
  recordReviewDecision,
  releaseOrganizationApplication,
  type ReviewDecision,
} from "~/features/organization-oversight/api/organization-service";
import { organizationQueryKeys } from "~/features/organization-oversight/api/organization-query-keys";

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

export function useOrganizationDocumentViewUrlMutation() {
  return useMutation({
    mutationFn: ({
      organizationId,
      documentId,
    }: {
      organizationId: string;
      documentId: string;
    }) => getOrganizationDocumentViewUrl(organizationId, documentId),
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
