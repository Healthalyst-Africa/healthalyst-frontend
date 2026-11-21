"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useClinicalRecordInvalidation } from "~/features/clinical-record/hooks/use-clinical-record";
import { CLINICAL_RECORD_QUERY_KEYS } from "~/features/clinical-record/services/clinical-record-query-keys";
import { useOrganizationIdentifier } from "~/features/patients/hooks/use-patients";
import type { SensitivityCategory } from "~/features/sensitive-records/schemas/sensitive-record-response-schemas";
import {
  addSensitivityLabel,
  getRecordSensitivity,
  listEmergencyAccessGrants,
  removeSensitivityLabel,
  requestEmergencyAccess,
  reviewEmergencyAccess,
} from "~/features/sensitive-records/services/sensitive-record-service";

export function useRecordSensitivity(patientId: string, isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: CLINICAL_RECORD_QUERY_KEYS.sensitivity(
      organizationIdentifier,
      patientId
    ),
    queryFn: () => getRecordSensitivity(patientId),
    enabled: isEnabled,
  });
}

/**
 * Labels and emergency access change what the reader may see, so each
 * refreshes the whole clinical record.
 */
export function useSensitiveRecordActions(patientId: string) {
  const invalidateRecord = useClinicalRecordInvalidation(patientId);
  return {
    addLabel: useMutation({
      mutationFn: (request: {
        category: SensitivityCategory;
        reason: string;
      }) => addSensitivityLabel(patientId, request),
      onSuccess: invalidateRecord,
    }),
    removeLabel: useMutation({
      mutationFn: ({ labelId, reason }: { labelId: string; reason: string }) =>
        removeSensitivityLabel(patientId, labelId, reason),
      onSuccess: invalidateRecord,
    }),
    requestEmergencyAccess: useMutation({
      mutationFn: (reason: string) => requestEmergencyAccess(patientId, reason),
      onSuccess: invalidateRecord,
    }),
  };
}

export function useEmergencyAccessGrants(
  onlyUnreviewed: boolean,
  isEnabled: boolean
) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: CLINICAL_RECORD_QUERY_KEYS.accessGrants(
      organizationIdentifier,
      onlyUnreviewed
    ),
    queryFn: () => listEmergencyAccessGrants(onlyUnreviewed),
    enabled: isEnabled,
  });
}

export function useReviewEmergencyAccess() {
  const queryClient = useQueryClient();
  const organizationIdentifier = useOrganizationIdentifier();
  return useMutation({
    mutationFn: ({
      grantId,
      outcome,
      note,
    }: {
      grantId: string;
      outcome: "JUSTIFIED" | "NOT_JUSTIFIED";
      note: string;
    }) => reviewEmergencyAccess(grantId, { outcome, note }),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [
          "health-schedule",
          organizationIdentifier,
          "emergency-access",
        ],
      }),
  });
}
