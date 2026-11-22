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
import { DataTable } from "@healthalyst/ui/components/data-table";
import { MetricSummary } from "@healthalyst/ui/components/metric-summary";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { ToolbarSelect } from "@healthalyst/ui/components/toolbar-select";
import { EmptyCalendarDayIllustration } from "@healthalyst/ui/illustrations/empty-calendar-day-illustration";
import type { DataTableColumn } from "@healthalyst/ui/types/data-table";
import { useAppointmentWorkflows } from "~/features/appointments/components/appointment-workflows";
import { WaitlistPanel } from "~/features/appointments/components/waitlist-panel";
import {
  APPOINTMENT_PERMISSIONS,
  BOOKING_PERMISSIONS,
} from "~/features/appointments/config/appointments";
import { useDayBoardForDate } from "~/features/appointments/hooks/use-appointments";
import {
  describeAppointmentStatus,
  describeCalendarDay,
} from "~/features/appointments/utilities/appointment-presentation";
import {
  buildCalendarFilterOptions,
  describeWith,
  EVERY_CALENDAR,
  findChosenCalendar,
  listDayAppointments,
  type DaySheetAppointment,
} from "~/features/appointments/utilities/day-sheet";
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
  const [calendarChoice, setCalendarChoice] = useState(EVERY_CALENDAR);
  const dayBoardQuery = useDayBoardForDate(branch.id, date, true);
  const dayBoard = dayBoardQuery.data;
  const summary = dayBoard?.summary;
  const chosenCalendar = findChosenCalendar(dayBoard, calendarChoice);
  // A calendar chosen on another day may not be on this one: show everyone.
  const visibleChoice = chosenCalendar ? calendarChoice : EVERY_CALENDAR;
  const now = new Date();
  const dayName = describeBranchDate(toBranchDateTime(date, "12:00"));

  const columns: readonly DataTableColumn<DaySheetAppointment>[] = [
    {
      key: "time",
      label: "Time",
      size: "compact",
      getCell: (appointment) => ({
        kind: "text",
        primary: describeBranchClockTime(appointment.startsAt),
        secondary: `until ${describeBranchClockTime(appointment.endsAt)}`,
      }),
    },
    {
      key: "patient",
      label: "Patient",
      size: "wide",
      getCell: (appointment) => ({
        kind: "text",
        primary: appointment.patient
          ? describePatientName(appointment.patient)
          : "Patient not recorded",
        secondary: appointment.patient?.phone ?? undefined,
      }),
    },
    {
      key: "with",
      label: "With",
      getCell: (appointment) => ({
        kind: "text",
        primary: appointment.calendar.name,
        secondary: appointment.appointmentTypeName,
      }),
    },
    {
      key: "status",
      label: "Status",
      size: "compact",
      getCell: (appointment) =>
        appointment.status === "BOOKED" && appointment.issue
          ? { kind: "status", label: "Needs moving", tone: "warning" }
          : { kind: "status", ...describeAppointmentStatus(appointment, now) },
    },
  ];

  return (
    <ContentPanel
      data-tour="appointments-day"
      heading="The day's appointments"
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
      <ToolbarSelect
        label="With"
        placeholder="Everyone"
        value={visibleChoice}
        options={buildCalendarFilterOptions(dayBoard)}
        onValueChange={setCalendarChoice}
        className="self-start"
      />
      {(summary?.needsAttention ?? 0) > 0 && (
        <NoticeBanner tone="warning" title="Some bookings need moving">
          Leave or new hours now clash with them. Call each patient marked
          “Needs moving” and move the appointment to another time.
        </NoticeBanner>
      )}
      {chosenCalendar && (
        <p className="text-sm text-muted-foreground">
          {describeCalendarDay(chosenCalendar)}
        </p>
      )}
      <DataTable
        accessibleLabel={`Appointments on ${dayName}`}
        columns={columns}
        state={
          dayBoardQuery.isPending
            ? { status: "loading", label: "Loading the day's appointments" }
            : dayBoardQuery.isError
              ? {
                  status: "error",
                  title: "We could not load the day's appointments",
                  description: dayBoardQuery.error.message,
                  retryLabel: "Try again",
                  onRetry: () => void dayBoardQuery.refetch(),
                }
              : {
                  status: "ready",
                  rows: listDayAppointments(dayBoardQuery.data, visibleChoice),
                }
        }
        getRowIdentifier={(appointment) => appointment.id}
        getRowEmphasis={(appointment) =>
          appointment.status === "BOOKED" && appointment.issue
            ? "attention"
            : "none"
        }
        getRowActions={(appointment) =>
          canBook ? buildActions(appointment, now) : []
        }
        getRowActionsLabel={(appointment) =>
          `Actions for ${appointment.patient ? describePatientName(appointment.patient) : "the patient"} at ${describeBranchClockTime(appointment.startsAt)}`
        }
        emptyState={{
          illustration: <EmptyCalendarDayIllustration />,
          title: chosenCalendar
            ? `Nothing booked ${describeWith(chosenCalendar)}`
            : "Nothing booked this day",
          description: chosenCalendar
            ? "Choose everyone to see the rest of the branch."
            : "Nobody has an appointment at this branch on this day.",
        }}
      />
    </ContentPanel>
  );
}
