"use client";

import {
  useMutation,
  useQueries,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  addCoverage,
  endAllergy,
  getAllergies,
  listCoverage,
  recordAllergy,
  recordEligibility,
  recordNoKnownAllergies,
  updateCoverage,
} from "~/features/patients/services/patient-care-service";
import {
  checkForDuplicates,
  getPatientDetail,
  listIncompletePatients,
  PATIENT_QUERY_KEYS,
  registerPatient,
  searchPatientRecords,
  updatePatient,
} from "~/features/patients/services/patient-service";
import type { PatientCoverage } from "~/features/patients/schemas/patient-response-schemas";
import { useWorkspace } from "~/shared/workspace/workspace-context";

export function useOrganizationIdentifier() {
  return useWorkspace().platformSession.activeContext.organizationId ?? "";
}

/**
 * Every patient query of the organisation, including the front desk and
 * queues, which show names, allergies and cover.
 */
export function usePatientInvalidation() {
  const queryClient = useQueryClient();
  const organizationIdentifier = useOrganizationIdentifier();
  return () =>
    queryClient.invalidateQueries({
      queryKey: ["health-schedule", organizationIdentifier],
    });
}

export function usePatientSearchResults(
  searchText: string,
  isEnabled: boolean
) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: PATIENT_QUERY_KEYS.search(organizationIdentifier, searchText),
    queryFn: () => searchPatientRecords(searchText),
    enabled: isEnabled,
  });
}

export function useIncompletePatients(isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: PATIENT_QUERY_KEYS.incomplete(organizationIdentifier),
    queryFn: listIncompletePatients,
    enabled: isEnabled,
  });
}

export function usePatientDetail(patientId: string, isEnabled = true) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: PATIENT_QUERY_KEYS.detail(organizationIdentifier, patientId),
    queryFn: () => getPatientDetail(patientId),
    enabled: isEnabled && patientId !== "",
  });
}

/** Several records at once, such as both sides of each recent merge. */
export function usePatientDetails(patientIds: readonly string[]) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQueries({
    queries: patientIds.map((patientId) => ({
      queryKey: PATIENT_QUERY_KEYS.detail(organizationIdentifier, patientId),
      queryFn: () => getPatientDetail(patientId),
    })),
  });
}

export function useAllergies(patientId: string, isEnabled = true) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: PATIENT_QUERY_KEYS.allergies(organizationIdentifier, patientId),
    queryFn: () => getAllergies(patientId),
    enabled: isEnabled,
  });
}

export function useCoverage(patientId: string, isEnabled = true) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: PATIENT_QUERY_KEYS.coverage(organizationIdentifier, patientId),
    queryFn: () => listCoverage(patientId),
    enabled: isEnabled,
  });
}

/**
 * Possible duplicates of what has been typed so far. The request comes as
 * JSON text, "null" while there is not enough to check.
 */
export function useDuplicateCheck(requestText: string, isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: [
      "health-schedule",
      organizationIdentifier,
      "patients",
      "duplicate-check",
      requestText,
    ],
    queryFn: () => checkForDuplicates(JSON.parse(requestText)),
    enabled: isEnabled && requestText !== "null",
    staleTime: 60_000,
  });
}

export function useRegisterPatient() {
  const invalidatePatients = usePatientInvalidation();
  return useMutation({
    mutationFn: registerPatient,
    onSuccess: invalidatePatients,
  });
}

export function useUpdatePatient() {
  const invalidatePatients = usePatientInvalidation();
  return useMutation({
    mutationFn: updatePatient,
    onSettled: invalidatePatients,
  });
}

export function useAllergyActions(patientId: string) {
  const invalidatePatients = usePatientInvalidation();
  const options = { onSettled: invalidatePatients };
  return {
    record: useMutation({
      mutationFn: (request: Record<string, unknown>) =>
        recordAllergy(patientId, request),
      ...options,
    }),
    recordNoneKnown: useMutation({
      mutationFn: () => recordNoKnownAllergies(patientId),
      ...options,
    }),
    end: useMutation({
      mutationFn: ({
        allergyId,
        request,
      }: {
        allergyId: string;
        request: { status: string; reason: string };
      }) => endAllergy(patientId, allergyId, request),
      ...options,
    }),
  };
}

export function useCoverageActions(patientId: string) {
  const invalidatePatients = usePatientInvalidation();
  const options = { onSettled: invalidatePatients };
  return {
    add: useMutation({
      mutationFn: (request: Record<string, unknown>) =>
        addCoverage(patientId, request),
      ...options,
    }),
    update: useMutation({
      mutationFn: ({
        coverage,
        changes,
      }: {
        coverage: PatientCoverage;
        changes: Record<string, unknown>;
      }) => updateCoverage({ patientId, coverage, changes }),
      ...options,
    }),
    recordEligibility: useMutation({
      mutationFn: ({
        coverageId,
        request,
      }: {
        coverageId: string;
        request: Record<string, unknown>;
      }) => recordEligibility(patientId, coverageId, request),
      ...options,
    }),
  };
}
