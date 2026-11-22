"use client";

import { useEffect, useMemo, useState } from "react";
import { WaitlistIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { TimeSlotPicker } from "@healthalyst/ui/components/time-slot-picker";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { PatientPicker } from "~/features/appointments/components/patient-picker";
import {
  APPOINTMENT_TEXT_LIMITS,
  SLOT_SEARCH_DAYS,
} from "~/features/appointments/config/appointments";
import {
  useBookAppointment,
  useBookFromWaitlist,
  useRescheduleAppointment,
  useSlots,
} from "~/features/appointments/hooks/use-appointments";
import { useSlotHold } from "~/features/appointments/hooks/use-slot-hold";
import type {
  BookingMode,
  BookingPatient,
} from "~/features/appointments/types/booking";
import {
  describeBookingError,
  needsFreshSlots,
} from "~/features/appointments/utilities/appointment-presentation";
import {
  decodeSlot,
  describeCountdown,
  describeSlotDays,
  describeWeek,
  firstDayWithSlots,
  groupSlotsByCalendar,
  listWeekDates,
  shiftDate,
} from "~/features/appointments/utilities/slot-choices";
import type { WorkspaceBranch } from "~/features/branch-selection/schemas/branch-schema";
import {
  useAppointmentTypes,
  useScheduleCalendars,
} from "~/features/schedule-setup/hooks/use-schedule-setup";
import { branchToday, describeBranchDateTime } from "~/shared/time/branch-time";

const ANY_CALENDAR = "any";
const PICKER_IDENTIFIER = "booking-time";

function readFixedTypeIdentifier(mode: BookingMode): string {
  return mode.kind === "reschedule"
    ? mode.appointment.appointmentTypeId
    : mode.kind === "waitlist"
      ? mode.entry.appointmentTypeId
      : "";
}

function readFirstWeekDate(mode: BookingMode, today: string): string {
  return mode.kind === "waitlist" && mode.entry.fromDate > today
    ? mode.entry.fromDate
    : today;
}

/**
 * Books an appointment in three steps on one screen: what it is for, a free
 * time (kept for five minutes so no other desk takes it), then confirm.
 * The same screen moves a booking or books a patient from the waitlist.
 */
export function BookAppointmentDialog({
  mode,
  onOpenChange,
  branch,
  onAddToWaitlist,
}: {
  /** `null` while closed. */
  mode: BookingMode | null;
  onOpenChange: (open: boolean) => void;
  branch: WorkspaceBranch;
  /** Offered when no time suits, for a new booking with a known patient. */
  onAddToWaitlist?: (
    patient: BookingPatient,
    appointmentTypeId: string
  ) => void;
}) {
  const today = branchToday();
  const appointmentTypesQuery = useAppointmentTypes();
  const calendarsQuery = useScheduleCalendars();
  const slotHold = useSlotHold();
  const bookMutation = useBookAppointment();
  const rescheduleMutation = useRescheduleAppointment();
  const waitlistBookMutation = useBookFromWaitlist();

  const [patient, setPatient] = useState<BookingPatient | null>(null);
  const [appointmentTypeId, setAppointmentTypeId] = useState("");
  const [calendarChoice, setCalendarChoice] = useState(ANY_CALENDAR);
  const [weekStart, setWeekStart] = useState(today);
  const [selectedDay, setSelectedDay] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [notes, setNotes] = useState("");
  const [bookingIdentifier, setBookingIdentifier] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{
    patient?: string;
    appointmentType?: string;
    time?: string;
  }>({});

  // Start afresh whenever the dialog opens for someone.
  useEffect(() => {
    if (!mode) return;
    setPatient(mode.kind === "book" ? mode.patient : null);
    setAppointmentTypeId(readFixedTypeIdentifier(mode));
    setCalendarChoice(
      mode.kind === "waitlist" && mode.entry.resourceId
        ? mode.entry.resourceId
        : ANY_CALENDAR
    );
    setWeekStart(readFirstWeekDate(mode, today));
    setSelectedDay("");
    setSelectedSlot("");
    setNotes("");
    setSubmitError(null);
    setFieldErrors({});
    setBookingIdentifier(crypto.randomUUID());
    bookMutation.reset();
    rescheduleMutation.reset();
    waitlistBookMutation.reset();
    // Reset only when the dialog opens for a different booking.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const appointmentTypes = useMemo(
    () => (appointmentTypesQuery.data ?? []).filter((type) => type.isActive),
    [appointmentTypesQuery.data]
  );
  const appointmentType = appointmentTypes.find(
    (type) => type.id === appointmentTypeId
  );
  const calendarNames = useMemo(
    () =>
      new Map(
        (calendarsQuery.data ?? []).map((calendar) => [
          calendar.id,
          calendar.name,
        ])
      ),
    [calendarsQuery.data]
  );
  const calendarOptions = useMemo(
    () => [
      { value: ANY_CALENDAR, label: "Anyone free" },
      ...(calendarsQuery.data ?? [])
        .filter(
          (calendar) =>
            calendar.isActive &&
            appointmentType?.resourceIds.includes(calendar.id) &&
            (calendar.branchId === null || calendar.branchId === branch.id)
        )
        .map((calendar) => ({ value: calendar.id, label: calendar.name })),
    ],
    [calendarsQuery.data, appointmentType, branch.id]
  );

  const weekDates = listWeekDates(weekStart, SLOT_SEARCH_DAYS);
  const slotsQuery = useSlots(
    mode && appointmentTypeId
      ? {
          appointmentTypeId,
          branchId: branch.id,
          from: weekDates[0] ?? today,
          to: weekDates.at(-1) ?? today,
        }
      : null
  );
  const slots = slotsQuery.data ?? [];
  const resourceFilter =
    calendarChoice === ANY_CALENDAR ? null : calendarChoice;
  const days = describeSlotDays({
    dates: weekDates,
    slots,
    resourceId: resourceFilter,
  });
  const firstFreeDay = firstDayWithSlots({
    dates: weekDates,
    slots,
    resourceId: resourceFilter,
  });
  const visibleDay =
    selectedDay && weekDates.includes(selectedDay)
      ? selectedDay
      : (firstFreeDay ?? weekDates[0] ?? today);
  const groups = groupSlotsByCalendar({
    date: visibleDay,
    slots,
    resourceId: resourceFilter,
    calendarNames,
  });

  function chooseTime(value: string) {
    const slot = decodeSlot(value);
    if (!slot || !appointmentTypeId) return;
    setSelectedSlot(value);
    setSubmitError(null);
    setFieldErrors((current) => ({ ...current, time: undefined }));
    slotHold.holdTime({
      appointmentTypeId,
      branchId: branch.id,
      resourceId: slot.resourceId,
      startsAt: slot.startsAt,
    });
  }

  function clearTime() {
    slotHold.releaseCurrent();
    setSelectedSlot("");
  }

  function close() {
    slotHold.releaseCurrent();
    onOpenChange(false);
  }

  // A refused hold means the time is gone: show fresh times.
  useEffect(() => {
    if (needsFreshSlots(slotHold.holdErrorCode)) {
      setSelectedSlot("");
      void slotsQuery.refetch();
    }
    // Refetch only when a new refusal arrives.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slotHold.holdError]);

  function handleRefusal(error: Error, fallbackMessage: string) {
    const code = error instanceof PlatformApiError ? error.code : null;
    setSubmitError(
      describeBookingError(code, error.message || fallbackMessage)
    );
    if (needsFreshSlots(code)) {
      slotHold.forgetHold();
      setSelectedSlot("");
      void slotsQuery.refetch();
    }
  }

  function submit() {
    if (!mode) return;
    const nextFieldErrors = {
      patient:
        mode.kind === "book" && !patient
          ? "Find and choose the patient."
          : undefined,
      appointmentType: appointmentTypeId
        ? undefined
        : "Choose what the appointment is for.",
      time:
        slotHold.hold && !slotHold.hasExpired
          ? undefined
          : slotHold.hasExpired
            ? "The five minutes ran out. Choose the time again."
            : "Choose a free time.",
    };
    setFieldErrors(nextFieldErrors);
    if (Object.values(nextFieldErrors).some(Boolean)) {
      const firstInvalidIdentifier = nextFieldErrors.patient
        ? "booking-patient-search"
        : nextFieldErrors.appointmentType
          ? "booking-appointment-type"
          : `${PICKER_IDENTIFIER}-day-${visibleDay}`;
      document.getElementById(firstInvalidIdentifier)?.focus();
      return;
    }
    const hold = slotHold.hold;
    if (!hold) return;
    setSubmitError(null);
    const describedTime = describeBranchDateTime(hold.startsAt);

    if (mode.kind === "reschedule") {
      rescheduleMutation.mutate(
        {
          appointmentId: mode.appointment.id,
          version: mode.appointment.version,
          startsAt: hold.startsAt,
          resourceId: hold.resourceId,
          holdId: hold.id,
        },
        {
          onSuccess: (appointment) => {
            slotHold.forgetHold();
            announceSuccess(
              "Appointment moved",
              `${describedTime} with ${appointment.resourceName}.`
            );
            onOpenChange(false);
          },
          onError: (error) =>
            handleRefusal(error, "We could not move the appointment."),
        }
      );
      return;
    }
    if (mode.kind === "waitlist") {
      waitlistBookMutation.mutate(
        { entryId: mode.entry.id, holdId: hold.id },
        {
          onSuccess: (appointment) => {
            slotHold.forgetHold();
            announceSuccess(
              `${mode.entry.patient.firstName} ${mode.entry.patient.lastName} is booked`,
              `${describedTime} with ${appointment.resourceName}. They are off the waitlist.`
            );
            onOpenChange(false);
          },
          onError: (error) =>
            handleRefusal(error, "We could not book the waiting patient."),
        }
      );
      return;
    }
    if (!patient) return;
    bookMutation.mutate(
      {
        id: bookingIdentifier,
        holdId: hold.id,
        patientId: patient.id,
        notes,
      },
      {
        onSuccess: (appointment) => {
          slotHold.forgetHold();
          announceSuccess(
            `${patient.name} is booked`,
            `${describedTime} with ${appointment.resourceName} for ${appointment.appointmentTypeName}.`
          );
          onOpenChange(false);
        },
        onError: (error) =>
          handleRefusal(error, "We could not book the appointment."),
      }
    );
  }

  const isSubmitting =
    bookMutation.isPending ||
    rescheduleMutation.isPending ||
    waitlistBookMutation.isPending;
  const title =
    mode?.kind === "reschedule"
      ? "Move the appointment"
      : mode?.kind === "waitlist"
        ? `Book ${mode.entry.patient.firstName} ${mode.entry.patient.lastName}`
        : patient
          ? `Book an appointment for ${patient.name}`
          : "Book an appointment";
  const description =
    mode?.kind === "reschedule"
      ? `Now ${describeBranchDateTime(mode.appointment.startsAt)} with ${mode.appointment.resourceName} for ${mode.appointment.appointmentTypeName}. Choose the new time.`
      : mode?.kind === "waitlist"
        ? `Waiting for ${mode.entry.appointmentTypeName}${mode.entry.resourceName ? ` with ${mode.entry.resourceName}` : ""}. Choose a time for them.`
        : // Chosen in the dialog, the patient's details show beside the choice.
          mode?.kind === "book" && mode.patient
          ? mode.patient.details
          : undefined;
  const isTypeFixed = mode?.kind === "reschedule" || mode?.kind === "waitlist";
  const waitlistPatient = mode?.kind === "book" ? patient : null;

  return (
    <FormDialog
      open={mode !== null}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      title={title}
      description={description}
      size="wide"
      submitLabel={
        mode?.kind === "reschedule" ? "Move appointment" : "Book appointment"
      }
      submittingLabel={mode?.kind === "reschedule" ? "Moving" : "Booking"}
      isSubmitting={isSubmitting}
      error={submitError ?? undefined}
      onSubmit={(formEvent) => {
        formEvent.preventDefault();
        submit();
      }}
    >
      {mode?.kind === "book" && (
        <PatientPicker
          inputIdentifier="booking-patient-search"
          patient={patient}
          onPatientChange={(nextPatient) => {
            setPatient(nextPatient);
            setFieldErrors((current) => ({ ...current, patient: undefined }));
          }}
          canChange={mode.patient === null}
          error={fieldErrors.patient}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          id="booking-appointment-type"
          label="What the appointment is for"
          required
          disabled={isTypeFixed}
          placeholder={
            appointmentTypesQuery.isPending
              ? "Loading appointment types"
              : "Choose an appointment type"
          }
          options={appointmentTypes.map((type) => ({
            value: type.id,
            label: `${type.name} (${type.durationMinutes} min)`,
          }))}
          value={appointmentTypeId}
          onValueChange={(value) => {
            clearTime();
            setAppointmentTypeId(value);
            setCalendarChoice(ANY_CALENDAR);
            setSelectedDay("");
            setFieldErrors((current) => ({
              ...current,
              appointmentType: undefined,
            }));
          }}
          error={
            fieldErrors.appointmentType ??
            (appointmentTypesQuery.isError
              ? appointmentTypesQuery.error.message
              : undefined)
          }
        />
        <SelectField
          id="booking-calendar"
          label="With"
          description="Leave it as anyone free to see every free time."
          placeholder="Anyone free"
          disabled={!appointmentType}
          options={calendarOptions}
          value={calendarChoice}
          onValueChange={(value) => {
            clearTime();
            setCalendarChoice(value);
            setSelectedDay("");
          }}
        />
      </div>

      {appointmentTypeId ? (
        <TimeSlotPicker
          id={PICKER_IDENTIFIER}
          legend="Free times"
          description={
            appointmentType?.prepNotes
              ? `Tell the patient: ${appointmentType.prepNotes}`
              : undefined
          }
          periodLabel={describeWeek(weekDates)}
          previousPeriod={{
            label: "Earlier week",
            disabled: weekStart <= today,
            onSelect: () => {
              setWeekStart(shiftDate(weekStart, -SLOT_SEARCH_DAYS));
              setSelectedDay("");
            },
          }}
          nextPeriod={{
            label: "Later week",
            onSelect: () => {
              setWeekStart(shiftDate(weekStart, SLOT_SEARCH_DAYS));
              setSelectedDay("");
            },
          }}
          days={days}
          selectedDay={visibleDay}
          onDayChange={setSelectedDay}
          groups={groups}
          value={selectedSlot}
          onValueChange={chooseTime}
          disabled={isSubmitting}
          state={
            slotsQuery.isPending
              ? { status: "loading" }
              : slotsQuery.isError
                ? {
                    status: "error",
                    message: slotsQuery.error.message,
                    onRetry: () => void slotsQuery.refetch(),
                  }
                : { status: "ready" }
          }
          emptyMessage={
            firstFreeDay
              ? "No free times this day. Choose another day."
              : "No free times this week. Try a later week."
          }
        />
      ) : null}

      {fieldErrors.time && (
        <p className="text-sm text-destructive" role="alert">
          {fieldErrors.time}
        </p>
      )}

      {slotHold.isHolding ? (
        <NoticeBanner tone="information" title="Keeping that time for you" />
      ) : slotHold.holdError ? (
        <NoticeBanner tone="error" title="That time could not be kept">
          {describeBookingError(
            slotHold.holdErrorCode,
            slotHold.holdError.message
          )}
        </NoticeBanner>
      ) : slotHold.hold ? (
        slotHold.hasExpired ? (
          <NoticeBanner tone="warning" title="The time was given back">
            The five minutes ran out, so another desk can book it. Choose a time
            again.
          </NoticeBanner>
        ) : (
          <NoticeBanner
            tone="success"
            title={`${describeBranchDateTime(slotHold.hold.startsAt)} with ${slotHold.hold.resourceName}`}
          >
            Kept for you for {describeCountdown(slotHold.secondsLeft)} while you
            finish booking.
          </NoticeBanner>
        )
      ) : null}

      {mode?.kind === "book" && (
        <TextAreaField
          id="booking-notes"
          label="Note for staff"
          description="For example: needs an interpreter, or bring previous results."
          rows={2}
          maxLength={APPOINTMENT_TEXT_LIMITS.notesMaximum}
          value={notes}
          onChange={(changeEvent) => setNotes(changeEvent.target.value)}
        />
      )}

      {onAddToWaitlist && waitlistPatient && appointmentTypeId && (
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <span>No time suits the patient?</span>
          <ActionButton
            type="button"
            variant="outline"
            size="compact"
            leadingIcon={<WaitlistIcon />}
            onClick={() => {
              slotHold.releaseCurrent();
              onAddToWaitlist(waitlistPatient, appointmentTypeId);
            }}
          >
            Add to the waitlist
          </ActionButton>
        </div>
      )}
    </FormDialog>
  );
}
