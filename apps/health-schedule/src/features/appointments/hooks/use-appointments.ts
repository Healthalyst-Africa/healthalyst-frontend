"use client";

import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  APPOINTMENT_QUERY_KEYS,
  bookAppointment,
  cancelAppointment,
  getDayBoard,
  holdSlot,
  listPatientAppointments,
  listSlots,
  recordNoShow,
  releaseHold,
  rescheduleAppointment,
} from "~/features/appointments/services/appointment-service";
import {
  addToWaitlist,
  bookFromWaitlist,
  listWaitlist,
  removeFromWaitlist,
  WAITLIST_QUERY_KEYS,
} from "~/features/appointments/services/waitlist-service";
import type {
  BookingRequest,
  CancelRequest,
  HoldRequest,
  RescheduleRequest,
  SlotSearch,
  WaitlistRequest,
} from "~/features/appointments/utilities/appointment-requests";
import { FRONT_DESK_QUERY_KEYS } from "~/features/patient-flow/services/front-desk-service";
import { useWorkspace } from "~/shared/workspace/workspace-context";

function useOrganizationIdentifier() {
  return useWorkspace().platformSession.activeContext.organizationId ?? "";
}

/**
 * A booking changes the day board, the patient's appointments, the front
 * desk's expected arrivals and possibly the waitlist, so all are refreshed.
 */
function useAppointmentInvalidation() {
  const queryClient = useQueryClient();
  const organizationIdentifier = useOrganizationIdentifier();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: APPOINTMENT_QUERY_KEYS.all(organizationIdentifier),
      }),
      queryClient.invalidateQueries({
        queryKey: WAITLIST_QUERY_KEYS.all(organizationIdentifier),
      }),
      queryClient.invalidateQueries({
        queryKey: FRONT_DESK_QUERY_KEYS.all(organizationIdentifier),
      }),
    ]);
}

export function useSlots(search: SlotSearch | null) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: search
      ? APPOINTMENT_QUERY_KEYS.slots(organizationIdentifier, search)
      : ["health-schedule", organizationIdentifier, "appointments", "slots"],
    queryFn: () => (search ? listSlots(search) : Promise.resolve([])),
    enabled: search !== null,
    // Other desks book too: free times are always checked again.
    staleTime: 0,
    placeholderData: keepPreviousData,
  });
}

export function useDayBoardForDate(
  branchId: string,
  date: string,
  isEnabled: boolean
) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: APPOINTMENT_QUERY_KEYS.dayBoard(
      organizationIdentifier,
      branchId,
      date
    ),
    queryFn: () => getDayBoard(branchId, date),
    enabled: isEnabled,
    refetchOnWindowFocus: true,
    placeholderData: keepPreviousData,
  });
}

export function usePatientAppointments(patientId: string, isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: APPOINTMENT_QUERY_KEYS.patientAppointments(
      organizationIdentifier,
      patientId
    ),
    queryFn: () => listPatientAppointments(patientId),
    enabled: isEnabled,
  });
}

export function useWaitlist(branchId: string, isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: WAITLIST_QUERY_KEYS.branch(organizationIdentifier, branchId),
    queryFn: () => listWaitlist(branchId),
    enabled: isEnabled,
  });
}

export function useHoldSlot() {
  return useMutation({
    mutationFn: (request: HoldRequest) => holdSlot(request),
  });
}

export function useReleaseHold() {
  return useMutation({
    mutationFn: (holdId: string) => releaseHold(holdId),
  });
}

export function useBookAppointment() {
  const invalidateAppointments = useAppointmentInvalidation();
  return useMutation({
    mutationFn: (request: BookingRequest) => bookAppointment(request),
    onSuccess: invalidateAppointments,
  });
}

export function useRescheduleAppointment() {
  const invalidateAppointments = useAppointmentInvalidation();
  return useMutation({
    mutationFn: (request: RescheduleRequest) => rescheduleAppointment(request),
    onSettled: invalidateAppointments,
  });
}

export function useCancelAppointment() {
  const invalidateAppointments = useAppointmentInvalidation();
  return useMutation({
    mutationFn: (request: CancelRequest) => cancelAppointment(request),
    onSettled: invalidateAppointments,
  });
}

export function useRecordNoShow() {
  const invalidateAppointments = useAppointmentInvalidation();
  return useMutation({
    mutationFn: (appointmentId: string) => recordNoShow(appointmentId),
    onSettled: invalidateAppointments,
  });
}

export function useAddToWaitlist() {
  const invalidateAppointments = useAppointmentInvalidation();
  return useMutation({
    mutationFn: (request: WaitlistRequest) => addToWaitlist(request),
    onSuccess: invalidateAppointments,
  });
}

export function useBookFromWaitlist() {
  const invalidateAppointments = useAppointmentInvalidation();
  return useMutation({
    mutationFn: (request: { entryId: string; holdId: string }) =>
      bookFromWaitlist(request),
    onSuccess: invalidateAppointments,
  });
}

export function useRemoveFromWaitlist() {
  const invalidateAppointments = useAppointmentInvalidation();
  return useMutation({
    mutationFn: (request: { entryId: string; reason: string }) =>
      removeFromWaitlist(request),
    onSettled: invalidateAppointments,
  });
}
