"use client";

import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChoiceCardGroup } from "@healthalyst/ui/components/choice-card-group";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { TextField } from "@healthalyst/ui/components/text-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import {
  BILLING_TEXT_LIMITS,
  PAYMENT_METHOD_OPTIONS,
} from "~/features/billing/config/billing";
import { useTakePayment } from "~/features/billing/hooks/use-billing";
import {
  paymentFormSchema,
  type PaymentFormValues,
} from "~/features/billing/schemas/billing-form-schemas";
import type { Account } from "~/features/billing/schemas/billing-response-schemas";
import { describeBillingError } from "~/features/billing/utilities/bill-presentation";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";
import {
  formatNaira,
  koboToNairaText,
  nairaTextToKobo,
} from "~/shared/money/naira-amount";

/**
 * Takes the patient's payment and issues a receipt. The amount starts at
 * what is still owed; part payments are allowed.
 */
export function TakePaymentDialog({
  account,
  patientName,
  onOpenChange,
}: {
  /** `null` while closed. */
  account: Account | null;
  patientName: string;
  onOpenChange: (open: boolean) => void;
}) {
  const paymentMutation = useTakePayment();
  const [paymentIdentifier, setPaymentIdentifier] = useState("");
  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { amount: "", reference: "" },
    shouldFocusError: false,
  });
  const errors = form.formState.errors;
  const method = form.watch("method");

  useEffect(() => {
    if (account) {
      form.reset({
        amount: koboToNairaText(account.totals.balanceKobo),
        reference: "",
      });
      paymentMutation.reset();
      // One identifier per payment: a retry of the same one is recorded once.
      setPaymentIdentifier(crypto.randomUUID());
    }
    // Reset only when the dialog opens for a bill.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.id]);

  const submit = form.handleSubmit(
    (values) => {
      if (!account) return;
      const amountKobo = nairaTextToKobo(values.amount) ?? 0;
      paymentMutation.mutate(
        {
          accountId: account.id,
          request: {
            id: paymentIdentifier,
            method: values.method,
            amountKobo,
            reference: values.reference,
          },
        },
        {
          onSuccess: (updatedAccount) => {
            const receipt = updatedAccount.payments.find(
              (payment) => payment.id === paymentIdentifier
            );
            announceSuccess(
              `${formatNaira(amountKobo)} received`,
              receipt
                ? `Receipt ${receipt.receiptNumber}. ${updatedAccount.totals.balanceKobo > 0 ? `${formatNaira(updatedAccount.totals.balanceKobo)} still owed.` : "The bill is paid."}`
                : undefined
            );
            onOpenChange(false);
          },
          onError: (error) =>
            applyFieldErrors(error, form.setError, [
              "method",
              "amount",
              "reference",
            ]),
        }
      );
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, {
        method: "payment-method",
        amount: "payment-amount",
        reference: "payment-reference",
      })
  );

  return (
    <FormDialog
      open={account !== null}
      onOpenChange={onOpenChange}
      title={`Take payment from ${patientName}`}
      description={
        account
          ? `${formatNaira(account.totals.balanceKobo)} still owed.`
          : undefined
      }
      submitLabel="Record payment"
      submittingLabel="Recording"
      isSubmitting={paymentMutation.isPending}
      error={
        paymentMutation.isError && Object.keys(errors).length === 0
          ? describeBillingError(paymentMutation.error)
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <Controller
        control={form.control}
        name="method"
        render={({ field }) => (
          <ChoiceCardGroup
            id="payment-method"
            legend="How the patient paid"
            required
            options={PAYMENT_METHOD_OPTIONS}
            value={field.value ?? ""}
            onValueChange={field.onChange}
            error={errors.method?.message}
          />
        )}
      />
      <TextField
        id="payment-amount"
        label="Amount (₦)"
        description="Less than the full amount is fine: the rest stays owed."
        required
        inputMode="decimal"
        autoComplete="off"
        error={errors.amount?.message}
        {...form.register("amount")}
      />
      {(method === "POS" || method === "TRANSFER") && (
        <TextField
          id="payment-reference"
          label={method === "POS" ? "POS slip number" : "Transfer reference"}
          description="So the payment can be matched with the bank later."
          maxLength={BILLING_TEXT_LIMITS.referenceMaximum}
          autoComplete="off"
          error={errors.reference?.message}
          {...form.register("reference")}
        />
      )}
    </FormDialog>
  );
}
