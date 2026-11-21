"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";

type ReasonFormValues = { reason: string };

/**
 * Asks for the reason kept with a change to a record, such as marking a
 * note entered in error or removing a label.
 */
export function ReasonDialog({
  open,
  onOpenChange,
  identifier,
  title,
  description,
  reasonLabel,
  reasonHint,
  minimumLength,
  maximumLength,
  submitLabel,
  submittingLabel,
  tone = "default",
  isSubmitting,
  error,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  identifier: string;
  title: string;
  description?: string;
  reasonLabel: string;
  reasonHint?: string;
  minimumLength: number;
  maximumLength: number;
  submitLabel: string;
  submittingLabel: string;
  tone?: "default" | "destructive";
  isSubmitting: boolean;
  /** A failed request, shown under the field. */
  error?: string;
  onSubmit: (reason: string) => void;
}) {
  const form = useForm<ReasonFormValues>({
    resolver: zodResolver(
      z.object({
        reason: z
          .string()
          .trim()
          .min(
            minimumLength,
            `Give a reason of at least ${minimumLength} characters.`
          )
          .max(maximumLength, `Use ${maximumLength} characters or fewer.`),
      })
    ),
    defaultValues: { reason: "" },
  });

  useEffect(() => {
    if (open) form.reset({ reason: "" });
    // Reset only when the dialog opens.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const submit = form.handleSubmit(({ reason }) => onSubmit(reason));

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      submitLabel={submitLabel}
      submittingLabel={submittingLabel}
      tone={tone}
      isSubmitting={isSubmitting}
      error={error}
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <TextAreaField
        id={`${identifier}-reason`}
        label={reasonLabel}
        description={reasonHint}
        required
        maxLength={maximumLength}
        error={form.formState.errors.reason?.message}
        {...form.register("reason")}
      />
    </FormDialog>
  );
}
