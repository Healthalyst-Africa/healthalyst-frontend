"use client";

import { useEffect, useState } from "react";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { LEFT_REASON_MAXIMUM_LENGTH } from "~/features/patient-flow/config/patient-flow";
import type { useQueueActions } from "~/features/patient-flow/hooks/use-patient-flow";
import type { QueueEntry } from "~/features/patient-flow/schemas/patient-flow-response-schemas";
import { describePatientName } from "~/features/patient-flow/utilities/front-desk";

/**
 * Ends the visit of a patient who went home before being seen, with an
 * optional reason the facility can learn from.
 */
export function LeftWithoutBeingSeenDialog({
  entry,
  onOpenChange,
  mutation,
  onRecorded,
}: {
  entry: QueueEntry | null;
  onOpenChange: (open: boolean) => void;
  mutation: ReturnType<typeof useQueueActions>["left"];
  onRecorded: () => void;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (entry) {
      setReason("");
      mutation.reset();
    }
    // Reset only when a different patient is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entry]);

  return (
    <FormDialog
      open={entry !== null}
      onOpenChange={onOpenChange}
      title={
        entry
          ? `${describePatientName(entry.patient)} left without being seen?`
          : "Left without being seen?"
      }
      description="Their visit ends and they leave every queue. Check the waiting area first."
      submitLabel="Record and end the visit"
      submittingLabel="Recording"
      tone="destructive"
      isSubmitting={mutation.isPending}
      error={mutation.error?.message}
      onSubmit={(formEvent) => {
        formEvent.preventDefault();
        if (!entry) return;
        const trimmedReason = reason.trim();
        mutation.mutate(
          {
            visitId: entry.visitId,
            reason: trimmedReason === "" ? undefined : trimmedReason,
          },
          {
            onSuccess: () => {
              announceSuccess(
                `${describePatientName(entry.patient)}'s visit ended: left without being seen`
              );
              onRecorded();
            },
          }
        );
      }}
    >
      <TextAreaField
        id="left-without-being-seen-reason"
        label="Reason"
        description="Such as “waited too long” or “felt better”."
        rows={2}
        maxLength={LEFT_REASON_MAXIMUM_LENGTH}
        value={reason}
        onChange={(changeEvent) => setReason(changeEvent.target.value)}
      />
    </FormDialog>
  );
}
