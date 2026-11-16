"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { CHECK_IN_NOTE_MAXIMUM_LENGTH } from "~/features/patient-flow/config/patient-flow";
import { useCheckIn } from "~/features/patient-flow/hooks/use-patient-flow";
import {
  checkInFormSchema,
  type CheckInFormValues,
} from "~/features/patient-flow/schemas/patient-flow-form-schemas";
import {
  toCheckInRequest,
  type CheckInArrival,
} from "~/features/patient-flow/utilities/patient-flow-requests";
import {
  describeQueue,
  encodeQueueTarget,
  type QueueTargetOption,
} from "~/features/patient-flow/utilities/queue-targets";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";

/** Who is being checked in, as the dialog shows them. */
export type CheckInCandidate = {
  arrival: CheckInArrival;
  patientName: string;
  /** Such as "HS-00012 · Booked 10:00 with Dr Bello". */
  details: string;
};

const DEFAULT_FIRST_QUEUE = encodeQueueTarget({ kind: "TRIAGE" });

/**
 * Opens the patient's visit and puts them in their first queue: triage
 * unless the desk sends them straight to a doctor or a department.
 */
export function CheckInDialog({
  candidate,
  onOpenChange,
  branchId,
  queueTargetOptions,
}: {
  candidate: CheckInCandidate | null;
  onOpenChange: (open: boolean) => void;
  branchId: string;
  queueTargetOptions: readonly QueueTargetOption[];
}) {
  const checkInMutation = useCheckIn();
  const [checkInIdentifier, setCheckInIdentifier] = useState("");
  const form = useForm<CheckInFormValues>({
    resolver: zodResolver(checkInFormSchema),
    defaultValues: { queueTarget: DEFAULT_FIRST_QUEUE, note: "" },
    shouldFocusError: false,
  });
  const errors = form.formState.errors;

  useEffect(() => {
    if (candidate) {
      form.reset({ queueTarget: DEFAULT_FIRST_QUEUE, note: "" });
      checkInMutation.reset();
      // A new identifier per patient; a retry of the same check-in reuses it.
      setCheckInIdentifier(crypto.randomUUID());
    }
    // Reset only when a different patient is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidate]);

  const submit = form.handleSubmit(
    (values) => {
      if (!candidate) return;
      checkInMutation.mutate(
        toCheckInRequest({
          checkInIdentifier,
          branchId,
          arrival: candidate.arrival,
          values,
        }),
        {
          onSuccess: (visit) => {
            announceSuccess(
              `${candidate.patientName} is checked in as ${visit.token}`,
              visit.current
                ? `Waiting for ${describeQueue(visit.current)}.`
                : undefined
            );
            onOpenChange(false);
          },
          onError: (error) => {
            applyFieldErrors(error, form.setError, ["queueTarget", "note"]);
          },
        }
      );
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        queueTarget: "check-in-queue",
        note: "check-in-note",
      })
  );

  return (
    <FormDialog
      open={candidate !== null}
      onOpenChange={onOpenChange}
      title={candidate ? `Check in ${candidate.patientName}` : "Check in"}
      description={candidate?.details}
      submitLabel="Check in"
      submittingLabel="Checking in"
      isSubmitting={checkInMutation.isPending}
      error={
        checkInMutation.isError && Object.keys(errors).length === 0
          ? checkInMutation.error.message
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <Controller
        control={form.control}
        name="queueTarget"
        render={({ field }) => (
          <SelectField
            id="check-in-queue"
            label="Send to"
            placeholder="Choose where the patient goes first"
            options={queueTargetOptions}
            value={field.value}
            onValueChange={field.onChange}
            error={errors.queueTarget?.message}
          />
        )}
      />
      <TextAreaField
        id="check-in-note"
        label="Note for staff (optional)"
        description="For example: came with a referral letter, or needs a wheelchair."
        rows={3}
        maxLength={CHECK_IN_NOTE_MAXIMUM_LENGTH}
        error={errors.note?.message}
        {...form.register("note")}
      />
    </FormDialog>
  );
}
