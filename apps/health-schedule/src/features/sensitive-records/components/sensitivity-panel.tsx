"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AddIcon, DeleteIcon, LockedIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { ActionMenu } from "@healthalyst/ui/components/action-menu";
import { ChoiceCardGroup } from "@healthalyst/ui/components/choice-card-group";
import { ContentPanel } from "@healthalyst/ui/components/content-panel";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { NoticeBanner } from "@healthalyst/ui/components/notice-banner";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import {
  SENSITIVE_RECORD_LIMITS as LIMITS,
  SENSITIVE_RECORD_PERMISSIONS,
  SENSITIVITY_CATEGORY_OPTIONS,
} from "~/features/sensitive-records/config/sensitive-records";
import {
  useRecordSensitivity,
  useSensitiveRecordActions,
} from "~/features/sensitive-records/hooks/use-sensitive-records";
import type { SensitivityLabel } from "~/features/sensitive-records/schemas/sensitive-record-response-schemas";
import { describeSensitivityCategory } from "~/features/sensitive-records/utilities/record-access";
import { ReasonDialog } from "~/shared/forms/reason-dialog";
import { useStaffNames } from "~/shared/staff/staff-directory";
import { describeBranchDate } from "~/shared/time/branch-time";
import { useWorkspace } from "~/shared/workspace/workspace-context";

const labelFormSchema = z.object({
  category: z.enum([
    "HIV",
    "MENTAL_HEALTH",
    "SEXUAL_REPRODUCTIVE_HEALTH",
    "SUBSTANCE_USE",
    "RESTRICTED_PERSON",
  ]),
  reason: z
    .string()
    .trim()
    .min(
      LIMITS.labelReasonMinimum,
      `Give a reason of at least ${LIMITS.labelReasonMinimum} characters.`
    )
    .max(
      LIMITS.labelReasonMaximum,
      `Use ${LIMITS.labelReasonMaximum} characters or fewer.`
    ),
});

type LabelFormValues = z.infer<typeof labelFormSchema>;

