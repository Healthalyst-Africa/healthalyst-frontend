"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { TextAreaField } from "@healthalyst/ui/components/text-area-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import { BILLING_TEXT_LIMITS } from "~/features/billing/config/billing";
import { useWaiveAmount } from "~/features/billing/hooks/use-billing";
import {
  waiverFormSchema,
  type WaiverFormValues,
} from "~/features/billing/schemas/billing-form-schemas";
import type { Account } from "~/features/billing/schemas/billing-response-schemas";
import { describeBillingError } from "~/features/billing/utilities/bill-presentation";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";
import { formatNaira, nairaTextToKobo } from "~/shared/money/naira-amount";

/** Waives part of what the patient owes, within the person's approval limit. */
export function WaiveDialog({
  account,
  onOpenChange,
}: {
  /** `null` while closed. */
  account: Account | null;
  onOpenChange: (open: boolean) => void;
}) {
  const waiveMutation = useWaiveAmount();
  const form = useForm<WaiverFormValues>({
    resolver: zodResolver(waiverFormSchema),
    defaultValues: { amount: "", reason: "" },
    shouldFocusError: false,
  });
  const errors = form.formState.errors;

  useEffect(() => {
    if (account) {
      form.reset({ amount: "", reason: "" });
      waiveMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.id]);

  const submit = form.handleSubmit(
    (values) => {
      if (!account) return;
      const amountKobo = nairaTextToKobo(values.amount) ?? 0;
      waiveMutation.mutate(
        {
          accountId: account.id,
          request: { amountKobo, reason: values.reason },
        },
        {
          onSuccess: () => {
            announceSuccess(`${formatNaira(amountKobo)} waived`);
            onOpenChange(false);
          },
          onError: (error) =>
            applyFieldErrors(error, form.setError, ["amount", "reason"]),
        }
      );
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        amount: "waiver-amount",
        reason: "waiver-reason",
      })
  );

  return (
    <FormDialog
      open={account !== null}
      onOpenChange={onOpenChange}
      title="Waive part of the bill"
      description={
        account
          ? `${formatNaira(account.totals.balanceKobo)} still owed. You can waive up to your approval limit.`
          : undefined
      }
      submitLabel="Waive"
      submittingLabel="Waiving"
      isSubmitting={waiveMutation.isPending}
      error={
        waiveMutation.isError && Object.keys(errors).length === 0
          ? describeBillingError(waiveMutation.error)
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <TextField
        id="waiver-amount"
        label="Amount to waive (₦)"
        required
        inputMode="decimal"
        autoComplete="off"
        error={errors.amount?.message}
        {...form.register("amount")}
      />
      <TextAreaField
        id="waiver-reason"
        label="Reason"
        description="For example: hardship, or staff discount."
        required
        rows={3}
        maxLength={BILLING_TEXT_LIMITS.reasonMaximum}
        error={errors.reason?.message}
        {...form.register("reason")}
      />
    </FormDialog>
  );
}
