"use client";

import { useState } from "react";
import {
  BookAppointmentIcon,
  CancelAppointmentIcon,
  ExpectedArrivalsIcon,
  NoShowIcon,
  WarningIcon,
} from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { DayNavigator } from "@healthalyst/ui/components/day-navigator";
import { DaySchedule } from "@healthalyst/ui/components/day-schedule";
import { MetricSummary } from "@healthalyst/ui/components/metric-summary";
import { EmptyCalendarDayIllustration } from "@healthalyst/ui/illustrations/empty-calendar-day-illustration";
import { useAppointmentWorkflows } from "~/features/appointments/components/appointment-workflows";
import { WaitlistPanel } from "~/features/appointments/components/waitlist-panel";
import {
  APPOINTMENT_PERMISSIONS,
  BOOKING_PERMISSIONS,
} from "~/features/appointments/config/appointments";
import { useDayBoardForDate } from "~/features/appointments/hooks/use-appointments";
import type { DayBoard } from "~/features/appointments/schemas/appointment-response-schemas";
import {
  describeAppointmentIssue,
  describeAppointmentPeriod,
  describeAppointmentStatus,
  describeCalendarDay,
  sortDayAppointments,
} from "~/features/appointments/utilities/appointment-presentation";
import { shiftDate } from "~/features/appointments/utilities/slot-choices";
import type { WorkspaceBranch } from "~/features/branch-selection/schemas/branch-schema";
import { PatientFlowFrame } from "~/features/patient-flow/components/patient-flow-frame";
import { describePatientName } from "~/features/patient-flow/utilities/front-desk";
import {
  branchToday,
  describeBranchClockTime,
  toBranchDateTime,
  describeBranchDate,
} from "~/shared/time/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

/**
 * The receptionist's day at a branch: every calendar's hours and bookings,
 * with booking, moving and cancelling, and the patients on the waitlist.
 */
export function AppointmentsPage() {
  const { permissions, branchSelection } = useWorkspace();
  const canBook = BOOKING_PERMISSIONS.every((permission) =>
    permissions.includes(permission)
  );
  const workflows = useAppointmentWorkflows(
    branchSelection.status === "selected" ? branchSelection.branch : null
  );

  return (
    <PatientFlowFrame
      title="Appointments"
      description="Who is booked with whom, day by day."
      requiredPermission={APPOINTMENT_PERMISSIONS.read}
      missingPermissionName="View appointments"
      action={
        canBook && (
          <ActionButton
            type="button"
            leadingIcon={<BookAppointmentIcon className="size-4" />}
            onClick={() => workflows.startBooking(null)}
          >
            Book an appointment
          </ActionButton>
        )
      }
    >
      {(branch) => (
        <>
          <AppointmentsDay
            branch={branch}
            canBook={canBook}
            buildActions={workflows.buildActions}
          />
          <WaitlistPanel
            branch={branch}
            canBook={canBook}
            onBook={workflows.startWaitlistBooking}
          />
          {workflows.dialogs}
        </>
      )}
    </PatientFlowFrame>
  );
}

function AppointmentsDay({
  branch,
  canBook,
  buildActions,
}: {
  branch: WorkspaceBranch;
  canBook: boolean;
  buildActions: ReturnType<typeof useAppointmentWorkflows>["buildActions"];
}) {
  const today = branchToday();
  const [date, setDate] = useState(today);
  const dayBoardQuery = useDayBoardForDate(branch.id, date, true);
  const summary = dayBoardQuery.data?.summary;
  const now = new Date();

  function describeCalendars(dayBoard: DayBoard) {
    return dayBoard.calendars.map((calendar) => ({
      id: calendar.resourceId,
      name: calendar.name,
      hours: describeCalendarDay(calendar),
      entries: sortDayAppointments(calendar.appointments).map((appointment) => {
        const patientName = appointment.patient
          ? describePatientName(appointment.patient)
          : "Patient not recorded";
        return {
          id: appointment.id,
          time: describeBranchClockTime(appointment.startsAt),
          period: describeAppointmentPeriod(appointment),
          title: patientName,
          details: [
            appointment.appointmentTypeName,
            appointment.patient?.patientNumber,
            appointment.patient?.phone,
          ]
            .filter(Boolean)
            .join(" · "),
          status: describeAppointmentStatus(appointment, now),
          attention:
            appointment.status === "BOOKED"
              ? describeAppointmentIssue(appointment.issue)
              : undefined,
          isInactive: appointment.status === "CANCELLED",
          actions: canBook ? buildActions(appointment, now) : [],
        };
      }),
    }));
  }

  return (
    <ContentPanel
      data-tour="appointments-day"
      heading="Bookings by calendar"
      headingLevel={2}
      headingAccessory={
        <DayNavigator
          id="appointments-day"
          value={date}
          today={today}
          onValueChange={setDate}
          shiftDay={shiftDate}
        />
      }
    >
      <MetricSummary
        isLoading={dayBoardQuery.isPending}
        items={[
          {
            label: "Booked",
            value: summary?.booked ?? 0,
            icon: <ExpectedArrivalsIcon />,
          },
          {
            label: "Did not come",
            value: summary?.noShow ?? 0,
            icon: <NoShowIcon />,
          },
          {
            label: "Cancelled",
            value: summary?.cancelled ?? 0,
            icon: <CancelAppointmentIcon />,
          },
          {
            label: "Need moving",
            value: summary?.needsAttention ?? 0,
            icon: <WarningIcon />,
          },
        ]}
      />
      <DaySchedule
        accessibleLabel={`Appointments on ${describeBranchDate(toBranchDateTime(date, "12:00"))}`}
        state={
          dayBoardQuery.isPending
            ? { status: "loading" }
            : dayBoardQuery.isError
              ? {
                  status: "error",
                  title: "We could not load the day's appointments",
                  description: dayBoardQuery.error.message,
                  onRetry: () => void dayBoardQuery.refetch(),
                }
              : {
                  status: "ready",
                  calendars: describeCalendars(dayBoardQuery.data),
                }
        }
        emptyState={{
          illustration: <EmptyCalendarDayIllustration />,
          title: "Nothing booked this day",
          description: "Nobody has an appointment at this branch on this day.",
        }}
      />
    </ContentPanel>
  );
}
