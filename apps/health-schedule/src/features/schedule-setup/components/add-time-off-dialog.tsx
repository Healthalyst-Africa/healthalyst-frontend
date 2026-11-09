"use client";

import { useEffect } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { DatePickerField } from "@healthalyst/ui/components/date-picker-field";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import {
  BRANCH_TIME_OFF_KINDS,
  CALENDAR_TIME_OFF_KINDS,
  TIME_OFF_KIND_OPTIONS,
} from "~/features/schedule-setup/config/schedule-setup";
import { useCreateTimeOff } from "~/features/schedule-setup/hooks/use-schedule-setup";
import {
  timeOffFormSchema,
  type TimeOffFormValues,
} from "~/features/schedule-setup/schemas/schedule-form-schemas";
import type { ScheduleCalendar } from "~/features/schedule-setup/schemas/schedule-response-schemas";
import { applyFieldErrors } from "~/features/schedule-setup/utilities/apply-field-errors";
import { focusFirstInvalidField } from "~/features/schedule-setup/utilities/focus-first-invalid-field";
import { branchToday } from "~/features/schedule-setup/utilities/branch-time";
import { toCreateTimeOffRequest } from "~/features/schedule-setup/utilities/schedule-requests";

const APPLIES_TO_OPTIONS = [
  { value: "calendar", label: "One calendar" },
  { value: "branch", label: "A whole branch" },
];

type FormOption = { value: string; label: string };

/** Closes one calendar or a whole branch for a period. */
export function AddTimeOffDialog({
  open,
  onOpenChange,
  calendars,
  branchOptions,
  defaultBranchIdentifier,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  calendars: readonly ScheduleCalendar[];
  branchOptions: readonly FormOption[];
  defaultBranchIdentifier: string;
}) {
  const createMutation = useCreateTimeOff();
  const today = branchToday();
  const defaultValues: TimeOffFormValues = {
    appliesTo: "calendar",
    calendarId: "",
    branchId: defaultBranchIdentifier,
    kind: "LEAVE",
    allDay: true,
    startDate: today,
    startTime: "09:00",
    endDate: today,
    endTime: "17:00",
    reason: "",
  };
  const form = useForm<TimeOffFormValues>({
    resolver: zodResolver(timeOffFormSchema),
    defaultValues,
    shouldFocusError: false,
  });
  const [appliesTo, allDay, startDate] = useWatch({
    control: form.control,
    name: ["appliesTo", "allDay", "startDate"],
  });

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      createMutation.reset();
    }
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const allowedKinds: readonly string[] =
    appliesTo === "calendar" ? CALENDAR_TIME_OFF_KINDS : BRANCH_TIME_OFF_KINDS;
  const kindOptions = TIME_OFF_KIND_OPTIONS.filter((option) =>
    allowedKinds.includes(option.value)
  );
  const calendarOptions = calendars
    .filter((calendar) => calendar.isActive)
    .map((calendar) => ({ value: calendar.id, label: calendar.name }))
    .sort((firstOption, secondOption) =>
      firstOption.label.localeCompare(secondOption.label)
    );
  const errors = form.formState.errors;

  const submit = form.handleSubmit(
    (values) => {
      createMutation.mutate(toCreateTimeOffRequest(values), {
        onSuccess: () => {
          announceSuccess("Time off added");
          onOpenChange(false);
        },
        onError: (error) => {
          applyFieldErrors(error, form.setError, [
            "calendarId",
            "branchId",
            "kind",
            "startDate",
            "endDate",
            "reason",
          ]);
        },
      });
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        calendarId: "time-off-calendar",
        branchId: "time-off-branch",
        kind: "time-off-kind",
        startDate: "time-off-start-date",
        startTime: "time-off-start-time",
        endDate: "time-off-end-date",
        endTime: "time-off-end-time",
        reason: "time-off-reason",
      })
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add time off"
      description="Free slots that overlap it disappear. Appointments already booked stay, and show on the day board."
      submitLabel="Add time off"
      submittingLabel="Adding time off"
      isSubmitting={createMutation.isPending}
      error={
        createMutation.isError && Object.keys(errors).length === 0
          ? createMutation.error.message
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <Controller
        control={form.control}
        name="appliesTo"
        render={({ field }) => (
          <SelectField
            id="time-off-applies-to"
            label="Closes"
            placeholder="Choose what it closes"
            options={APPLIES_TO_OPTIONS}
            value={field.value}
            onValueChange={(value) => {
              const nextAppliesTo = value as TimeOffFormValues["appliesTo"];
              field.onChange(nextAppliesTo);
              form.setValue(
                "kind",
                nextAppliesTo === "calendar" ? "LEAVE" : "HOLIDAY"
              );
            }}
          />
        )}
      />
      {appliesTo === "calendar" ? (
        <Controller
          control={form.control}
          name="calendarId"
          render={({ field }) => (
            <SelectField
              id="time-off-calendar"
              label="Calendar"
              placeholder={
                calendarOptions.length === 0
                  ? "No calendars are taking bookings"
                  : "Choose a calendar"
              }
              options={calendarOptions}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.calendarId?.message}
            />
          )}
        />
      ) : (
        <Controller
          control={form.control}
          name="branchId"
          render={({ field }) => (
            <SelectField
              id="time-off-branch"
              label="Branch"
              placeholder="Choose a branch"
              options={branchOptions}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.branchId?.message}
            />
          )}
        />
      )}
      <Controller
        control={form.control}
        name="kind"
        render={({ field }) => (
          <SelectField
            id="time-off-kind"
            label="Reason for the closure"
            placeholder="Choose a reason"
            options={kindOptions}
            value={field.value}
            onValueChange={(value) =>
              field.onChange(value as TimeOffFormValues["kind"])
            }
            error={errors.kind?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="allDay"
        render={({ field }) => (
          <CheckboxField
            id="time-off-all-day"
            label="All day"
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <Controller
          control={form.control}
          name="startDate"
          render={({ field }) => (
            <DatePickerField
              id="time-off-start-date"
              label={allDay ? "First day" : "Starts on"}
              value={field.value}
              onValueChange={(value) => {
                field.onChange(value);
                if (value > form.getValues("endDate"))
                  form.setValue("endDate", value);
              }}
              earliestDate={today}
              error={errors.startDate?.message}
            />
          )}
        />
        {!allDay && (
          <TextField
            id="time-off-start-time"
            type="time"
            label="Start time"
            error={errors.startTime?.message}
            {...form.register("startTime")}
          />
        )}
        <Controller
          control={form.control}
          name="endDate"
          render={({ field }) => (
            <DatePickerField
              id="time-off-end-date"
              label={allDay ? "Last day" : "Ends on"}
              value={field.value}
              onValueChange={field.onChange}
              earliestDate={startDate || today}
              error={errors.endDate?.message}
            />
          )}
        />
        {!allDay && (
          <TextField
            id="time-off-end-time"
            type="time"
            label="End time"
            error={errors.endTime?.message}
            {...form.register("endTime")}
          />
        )}
      </div>
      <TextField
        id="time-off-reason"
        label="Note (optional)"
        placeholder="Annual leave"
        description="Staff see this note. Do not include patient details."
        error={errors.reason?.message}
        {...form.register("reason")}
      />
    </FormDialog>
  );
}
