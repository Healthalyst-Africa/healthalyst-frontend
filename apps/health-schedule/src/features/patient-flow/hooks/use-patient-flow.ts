"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { WorkspaceBranch } from "~/features/branch-selection/schemas/branch-schema";
import { PATIENT_FLOW_REFRESH_MILLISECONDS } from "~/features/patient-flow/config/patient-flow";
import { isPatientFlowSampleDataEnabled } from "~/features/patient-flow/config/sample-data";
import { SAMPLE_DEPARTMENTS } from "~/features/patient-flow/sample-data/sample-patient-flow";
import {
  checkInPatient,
  FRONT_DESK_QUERY_KEYS,
  getDayBoard,
  getVisitBoard,
  registerQuickPatient,
  registerUnknownPatient,
  searchPatients,
} from "~/features/patient-flow/services/front-desk-service";
import {
  callNextPatient,
  callPatient,
  finishVisit,
  listQueueEntries,
  listQueueSummaries,
  QUEUE_BOARD_QUERY_KEYS,
  sendPatientOn,
  skipPatient,
  startSeeingPatient,
} from "~/features/patient-flow/services/queue-board-service";
import type {
  CheckInRequest,
  QuickPatientRequest,
  TransferRequest,
  UnknownPatientRequest,
} from "~/features/patient-flow/utilities/patient-flow-requests";
import {
  getPatientRecord,
  recordTriage,
  TRIAGE_QUERY_KEYS,
} from "~/features/patient-flow/services/triage-service";
import type { TriageRequest } from "~/features/patient-flow/utilities/triage-assessment";
import {
  encodeQueueTarget,
  type QueueTarget,
} from "~/features/patient-flow/utilities/queue-targets";
import { branchToday } from "~/shared/time/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

/** Live lists refresh while the page is open, including in the background. */
const LIVE_QUERY_OPTIONS = {
  refetchInterval: PATIENT_FLOW_REFRESH_MILLISECONDS,
  refetchOnWindowFocus: true,
  staleTime: 0,
} as const;

function useOrganizationIdentifier() {
  return useWorkspace().platformSession.activeContext.organizationId ?? "";
}

/** Any change to a visit refreshes both the front desk and the queue boards. */
function usePatientFlowInvalidation() {
  const queryClient = useQueryClient();
  const organizationIdentifier = useOrganizationIdentifier();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: FRONT_DESK_QUERY_KEYS.all(organizationIdentifier),
      }),
      queryClient.invalidateQueries({
        queryKey: QUEUE_BOARD_QUERY_KEYS.all(organizationIdentifier),
      }),
    ]);
}

export function useDayBoard(branchId: string, isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  const today = branchToday();
  return useQuery({
    queryKey: FRONT_DESK_QUERY_KEYS.dayBoard(
      organizationIdentifier,
      branchId,
      today
    ),
    queryFn: () => getDayBoard(branchId, today),
    enabled: isEnabled,
    ...LIVE_QUERY_OPTIONS,
  });
}

export function useVisitBoard(branchId: string, isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: FRONT_DESK_QUERY_KEYS.visitBoard(
      organizationIdentifier,
      branchId
    ),
    queryFn: () => getVisitBoard(branchId),
    enabled: isEnabled,
    ...LIVE_QUERY_OPTIONS,
  });
}

export function usePatientSearch(searchText: string, isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: FRONT_DESK_QUERY_KEYS.patientSearch(
      organizationIdentifier,
      searchText
    ),
    queryFn: () => searchPatients(searchText),
    enabled: isEnabled,
  });
}

export function useRegisterQuickPatient() {
  return useMutation({
    mutationFn: (request: QuickPatientRequest & { id: string }) =>
      registerQuickPatient(request),
  });
}

export function useRegisterUnknownPatient() {
  return useMutation({
    mutationFn: (request: UnknownPatientRequest & { id: string }) =>
      registerUnknownPatient(request),
  });
}

export function useCheckIn() {
  const invalidatePatientFlow = usePatientFlowInvalidation();
  return useMutation({
    mutationFn: (request: CheckInRequest) => checkInPatient(request),
    onSettled: invalidatePatientFlow,
  });
}

export function useQueueSummaries(branchId: string, isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: QUEUE_BOARD_QUERY_KEYS.summaries(
      organizationIdentifier,
      branchId
    ),
    queryFn: () => listQueueSummaries(branchId),
    enabled: isEnabled,
    ...LIVE_QUERY_OPTIONS,
  });
}

export function useQueueEntries(
  branchId: string,
  target: QueueTarget,
  isEnabled: boolean
) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: QUEUE_BOARD_QUERY_KEYS.entries(
      organizationIdentifier,
      branchId,
      encodeQueueTarget(target)
    ),
    queryFn: () => listQueueEntries(branchId, target),
    enabled: isEnabled,
    ...LIVE_QUERY_OPTIONS,
  });
}

/**
 * Calling, starting, skipping, sending on and finishing. Each refreshes the
 * lists afterwards, including after a refusal, because a refusal usually
 * means someone else already moved the patient.
 */
export function useQueueActions(branchId: string) {
  const invalidatePatientFlow = usePatientFlowInvalidation();
  const mutationOptions = { onSettled: invalidatePatientFlow };
  return {
    callNext: useMutation({
      mutationFn: (target: QueueTarget) => callNextPatient(branchId, target),
      ...mutationOptions,
    }),
    call: useMutation({
      mutationFn: (entryId: string) => callPatient(entryId),
      ...mutationOptions,
    }),
    start: useMutation({
      mutationFn: (entryId: string) => startSeeingPatient(entryId),
      ...mutationOptions,
    }),
    skip: useMutation({
      mutationFn: (entryId: string) => skipPatient(entryId),
      ...mutationOptions,
    }),
    sendOn: useMutation({
      mutationFn: ({
        entryId,
        request,
      }: {
        entryId: string;
        request: TransferRequest;
      }) => sendPatientOn(entryId, request),
      ...mutationOptions,
    }),
    finish: useMutation({
      mutationFn: (visitId: string) => finishVisit(visitId),
      ...mutationOptions,
    }),
  };
}

/** The branch's departments, or made-up ones while sample data is on. */
export function readPatientFlowDepartments(branch: WorkspaceBranch) {
  return isPatientFlowSampleDataEnabled()
    ? SAMPLE_DEPARTMENTS
    : branch.departments;
}

/** The patient's date of birth, for whether adult danger signs apply. */
export function usePatientRecord(patientId: string, isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: TRIAGE_QUERY_KEYS.patientRecord(
      organizationIdentifier,
      patientId
    ),
    queryFn: () => getPatientRecord(patientId),
    enabled: isEnabled,
  });
}

/** Saves vitals and the band; every queue and the front desk refresh. */
export function useRecordTriage() {
  const invalidatePatientFlow = usePatientFlowInvalidation();
  return useMutation({
    mutationFn: ({
      visitId,
      request,
    }: {
      visitId: string;
      request: TriageRequest;
    }) => recordTriage(visitId, request),
    onSettled: invalidatePatientFlow,
  });
}
