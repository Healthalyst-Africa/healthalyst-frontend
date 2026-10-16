"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { StaffIdentity } from "~/features/staff-auth/api/staff-service";
import {
  createEvidenceRequest,
  downloadEvidenceDocument,
  listEvidenceRequests,
  listOrganizationApplications,
  listReviewQueue,
  recordReviewDecision,
  reviewEvidenceRequest,
  type RegistrationStatus,
} from "~/features/organization-oversight/api/organization-service";
import { organizationQueryKeys } from "~/features/organization-oversight/api/organization-query-keys";

export function useOrganizationsQuery(staffIdentity: StaffIdentity) {
  return useQuery({
    queryKey: organizationQueryKeys.all(staffIdentity.staffAccountId),
    queryFn: () => listOrganizationApplications(),
  });
}

export function useReviewQueueQuery(staffIdentity: StaffIdentity) {
  return useQuery({
    queryKey: organizationQueryKeys.reviewQueue(staffIdentity.staffAccountId),
    queryFn: () => listReviewQueue(),
  });
}

export function useEvidenceQuery(
  staffIdentity: StaffIdentity,
  applicationId: string
) {
  return useQuery({
    queryKey: organizationQueryKeys.evidence(
      staffIdentity.staffAccountId,
      applicationId
    ),
    queryFn: () => listEvidenceRequests(applicationId),
  });
}

export function useReviewDecisionMutation(staffIdentity: StaffIdentity) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      applicationId,
      status,
      note,
    }: {
      applicationId: string;
      status: Exclude<RegistrationStatus, "PENDING_REVIEW">;
      note: string;
    }) => recordReviewDecision(applicationId, status, note),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: organizationQueryKeys.all(staffIdentity.staffAccountId),
        }),
        queryClient.invalidateQueries({
          queryKey: organizationQueryKeys.reviewQueue(
            staffIdentity.staffAccountId
          ),
        }),
      ]);
    },
  });
}

export function useCreateEvidenceMutation(
  staffIdentity: StaffIdentity,
  applicationId: string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      title,
      instructions,
    }: {
      title: string;
      instructions: string;
    }) => createEvidenceRequest(applicationId, title, instructions),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: organizationQueryKeys.evidence(
            staffIdentity.staffAccountId,
            applicationId
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: organizationQueryKeys.reviewQueue(
            staffIdentity.staffAccountId
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: organizationQueryKeys.all(staffIdentity.staffAccountId),
        }),
      ]);
    },
  });
}

export function useReviewEvidenceMutation(
  staffIdentity: StaffIdentity,
  applicationId: string
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      accepted,
      note,
    }: {
      requestId: string;
      accepted: boolean;
      note: string;
    }) => reviewEvidenceRequest(requestId, accepted, note),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: organizationQueryKeys.evidence(
            staffIdentity.staffAccountId,
            applicationId
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: organizationQueryKeys.reviewQueue(
            staffIdentity.staffAccountId
          ),
        }),
        queryClient.invalidateQueries({
          queryKey: organizationQueryKeys.all(staffIdentity.staffAccountId),
        }),
      ]);
    },
  });
}

export function useDownloadEvidenceMutation() {
  return useMutation({
    mutationFn: ({
      applicationId,
      documentId,
    }: {
      applicationId: string;
      documentId: string;
    }) => downloadEvidenceDocument(applicationId, documentId),
  });
}
