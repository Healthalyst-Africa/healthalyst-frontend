"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { DetailSheet } from "@healthalyst/ui/components/detail-sheet";
import { FormMessage } from "@healthalyst/ui/components/form-message";
import { MultiSelectField } from "@healthalyst/ui/components/multi-select-field";
import { SectionHeading } from "@healthalyst/ui/components/section-heading";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import {
  MODALITY_OPTIONS,
  SCHEDULE_FIELD_LIMITS as LIMITS,
} from "~/features/schedule-setup/config/schedule-setup";
import { useSaveAppointmentType } from "~/features/schedule-setup/hooks/use-schedule-setup";
import {
  appointmentTypeFormSchema,
  type AppointmentTypeFormValues,
} from "~/features/schedule-setup/schemas/schedule-form-schemas";
import type {
  AppointmentType,
  ScheduleCalendar,
} from "~/features/schedule-setup/schemas/schedule-response-schemas";
import { applyFieldErrors } from "~/features/schedule-setup/utilities/apply-field-errors";
import { focusFirstInvalidField } from "~/features/schedule-setup/utilities/focus-first-invalid-field";
import {
  toAppointmentTypeFormValues,
  toAppointmentTypeRequest,
} from "~/features/schedule-setup/utilities/schedule-requests";

const FORM_IDENTIFIER = "appointment-type-form";

const FIELD_NAMES = [
  "name",
  "durationMinutes",
  "newPatientDurationMinutes",
  "bufferMinutes",
  "priceNaira",
  "modality",
  "capacity",
  "minimumNoticeHours",
  "advanceBookingDays",
  "dailyLimit",
  "overbookingPercent",
  "preparationNotes",
  "calendarIds",
] as const satisfies readonly (keyof AppointmentTypeFormValues)[];

/** Element identifiers in the order the fields appear, for focusing errors. */
const FIELD_IDENTIFIERS = {
  name: "appointment-type-name",
  durationMinutes: "appointment-type-duration",
  newPatientDurationMinutes: "appointment-type-new-patient-duration",
  bufferMinutes: "appointment-type-buffer",
  modality: "appointment-type-modality",
  priceNaira: "appointment-type-price",
  capacity: "appointment-type-capacity",
  dailyLimit: "appointment-type-daily-limit",
  minimumNoticeHours: "appointment-type-minimum-notice",
  advanceBookingDays: "appointment-type-advance-days",
  overbookingPercent: "appointment-type-overbooking",
  calendarIds: "appointment-type-calendars",
  preparationNotes: "appointment-type-preparation",
} as const;

/**
 * Creates or edits an appointment type: how long it takes, how it is
 * booked, what it costs and which calendars offer it.
 */
