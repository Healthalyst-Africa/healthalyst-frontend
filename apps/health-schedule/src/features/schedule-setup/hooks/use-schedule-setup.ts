"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  APPOINTMENT_TYPE_QUERY_KEYS,
  createAppointmentType,
  listAppointmentTypes,
  updateAppointmentType,
} from "~/features/schedule-setup/services/appointment-type-service";
import {
  createScheduleCalendar,
  listPractitionerCandidates,
  listScheduleCalendars,
  replaceCalendarHours,
  SCHEDULE_CALENDAR_QUERY_KEYS,
  updateScheduleCalendar,
} from "~/features/schedule-setup/services/schedule-calendar-service";
import {
  createTimeOff,
  listTimeOff,
  removeTimeOff,
  TIME_OFF_QUERY_KEYS,
} from "~/features/schedule-setup/services/time-off-service";
import type {
  AppointmentTypeRequest,
  CreateCalendarRequest,
  CreateTimeOffRequest,
} from "~/features/schedule-setup/utilities/schedule-requests";
import type { AvailabilityRuleRequest } from "~/features/schedule-setup/utilities/weekly-hours";
import { useWorkspace } from "~/shared/workspace/workspace-context";

function useOrganizationIdentifier() {
  return useWorkspace().platformSession.activeContext.organizationId ?? "";
}

/**
 * Calendars and appointment types refer to each other, so a change to
 * either refreshes both.
 */
function useScheduleInvalidation() {
  const queryClient = useQueryClient();
  const organizationIdentifier = useOrganizationIdentifier();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: SCHEDULE_CALENDAR_QUERY_KEYS.all(organizationIdentifier),
      }),
      queryClient.invalidateQueries({
        queryKey: APPOINTMENT_TYPE_QUERY_KEYS.all(organizationIdentifier),
      }),
    ]);
}

export function useScheduleCalendars() {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: SCHEDULE_CALENDAR_QUERY_KEYS.all(organizationIdentifier),
    queryFn: listScheduleCalendars,
  });
}

export function useCreateScheduleCalendar() {
  const invalidateSchedule = useScheduleInvalidation();
  return useMutation({
    mutationFn: (request: CreateCalendarRequest) =>
      createScheduleCalendar(request),
    onSuccess: invalidateSchedule,
  });
}

export function useUpdateScheduleCalendar() {
  const invalidateSchedule = useScheduleInvalidation();
  return useMutation({
    mutationFn: ({
      calendarId,
      changes,
    }: {
      calendarId: string;
      changes: { name?: string; isActive?: boolean };
    }) => updateScheduleCalendar(calendarId, changes),
    onSuccess: invalidateSchedule,
  });
}

export function useReplaceCalendarHours() {
  const invalidateSchedule = useScheduleInvalidation();
  return useMutation({
    mutationFn: ({
      calendarId,
      rules,
    }: {
      calendarId: string;
      rules: AvailabilityRuleRequest[];
    }) => replaceCalendarHours(calendarId, rules),
    onSuccess: invalidateSchedule,
  });
}

/** Loaded only while the practitioner picker is open. */
export function usePractitionerCandidates(enabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: SCHEDULE_CALENDAR_QUERY_KEYS.practitionerCandidates(
      organizationIdentifier
    ),
    queryFn: listPractitionerCandidates,
    enabled,
  });
}

export function useTimeOff(period: { from: string; to: string }) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: TIME_OFF_QUERY_KEYS.period(
      organizationIdentifier,
      period.from,
      period.to
    ),
    queryFn: () => listTimeOff(period),
  });
}

function useTimeOffInvalidation() {
  const queryClient = useQueryClient();
  const organizationIdentifier = useOrganizationIdentifier();
  return () =>
    queryClient.invalidateQueries({
      queryKey: TIME_OFF_QUERY_KEYS.all(organizationIdentifier),
    });
}

export function useCreateTimeOff() {
  const invalidateTimeOff = useTimeOffInvalidation();
  return useMutation({
    mutationFn: (request: CreateTimeOffRequest) => createTimeOff(request),
    onSuccess: invalidateTimeOff,
  });
}

export function useRemoveTimeOff() {
  const invalidateTimeOff = useTimeOffInvalidation();
  return useMutation({
    mutationFn: (timeOffIdentifier: string) => removeTimeOff(timeOffIdentifier),
    onSuccess: invalidateTimeOff,
  });
}

export function useAppointmentTypes() {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: APPOINTMENT_TYPE_QUERY_KEYS.all(organizationIdentifier),
    queryFn: listAppointmentTypes,
  });
}

export function useSaveAppointmentType() {
  const invalidateSchedule = useScheduleInvalidation();
  return useMutation({
    mutationFn: ({
      appointmentTypeId,
      request,
      isActive,
    }: {
      /** Empty for a new appointment type. */
      appointmentTypeId: string | null;
      request: AppointmentTypeRequest;
      isActive: boolean;
    }) =>
      appointmentTypeId
        ? updateAppointmentType(appointmentTypeId, { ...request, isActive })
        : createAppointmentType(request),
    onSuccess: invalidateSchedule,
  });
}
