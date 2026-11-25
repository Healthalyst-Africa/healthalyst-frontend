"use client";

import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ChoiceCardGroup } from "@healthalyst/ui/components/choice-card-group";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import {
  BILLING_PERMISSIONS,
  BILLING_TEXT_LIMITS,
} from "~/features/billing/config/billing";
import {
  useAddCharge,
  usePriceItems,
} from "~/features/billing/hooks/use-billing";
import {
  chargeFormSchema,
  type ChargeFormValues,
} from "~/features/billing/schemas/billing-form-schemas";
import type { Account } from "~/features/billing/schemas/billing-response-schemas";
import {
  describeBillingError,
  describePriceCategory,
} from "~/features/billing/utilities/bill-presentation";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";
import { formatNaira, nairaTextToKobo } from "~/shared/money/naira-amount";
import { useWorkspace } from "~/shared/workspace/workspace-context";

const CHARGE_KIND_OPTIONS = [
  {
    value: "price-item",
    label: "From the price list",
    description: "Insurer prices apply on their own.",
  },
  {
    value: "one-off",
    label: "Something else",
    description: "Not on the price list, at a price you enter.",
  },
] as const;

/** Each field's input, for focusing the first one with an error. */
const CHARGE_FIELD_IDENTIFIERS: Readonly<Record<string, string>> = {
  priceItemId: "charge-price-item",
  description: "charge-description",
  amount: "charge-amount",
  quantity: "charge-quantity",
};

const DEFAULT_VALUES: ChargeFormValues = {
  kind: "price-item",
  priceItemId: "",
  quantity: "1",
};

/**
 * Adds a charge to a bill. Tests and scans add their own charges when they
 * are ordered, so this is for anything else, such as a dressing.
 */
export function AddChargeDialog({
  account,
  onOpenChange,
}: {
  /** `null` while closed. */
  account: Account | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { permissions } = useWorkspace();
  const priceItemsQuery = usePriceItems(
    account !== null && permissions.includes(BILLING_PERMISSIONS.read)
  );
  const chargeMutation = useAddCharge();
  const form = useForm<ChargeFormValues>({
    resolver: zodResolver(chargeFormSchema),
    defaultValues: DEFAULT_VALUES,
    shouldFocusError: false,
  });
  const errors = form.formState.errors;
  const kind = form.watch("kind");

  useEffect(() => {
    if (account) {
      form.reset(DEFAULT_VALUES);
      chargeMutation.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.id]);

  const priceItemOptions = (priceItemsQuery.data ?? [])
    .filter((item) => item.isActive)
    .map((item) => ({
      value: item.id,
      label: `${item.name}, ${formatNaira(item.priceKobo)}`,
      group: describePriceCategory(item.category),
    }))
    .sort((first, second) =>
      (first.group + first.label).localeCompare(second.group + second.label)
    );

  const submit = form.handleSubmit(
    (values) => {
      if (!account) return;
      const quantity = Number(values.quantity);
      chargeMutation.mutate(
        {
          accountId: account.id,
          request:
            values.kind === "price-item"
              ? {
                  kind: "price-item",
                  priceItemId: values.priceItemId,
                  quantity,
                }
              : {
                  kind: "one-off",
                  description: values.description,
                  unitKobo: nairaTextToKobo(values.amount) ?? 0,
                  quantity,
                },
        },
        {
          onSuccess: () => {
            announceSuccess("Charge added");
            onOpenChange(false);
          },
          onError: (error) =>
            applyFieldErrors(error, form.setError, [
              "priceItemId",
              "description",
              "amount",
              "quantity",
            ]),
        }
      );
    },
    (invalidFields) =>
      focusFirstInvalidField(invalidFields, CHARGE_FIELD_IDENTIFIERS)
  );

  return (
    <FormDialog
      open={account !== null}
      onOpenChange={onOpenChange}
      title="Add a charge"
      submitLabel="Add charge"
      submittingLabel="Adding"
      isSubmitting={chargeMutation.isPending}
      error={
        chargeMutation.isError && Object.keys(errors).length === 0
          ? describeBillingError(chargeMutation.error)
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <Controller
        control={form.control}
        name="kind"
        render={({ field }) => (
          <ChoiceCardGroup
            id="charge-kind"
            legend="What to charge"
            options={CHARGE_KIND_OPTIONS}
            value={field.value}
            onValueChange={(value) =>
              form.reset(
                value === "one-off"
                  ? {
                      kind: "one-off",
                      description: "",
                      amount: "",
                      quantity: "1",
                    }
                  : DEFAULT_VALUES
              )
            }
          />
        )}
      />
      {kind === "price-item" ? (
        <Controller
          control={form.control}
          name="priceItemId"
          render={({ field }) => (
            <SelectField
              id="charge-price-item"
              label="Item"
              required
              placeholder={
                priceItemsQuery.isPending
                  ? "Loading the price list"
                  : "Choose an item"
              }
              options={priceItemOptions}
              value={field.value}
              onValueChange={field.onChange}
              error={
                ("priceItemId" in errors
                  ? errors.priceItemId?.message
                  : undefined) ??
                (priceItemsQuery.isError
                  ? priceItemsQuery.error.message
                  : undefined)
              }
            />
          )}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <TextField
            id="charge-description"
            label="What it is for"
            required
            maxLength={BILLING_TEXT_LIMITS.descriptionMaximum}
            autoComplete="off"
            error={
              "description" in errors ? errors.description?.message : undefined
            }
            {...form.register("description")}
          />
          <TextField
            id="charge-amount"
            label="Price each (₦)"
            required
            inputMode="decimal"
            autoComplete="off"
            error={"amount" in errors ? errors.amount?.message : undefined}
            {...form.register("amount")}
          />
        </div>
      )}
      <TextField
        id="charge-quantity"
        label="Quantity"
        required
        inputMode="numeric"
        autoComplete="off"
        className="max-w-40"
        error={errors.quantity?.message}
        {...form.register("quantity")}
      />
    </FormDialog>
  );
}
