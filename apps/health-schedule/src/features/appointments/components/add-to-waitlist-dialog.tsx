"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { DatePickerField } from "@healthalyst/ui/components/date-picker-field";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  APPOINTMENT_TEXT_LIMITS,
  SLOT_SEARCH_DAYS,
  TIME_OF_DAY_OPTIONS,
} from "~/features/appointments/config/appointments";
import { useAddToWaitlist } from "~/features/appointments/hooks/use-appointments";
import {
  waitlistFormSchema,
  type WaitlistFormValues,
} from "~/features/appointments/schemas/appointment-form-schemas";
import type { BookingPatient } from "~/features/appointments/types/booking";
import { describeBookingError } from "~/features/appointments/utilities/appointment-presentation";
import { shiftDate } from "~/features/appointments/utilities/slot-choices";
import type { WorkspaceBranch } from "~/features/branch-selection/schemas/branch-schema";
import {
  useAppointmentTypes,
  useScheduleCalendars,
} from "~/features/schedule-setup/hooks/use-schedule-setup";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";
import { branchToday } from "~/shared/time/branch-time";

const ANY_CALENDAR = "any";

/** Who is waiting and for what, while the dialog is open. */
export type WaitlistCandidate = {
  patient: BookingPatient;
  appointmentTypeId: string;
};

/**
 * Puts a patient on the waitlist when no free time suits them. The desk is
 * shown waiting patients when a matching time comes free.
 */
export function AddToWaitlistDialog({
  candidate,
  onOpenChange,
  branch,
}: {
  /** `null` while closed. */
  candidate: WaitlistCandidate | null;
  onOpenChange: (open: boolean) => void;
  branch: WorkspaceBranch;
}) {
  const today = branchToday();
  const addMutation = useAddToWaitlist();
  const appointmentTypesQuery = useAppointmentTypes();
  const calendarsQuery = useScheduleCalendars();
  const [entryIdentifier, setEntryIdentifier] = useState("");
  const defaultValues: WaitlistFormValues = {
    fromDate: today,
    toDate: shiftDate(today, SLOT_SEARCH_DAYS * 2),
    timeOfDay: "ANY",
    resourceId: ANY_CALENDAR,
    notes: "",
  };
  const form = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistFormSchema),
    defaultValues,
    shouldFocusError: false,
  });
  const errors = form.formState.errors;

  useEffect(() => {
    if (candidate) {
      form.reset(defaultValues);
      addMutation.reset();
      // A new identifier per entry; a retry of the same one reuses it.
      setEntryIdentifier(crypto.randomUUID());
    }
    // Reset only when the dialog opens for someone.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate]);

  const appointmentType = appointmentTypesQuery.data?.find(
    (type) => type.id === candidate?.appointmentTypeId
  );
  const calendarOptions = [
    { value: ANY_CALENDAR, label: "Anyone" },
    ...(calendarsQuery.data ?? [])
      .filter(
        (calendar) =>
          calendar.isActive &&
          appointmentType?.resourceIds.includes(calendar.id) &&
          (calendar.branchId === null || calendar.branchId === branch.id)
      )
      .map((calendar) => ({ value: calendar.id, label: calendar.name })),
  ];
  const fromDate = form.watch("fromDate");

  const submit = form.handleSubmit(
    (values) => {
      if (!candidate) return;
      addMutation.mutate(
        {
          id: entryIdentifier,
          patientId: candidate.patient.id,
          appointmentTypeId: candidate.appointmentTypeId,
          branchId: branch.id,
          resourceId:
            values.resourceId === ANY_CALENDAR ? undefined : values.resourceId,
          fromDate: values.fromDate,
          toDate: values.toDate,
          timeOfDay: values.timeOfDay,
          notes: values.notes,
        },
        {
          onSuccess: () => {
            announceSuccess(
              `${candidate.patient.name} is on the waitlist`,
              "You will see them on the Appointments page when a time comes free."
            );
            onOpenChange(false);
          },
          onError: (error) =>
            applyFieldErrors(error, form.setError, [
              "fromDate",
              "toDate",
              "timeOfDay",
              "notes",
            ]),
        }
      );
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        fromDate: "waitlist-from-date",
        toDate: "waitlist-to-date",
        timeOfDay: "waitlist-time-of-day",
        notes: "waitlist-notes",
      })
  );

  return (
    <FormDialog
      open={candidate !== null}
      onOpenChange={onOpenChange}
      title={
        candidate
          ? `Add ${candidate.patient.name} to the waitlist`
          : "Add to the waitlist"
      }
      description={
        appointmentType
          ? `For ${appointmentType.name}. Say when they could come, and staff will offer them a time that comes free.`
          : undefined
      }
      submitLabel="Add to the waitlist"
      submittingLabel="Adding"
      isSubmitting={addMutation.isPending}
      error={
        addMutation.isError && Object.keys(errors).length === 0
          ? describeBookingError(
              addMutation.error instanceof PlatformApiError
                ? addMutation.error.code
                : null,
              addMutation.error.message
            )
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={form.control}
          name="fromDate"
          render={({ field }) => (
            <DatePickerField
              id="waitlist-from-date"
              label="From"
              required
              earliestDate={today}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.fromDate?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="toDate"
          render={({ field }) => (
            <DatePickerField
              id="waitlist-to-date"
              label="Until"
              required
              earliestDate={fromDate || today}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.toDate?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="timeOfDay"
          render={({ field }) => (
            <SelectField
              id="waitlist-time-of-day"
              label="Time of day"
              placeholder="Any time"
              options={TIME_OF_DAY_OPTIONS}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.timeOfDay?.message}
            />
          )}
        />
        <Controller
          control={form.control}
          name="resourceId"
          render={({ field }) => (
            <SelectField
              id="waitlist-calendar"
              label="With"
              placeholder="Anyone"
              options={calendarOptions}
              value={field.value}
              onValueChange={field.onChange}
            />
          )}
        />
      </div>
      <TextAreaField
        id="waitlist-notes"
        label="Note for staff"
        description="For example: can come at short notice, or call after 4 pm."
        rows={2}
        maxLength={APPOINTMENT_TEXT_LIMITS.notesMaximum}
        error={errors.notes?.message}
        {...form.register("notes")}
      />
    </FormDialog>
  );
}
