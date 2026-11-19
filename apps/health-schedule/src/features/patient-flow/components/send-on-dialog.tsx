"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { CHECK_IN_NOTE_MAXIMUM_LENGTH } from "~/features/patient-flow/config/patient-flow";
import {
  transferFormSchema,
  type TransferFormValues,
} from "~/features/patient-flow/schemas/patient-flow-form-schemas";
import type { QueueEntry } from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import {
  toTransferRequest,
  type TransferRequest,
} from "~/features/patient-flow/utilities/patient-flow-requests";
import type { QueueTargetOption } from "~/features/patient-flow/utilities/queue-targets";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";

const EMPTY_VALUES: TransferFormValues = { queueTarget: "", note: "" };

/** Sends a patient to their next queue, keeping their place in priority. */
export function SendOnDialog({
  entry,
  onOpenChange,
  queueTargetOptions,
  isSubmitting,
  error,
  onSubmit,
}: {
  entry: QueueEntry | null;
  onOpenChange: (open: boolean) => void;
  queueTargetOptions: readonly QueueTargetOption[];
  isSubmitting: boolean;
  error: unknown;
  onSubmit: (request: TransferRequest) => void;
}) {
  const form = useForm<TransferFormValues>({
    resolver: zodResolver(transferFormSchema),
    defaultValues: EMPTY_VALUES,
    shouldFocusError: false,
  });
  const errors = form.formState.errors;

  useEffect(() => {
    if (entry) form.reset(EMPTY_VALUES);
    // Reset only when a different patient is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]);

  useEffect(() => {
    if (error) applyFieldErrors(error, form.setError, ["queueTarget", "note"]);
  }, [error, form.setError]);

  const submit = form.handleSubmit(
    (values) => onSubmit(toTransferRequest(values)),
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        queueTarget: "send-on-queue",
        note: "send-on-note",
      })
  );

  return (
    <FormDialog
      open={entry !== null}
      onOpenChange={onOpenChange}
      title={
        entry
          ? `Send ${entry.patient.firstName} ${entry.patient.lastName} on`
          : "Send on"
      }
      description="They leave this queue and join the next one with the same priority."
      submitLabel="Send on"
      submittingLabel="Sending on"
      isSubmitting={isSubmitting}
      error={
        error instanceof Error && Object.keys(errors).length === 0
          ? error.message
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <Controller
        control={form.control}
        name="queueTarget"
        render={({ field }) => (
          <SelectField
            id="send-on-queue"
            label="Send to"
            placeholder="Choose the next queue"
            options={queueTargetOptions}
            value={field.value}
            onValueChange={field.onChange}
            error={errors.queueTarget?.message}
          />
        )}
      />
      <TextAreaField
        id="send-on-note"
        label="Note for the next team (optional)"
        description="For example: full blood count requested, or review with results."
        rows={3}
        maxLength={CHECK_IN_NOTE_MAXIMUM_LENGTH}
        error={errors.note?.message}
        {...form.register("note")}
      />
    </FormDialog>
  );
}