export function AppointmentTypeSheet({
  open,
  onOpenChange,
  appointmentType,
  calendars,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The type being edited, or null for a new one. */
  appointmentType: AppointmentType | null;
  calendars: readonly ScheduleCalendar[];
}) {
  const saveMutation = useSaveAppointmentType();
  const form = useForm<AppointmentTypeFormValues>({
    resolver: zodResolver(appointmentTypeFormSchema),
    defaultValues: toAppointmentTypeFormValues(appointmentType),
    shouldFocusError: false,
  });

  useEffect(() => {
    if (open) {
      form.reset(toAppointmentTypeFormValues(appointmentType));
      saveMutation.reset();
    }
    // Reset when the panel opens or shows another type.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointmentType?.id]);

  const errors = form.formState.errors;
  const calendarOptions = calendars
    .filter(
      (calendar) =>
        calendar.isActive || appointmentType?.resourceIds.includes(calendar.id)
    )
    .map((calendar) => ({
      value: calendar.id,
      label: calendar.isActive ? calendar.name : `${calendar.name} (paused)`,
    }))
    .sort((firstOption, secondOption) =>
      firstOption.label.localeCompare(secondOption.label)
    );

  const submit = form.handleSubmit(
    (values) => {
      saveMutation.mutate(
        {
          appointmentTypeId: appointmentType?.id ?? null,
          request: toAppointmentTypeRequest(values),
          isActive: values.isActive,
        },
        {
          onSuccess: (savedType) => {
            announceSuccess(
              appointmentType
                ? `${savedType.name} saved`
                : `${savedType.name} added`
            );
            onOpenChange(false);
          },
          onError: (error) => {
            applyFieldErrors(error, form.setError, FIELD_NAMES);
          },
        }
      );
    },
    (invalidFields) => focusFirstInvalidField(invalidFields, FIELD_IDENTIFIERS)
  );

  return (
    <DetailSheet
      open={open}
      onOpenChange={onOpenChange}
      title={
        appointmentType
          ? `Edit ${appointmentType.name}`
          : "Add an appointment type"
      }
      description="Patients book appointment types, such as a general consultation or an antenatal visit."
      footer={
        <>
          <ActionButton
            type="button"
            variant="outline"
            disabled={saveMutation.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </ActionButton>
          <ActionButton
            type="submit"
            form={FORM_IDENTIFIER}
            isLoading={saveMutation.isPending}
            loadingText="Saving"
          >
            {appointmentType ? "Save changes" : "Add appointment type"}
          </ActionButton>
        </>
      }
    >
      <form
        id={FORM_IDENTIFIER}
        noValidate
        className="flex flex-col gap-8"
        onSubmit={(formEvent) => void submit(formEvent)}
      >
        <section className="flex flex-col gap-4">
          <SectionHeading heading="The appointment" />
          <TextField
            id="appointment-type-name"
            label="Name"
            placeholder="General consultation"
            error={errors.name?.message}
            {...form.register("name")}
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="appointment-type-duration"
              label="Length in minutes"
              inputMode="numeric"
              error={errors.durationMinutes?.message}
              {...form.register("durationMinutes")}
            />
            <TextField
              id="appointment-type-new-patient-duration"
              label="Length for new patients (optional)"
              inputMode="numeric"
              description="Leave empty to use the same length."
              error={errors.newPatientDurationMinutes?.message}
              {...form.register("newPatientDurationMinutes")}
            />
            <TextField
              id="appointment-type-buffer"
              label="Gap after each appointment, in minutes"
              inputMode="numeric"
              description={`Time to clean up or write notes, up to ${LIMITS.bufferMaximumMinutes}.`}
              error={errors.bufferMinutes?.message}
              {...form.register("bufferMinutes")}
            />
            <Controller
              control={form.control}
              name="modality"
              render={({ field }) => (
                <SelectField
                  id="appointment-type-modality"
                  label="How it happens"
                  placeholder="Choose how it happens"
                  options={MODALITY_OPTIONS}
                  value={field.value}
                  onValueChange={(value) =>
                    field.onChange(
                      value as AppointmentTypeFormValues["modality"]
                    )
                  }
                  error={errors.modality?.message}
                />
              )}
            />
            <TextField
              id="appointment-type-price"
              label="Price in naira (optional)"
              inputMode="decimal"
              placeholder="15000"
              error={errors.priceNaira?.message}
              {...form.register("priceNaira")}
            />
          </div>
        </section>
        <section className="flex flex-col gap-4">
          <SectionHeading
            heading="Booking"
            description="When patients can book and how many fit."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField
              id="appointment-type-capacity"
              label="Patients per appointment"
              inputMode="numeric"
              description="More than 1 makes it a group session."
              error={errors.capacity?.message}
              {...form.register("capacity")}
            />
            <TextField
              id="appointment-type-daily-limit"
              label="Most bookings a day (optional)"
              inputMode="numeric"
              error={errors.dailyLimit?.message}
              {...form.register("dailyLimit")}
            />
            <TextField
              id="appointment-type-minimum-notice"
              label="Minimum notice, in hours"
              inputMode="numeric"
              description="0 allows booking right up to the start."
              error={errors.minimumNoticeHours?.message}
              {...form.register("minimumNoticeHours")}
            />
            <TextField
              id="appointment-type-advance-days"
              label="Bookable up to, in days ahead"
              inputMode="numeric"
              error={errors.advanceBookingDays?.message}
              {...form.register("advanceBookingDays")}
            />
            <TextField
              id="appointment-type-overbooking"
              label="Overbooking, in percent"
              inputMode="numeric"
              description="Extra bookings allowed above capacity, for patients who do not come."
              error={errors.overbookingPercent?.message}
              {...form.register("overbookingPercent")}
            />
          </div>
        </section>
        <section className="flex flex-col gap-4">
          <SectionHeading heading="Who offers it" />
          <Controller
            control={form.control}
            name="calendarIds"
            render={({ field }) => (
              <MultiSelectField
                // Remounts when another type opens, so its choices show.
                key={appointmentType?.id ?? "new"}
                id="appointment-type-calendars"
                label="Calendars"
                name="calendarIds"
                placeholder="Choose calendars"
                searchPlaceholder="Search calendars"
                emptyMessage="No calendars match"
                options={calendarOptions}
                defaultValues={field.value}
                maximumSelections={200}
                description="Only these calendars show free slots for it."
                error={errors.calendarIds?.message}
                onValueChange={field.onChange}
              />
            )}
          />
          <TextAreaField
            id="appointment-type-preparation"
            label="Preparation notes (optional)"
            description="Shown when booking, such as fasting before a blood test."
            error={errors.preparationNotes?.message}
            {...form.register("preparationNotes")}
          />
          {appointmentType && (
            <Controller
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <CheckboxField
                  id="appointment-type-active"
                  label="Patients can book it"
                  description="Clear this to stop new bookings. Booked appointments stay."
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          )}
        </section>
        {saveMutation.isError && Object.keys(errors).length === 0 && (
          <FormMessage tone="error">{saveMutation.error.message}</FormMessage>
        )}
      </form>
    </DetailSheet>
  );
}
