"use client";

import { useEffect } from "react";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import { useRecordNoShow } from "~/features/appointments/hooks/use-appointments";
import type { Appointment } from "~/features/appointments/schemas/appointment-response-schemas";
import { describeBookingError } from "~/features/appointments/utilities/appointment-presentation";
import { describePatientName } from "~/features/patient-flow/utilities/front-desk";
import { describeBranchDateTime } from "~/shared/time/branch-time";

/** Records that a patient did not come to an appointment that has started. */
export function NoShowDialog({
  appointment,
  onOpenChange,
}: {
  /** `null` while closed. */
  appointment: Appointment | null;
  onOpenChange: (open: boolean) => void;
}) {
  const noShowMutation = useRecordNoShow();

  useEffect(() => {
    if (appointment) noShowMutation.reset();
    // Reset only when a different appointment is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appointment]);

  const patientName = appointment?.patient
    ? describePatientName(appointment.patient)
    : "The patient";

  return (
    <FormDialog
      open={appointment !== null}
      onOpenChange={onOpenChange}
      title={`${patientName} did not come?`}
      description={
        appointment
          ? `${describeBranchDateTime(appointment.startsAt)} with ${appointment.resourceName} for ${appointment.appointmentTypeName}.`
          : undefined
      }
      submitLabel="Record that they did not come"
      submittingLabel="Recording"
      isSubmitting={noShowMutation.isPending}
      error={
        noShowMutation.isError
          ? describeBookingError(
              noShowMutation.error instanceof PlatformApiError
                ? noShowMutation.error.code
                : null,
              noShowMutation.error.message
            )
          : undefined
      }
      onSubmit={(formEvent) => {
        formEvent.preventDefault();
        if (!appointment) return;
        noShowMutation.mutate(appointment.id, {
          onSuccess: () => {
            announceSuccess(`Recorded that ${patientName} did not come`);
            onOpenChange(false);
          },
        });
      }}
    >
      <p className="text-sm leading-6 text-muted-foreground">
        It stays on their record. If they arrive later, book them again or check
        them in as a walk-in.
      </p>
    </FormDialog>
  );
}