function AddLabelDialog({
  open,
  onOpenChange,
  patientId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patientId: string;
}) {
  const { addLabel } = useSensitiveRecordActions(patientId);
  const form = useForm<LabelFormValues>({
    resolver: zodResolver(labelFormSchema),
    defaultValues: { category: "HIV", reason: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({ category: "HIV", reason: "" });
      addLabel.reset();
    }
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = form.handleSubmit((values) =>
    addLabel.mutate(values, {
      onSuccess: () => {
        announceSuccess("Record marked as sensitive");
        onOpenChange(false);
      },
    })
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Mark this record as sensitive"
      description="Only the patient's care team will see their notes, problems and clinical documents. Others see a lock, never the category."
      submitLabel="Mark as sensitive"
      submittingLabel="Saving"
      isSubmitting={addLabel.isPending}
      error={addLabel.error?.message}
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <Controller
        control={form.control}
        name="category"
        render={({ field }) => (
          <ChoiceCardGroup
            id="sensitivity-category"
            legend="Category"
            required
            layout="stack"
            options={SENSITIVITY_CATEGORY_OPTIONS}
            value={field.value}
            onValueChange={(value) =>
              field.onChange(value as LabelFormValues["category"])
            }
          />
        )}
      />
      <TextAreaField
        id="sensitivity-reason"
        label="Reason"
        description="Kept with the label and seen by the care team."
        required
        maxLength={LIMITS.labelReasonMaximum}
        error={form.formState.errors.reason?.message}
        {...form.register("reason")}
      />
    </FormDialog>
  );
}

/**
 * Whether the record is sensitive and why, for the patient's overview.
 * Without access, it shows only that the record is restricted.
 */
export function SensitivityPanel({ patientId }: { patientId: string }) {
  const { permissions } = useWorkspace();
  const describeStaff = useStaffNames();
  const sensitivityQuery = useRecordSensitivity(patientId, true);
  const { removeLabel } = useSensitiveRecordActions(patientId);
  const [isAdding, setIsAdding] = useState(false);
  const [labelToRemove, setLabelToRemove] = useState<SensitivityLabel | null>(
    null
  );
  const canManage = permissions.includes(
    SENSITIVE_RECORD_PERMISSIONS.manageLabels
  );
  const sensitivity = sensitivityQuery.data;
  const labels = sensitivity?.labels ?? [];
  const canAddLabel =
    canManage &&
    sensitivity !== undefined &&
    (!sensitivity.restricted || sensitivity.labels !== null);

  return (
    <ContentPanel
      heading="Sensitive record"
      headingLevel={2}
      headingAccessory={
        canAddLabel && (
          <ActionButton
            type="button"
            variant="outline"
            size="compact"
            leadingIcon={<AddIcon className="size-4" />}
            onClick={() => setIsAdding(true)}
          >
            {sensitivity?.restricted ? "Add a label" : "Mark as sensitive"}
          </ActionButton>
        )
      }
    >
      {sensitivityQuery.isPending && (
        <p role="status" className="text-sm text-muted-foreground">
          Checking
        </p>
      )}
      {sensitivityQuery.isError && (
        <NoticeBanner tone="error" title="We could not check this record">
          {sensitivityQuery.error.message}
        </NoticeBanner>
      )}
      {sensitivity && !sensitivity.restricted && (
        <p className="text-sm text-muted-foreground">
          Not restricted. Everyone with clinical access can see the notes.
        </p>
      )}
      {sensitivity?.restricted && sensitivity.labels === null && (
        <p className="flex items-center gap-2 text-sm">
          <LockedIcon aria-hidden="true" className="size-4" />
          Restricted to the patient’s care team.
        </p>
      )}
      {labels.length > 0 && (
        <ul className="flex flex-col divide-y divide-border">
          {labels.map((label) => (
            <li
              key={label.id}
              className="flex items-start justify-between gap-3 py-3 first:pt-0 last:pb-0"
            >
              <div className="flex min-w-0 flex-col gap-1">
                <p className="font-medium">
                  {describeSensitivityCategory(label.category)}
                </p>
                <p className="text-sm text-muted-foreground">{label.reason}</p>
                <p className="text-xs text-muted-foreground">
                  Added by {describeStaff(label.createdById)},{" "}
                  {describeBranchDate(label.createdAt)}
                </p>
              </div>
              {canManage && (
                <ActionMenu
                  accessibleLabel={`Actions for the ${describeSensitivityCategory(label.category)} label`}
                  items={[
                    {
                      label: "Remove label",
                      icon: <DeleteIcon className="size-4" />,
                      tone: "destructive",
                      onSelect: () => {
                        removeLabel.reset();
                        setLabelToRemove(label);
                      },
                    },
                  ]}
                />
              )}
            </li>
          ))}
        </ul>
      )}
      {canManage && (
        <>
          <AddLabelDialog
            open={isAdding}
            onOpenChange={setIsAdding}
            patientId={patientId}
          />
          <ReasonDialog
            open={labelToRemove !== null}
            onOpenChange={(open) => !open && setLabelToRemove(null)}
            identifier="remove-sensitivity-label"
            title="Remove this label?"
            description="If it is the last label, everyone with clinical access can see the notes again."
            reasonLabel="Reason"
            minimumLength={LIMITS.labelReasonMinimum}
            maximumLength={LIMITS.labelReasonMaximum}
            submitLabel="Remove label"
            submittingLabel="Removing"
            tone="destructive"
            isSubmitting={removeLabel.isPending}
            error={removeLabel.error?.message}
            onSubmit={(reason) =>
              labelToRemove &&
              removeLabel.mutate(
                { labelId: labelToRemove.id, reason },
                {
                  onSuccess: () => {
                    announceSuccess("Label removed");
                    setLabelToRemove(null);
                  },
                }
              )
            }
          />
        </>
      )}
    </ContentPanel>
  );
}
