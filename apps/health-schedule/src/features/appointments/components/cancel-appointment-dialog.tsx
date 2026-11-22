"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChoiceCardGroup } from "@healthalyst/ui/components/choice-card-group";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  APPOINTMENT_TEXT_LIMITS,
  CANCELLED_BY_OPTIONS,
} from "~/features/appointments/config/appointments";
import { useCancelAppointment } from "~/features/appointments/hooks/use-appointments";
import {
  cancelAppointmentFormSchema,
  type CancelAppointmentFormValues,
} from "~/features/appointments/schemas/appointment-form-schemas";
import type { Appointment } from "~/features/appointments/schemas/appointment-response-schemas";
import { describeBookingError } from "~/features/appointments/utilities/appointment-presentation";
import { describePatientName } from "~/features/patient-flow/utilities/front-desk";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";
import { describeBranchDateTime } from "~/shared/time/branch-time";

/** Cancels a booking, keeping who cancelled and why, and frees the time. */
export function CancelAppointmentDialog({
  appointment,
  onOpenChange,
}: {
  /** `null` while closed. */
  appointment: Appointment | null;
  onOpenChange: (open: boolean) => void;
}) {
  const cancelMutation = useCancelAppointment();
  const form = useForm<CancelAppointmentFormValues>({
    resolver: zodResolver(cancelAppointmentFormSchema),
    defaultValues: { reason: "" },
    shouldFocusError: false,
  });
  const errors = form.formState.errors;

  useEffect(() => {
    if (appointment) {
      form.reset({ reason: "" });
      cancelMutation.reset();
    }
    // Reset only when a different appointment is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment]);

  const patientName = appointment?.patient
    ? describePatientName(appointment.patient)
    : "the patient";

  const submit = form.handleSubmit(
    (values) => {
      if (!appointment) return;
      cancelMutation.mutate(
        {
          appointmentId: appointment.id,
          reason: values.reason.trim(),
          cancelledBy: values.cancelledBy,
        },
        {
          onSuccess: () => {
            announceSuccess(
              "Appointment cancelled",
              `The time is free for someone else to book.`
            );
            onOpenChange(false);
          },
          onError: (error) =>
            applyFieldErrors(error, form.setError, ["reason", "cancelledBy"]),
        }
      );
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        cancelledBy: "cancel-appointment-by",
        reason: "cancel-appointment-reason",
      })
  );

  return (
    <FormDialog
      open={appointment !== null}
      onOpenChange={onOpenChange}
      title={`Cancel ${patientName}'s appointment`}
      description={
        appointment
          ? `${describeBranchDateTime(appointment.startsAt)} with ${appointment.resourceName} for ${appointment.appointmentTypeName}.`
          : undefined
      }
      submitLabel="Cancel appointment"
      dismissLabel="Keep appointment"
      submittingLabel="Cancelling"
      tone="destructive"
      isSubmitting={cancelMutation.isPending}
      error={
        cancelMutation.isError && Object.keys(errors).length === 0
          ? describeBookingError(
              cancelMutation.error instanceof PlatformApiError
                ? cancelMutation.error.code
                : null,
              cancelMutation.error.message
            )
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <Controller
        control={form.control}
        name="cancelledBy"
        render={({ field }) => (
          <ChoiceCardGroup
            id="cancel-appointment-by"
            legend="Who cancelled"
            required
            options={CANCELLED_BY_OPTIONS}
            value={field.value ?? ""}
            onValueChange={field.onChange}
            error={errors.cancelledBy?.message}
          />
        )}
      />
      <TextAreaField
        id="cancel-appointment-reason"
        label="Reason"
        description="For example: travelling, or feeling better."
        required
        rows={3}
        maxLength={APPOINTMENT_TEXT_LIMITS.reasonMaximum}
        error={errors.reason?.message}
        {...form.register("reason")}
      />
    </FormDialog>
  );
}
