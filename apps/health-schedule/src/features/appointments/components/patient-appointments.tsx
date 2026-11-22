"use client";

import { useState } from "react";
import { BookAppointmentIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { DataTable } from "@healthalyst/ui/components/data-table";
import { EmptyCalendarDayIllustration } from "@healthalyst/ui/illustrations/empty-calendar-day-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
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

  const columns: readonly DataTableColumn<Appointment>[] = [
    {
      key: "when",
      label: "When",
      getCell: (appointment) => ({
        kind: "text",
        primary: describeBranchShortDate(appointment.startsAt),
        secondary: describeAppointmentPeriod(appointment),
      }),
    },
    {
      key: "with",
      label: "With",
      size: "wide",
      getCell: (appointment) => ({
        kind: "text",
        primary: appointment.resourceName,
        secondary: appointment.appointmentTypeName,
      }),
    },
    {
      key: "status",
      label: "Status",
      size: "compact",
      getCell: (appointment) => ({
        kind: "status",
        ...describeAppointmentStatus(appointment, now),
      }),
    },
  ];
  const tableState = (rows: readonly Appointment[]) =>
    appointmentsQuery.isPending
      ? { status: "loading" as const, label: "Loading appointments" }
      : appointmentsQuery.isError
        ? {
            status: "error" as const,
            title: "We could not load the appointments",
            description: appointmentsQuery.error.message,
            retryLabel: "Try again",
            onRetry: () => void appointmentsQuery.refetch(),
          }
        : { status: "ready" as const, rows };
  const rowActions = {
    getRowActions: (appointment: Appointment) =>
      canBook ? workflows.buildActions(appointment, now) : [],
    getRowActionsLabel: (appointment: Appointment) =>
      `Actions for the appointment on ${describeBranchDate(appointment.startsAt)} at ${describeBranchClockTime(appointment.startsAt)}`,
  };

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
      <DataTable
        accessibleLabel="Coming appointments"
        columns={columns}
        state={tableState(upcoming)}
        getRowIdentifier={(appointment) => appointment.id}
        {...rowActions}
        emptyState={{
          illustration: <EmptyCalendarDayIllustration />,
          title: "No appointments booked",
          description: canBook
            ? "Book the patient's next appointment when they need one."
            : undefined,
        }}
      />
      {past.length > 0 && (
        <ActionButton
          type="button"
          variant="link"
          size="unstyled"
          className="w-fit text-sm"
          aria-expanded={isShowingPast}
          onClick={() => setIsShowingPast((current) => !current)}
        >
          {isShowingPast
            ? "Hide earlier appointments"
            : "Show earlier appointments"}
        </ActionButton>
      )}
      {isShowingPast && past.length > 0 && (
        <DataTable
          accessibleLabel="Earlier appointments"
          columns={columns}
          state={tableState(past)}
          getRowIdentifier={(appointment) => appointment.id}
          {...rowActions}
          emptyState={{ title: "No earlier appointments" }}
        />
      )}
      {workflows.dialogs}
    </ContentPanel>
  );
}
