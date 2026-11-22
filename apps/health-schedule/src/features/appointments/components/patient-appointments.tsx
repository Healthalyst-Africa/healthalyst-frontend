"use client";

import { useState } from "react";
import { BookAppointmentIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { LoadingPlaceholder } from "@healthalyst/ui/components/loading-placeholder";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { ScheduleEntryList } from "@healthalyst/ui/components/schedule-entry-list";
import { useAppointmentWorkflows } from "~/features/appointments/components/appointment-workflows";
import {
  APPOINTMENT_PERMISSIONS,
  BOOKING_PERMISSIONS,
} from "~/features/appointments/config/appointments";
import { usePatientAppointments } from "~/features/appointments/hooks/use-appointments";
import type { Appointment } from "~/features/appointments/schemas/appointment-response-schemas";
import {
  describeAppointmentPeriod,
  describeAppointmentStatus,
  listPastAppointments,
  listUpcomingAppointments,
} from "~/features/appointments/utilities/appointment-presentation";
import type { BookingPatient } from "~/features/appointments/types/booking";
import {
  describeBranchClockTime,
  describeBranchDate,
  describeBranchShortDate,
} from "~/shared/time/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

const PAST_APPOINTMENTS_SHOWN = 5;

/**
 * The patient's coming appointments, with booking, moving and cancelling
 * from the record, and their recent past ones for context.
 */
export function PatientAppointments({ patient }: { patient: BookingPatient }) {
  const { permissions, branchSelection } = useWorkspace();
  const branch =
    branchSelection.status === "selected" ? branchSelection.branch : null;
  const canRead = permissions.includes(APPOINTMENT_PERMISSIONS.read);
  const canBook =
    branch !== null &&
    BOOKING_PERMISSIONS.every((permission) => permissions.includes(permission));
  const appointmentsQuery = usePatientAppointments(patient.id, canRead);
  const workflows = useAppointmentWorkflows(branch);
  const [isShowingPast, setIsShowingPast] = useState(false);

  if (!canRead) return null;

  const now = new Date();
  const appointments = appointmentsQuery.data ?? [];
  const upcoming = listUpcomingAppointments(appointments, now);
  const past = listPastAppointments(appointments, now);

  function toEntry(appointment: Appointment) {
    const status = describeAppointmentStatus(appointment, now);
    return {
      id: appointment.id,
      day: describeBranchShortDate(appointment.startsAt),
      time: describeBranchClockTime(appointment.startsAt),
      period: `${describeBranchDate(appointment.startsAt)}, ${describeAppointmentPeriod(appointment)}`,
      title: appointment.resourceName,
      details: appointment.cancelReason
        ? `${appointment.appointmentTypeName} · ${appointment.cancelReason}`
        : appointment.notes
          ? `${appointment.appointmentTypeName} · ${appointment.notes}`
          : appointment.appointmentTypeName,
      status,
      isInactive: appointment.status === "CANCELLED",
      actions: canBook ? workflows.buildActions(appointment, now) : [],
    };
  }

  return (
    <ContentPanel
      data-tour="patient-appointments"
      heading="Appointments"
      headingLevel={2}
      spacing="compact"
      headingAccessory={
        canBook && (
          <ActionButton
            type="button"
            size="compact"
            leadingIcon={<BookAppointmentIcon />}
            onClick={() => workflows.startBooking(patient)}
          >
            Book an appointment
          </ActionButton>
        )
      }
    >
      {appointmentsQuery.isPending ? (
        <LoadingPlaceholder
          label="Loading appointments"
          rows={[{ shape: "text" }, { shape: "text" }]}
        />
      ) : appointmentsQuery.isError ? (
        <NoticeBanner
          tone="error"
          title="We could not load the appointments"
          action={
            <ActionButton
              type="button"
              variant="outline"
              size="compact"
              onClick={() => void appointmentsQuery.refetch()}
            >
              Try again
            </ActionButton>
          }
        >
          {appointmentsQuery.error.message}
        </NoticeBanner>
      ) : (
        <div className="flex flex-col gap-3">
          {upcoming.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nothing booked.</p>
          ) : (
            <ScheduleEntryList
              timeColumn="date-time"
              entries={upcoming.map((appointment) => toEntry(appointment))}
            />
          )}
          {past.length > 0 && (
            <div className="flex flex-col gap-2">
              <ActionButton
                type="button"
                variant="link"
                size="unstyled"
                className="w-fit text-sm"
                aria-expanded={isShowingPast}
                onClick={() => setIsShowingPast((current) => !current)}
              >
                {isShowingPast
                  ? "Hide recent appointments"
                  : "Show recent appointments"}
              </ActionButton>
              {isShowingPast && (
                <ScheduleEntryList
                  timeColumn="date-time"
                  entries={past
                    .slice(0, PAST_APPOINTMENTS_SHOWN)
                    .map((appointment) => toEntry(appointment))}
                />
              )}
            </div>
          )}
        </div>
      )}
      {workflows.dialogs}
    </ContentPanel>
  );
}
