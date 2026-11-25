"use client";

import { useEffect } from "react";
import { Controller, useFieldArray, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AddIcon, DeleteIcon } from "@healthalyst/icons";
import { ActionButton } from "@healthalyst/ui/components/action-button";
import { CheckboxField } from "@healthalyst/ui/components/checkbox-field";
import { FormDialog } from "@healthalyst/ui/components/form-dialog";
import { SelectField } from "@healthalyst/ui/components/select-field";
import { TextField } from "@healthalyst/ui/components/text-field";
import { announceSuccess } from "@healthalyst/ui/components/toast-region";
import {
  BILLING_TEXT_LIMITS,
  PRICE_CATEGORY_OPTIONS,
} from "~/features/billing/config/billing";
import {
  useSavePayerPrices,
  useSavePriceItem,
} from "~/features/billing/hooks/use-billing";
import {
  priceItemWithPayerPricesFormSchema,
  type PriceItemWithPayerPricesFormValues,
} from "~/features/billing/schemas/billing-form-schemas";
import type { PriceItem } from "~/features/billing/schemas/billing-response-schemas";
import { describeBillingError } from "~/features/billing/utilities/bill-presentation";
import { applyFieldErrors } from "~/shared/forms/apply-field-errors";
import { focusFirstInvalidField } from "~/shared/forms/focus-first-invalid-field";
import { koboToNairaText, nairaTextToKobo } from "~/shared/money/naira-amount";

type FormValues = PriceItemWithPayerPricesFormValues;

const FIELD_IDENTIFIERS: Readonly<Record<string, string>> = {
  code: "price-item-code",
  name: "price-item-name",
  category: "price-item-category",
  price: "price-item-price",
};

function toFormValues(item: PriceItem | null): FormValues {
  return item
    ? {
        code: item.code,
        name: item.name,
        category: item.category,
        price: koboToNairaText(item.priceKobo),
        isActive: item.isActive,
        prices: item.payerPrices.map((payerPrice) => ({
          payerName: payerPrice.payerName,
          price: koboToNairaText(payerPrice.priceKobo),
          patientSharePercent: String(payerPrice.patientSharePercent),
        })),
      }
    : {
        code: "",
        name: "",
        category: "CONSULTATION",
        price: "",
        isActive: true,
        prices: [],
      };
}

/** The open item: one being changed, or a new one. */
export type PriceItemEditing = { item: PriceItem | null };

/**
 * Adds or changes a price list item, with what each insurer pays for it and
 * the patient's share. Charges already made keep their old price.
 */
export function PriceItemDialog({
  editing,
  onOpenChange,
}: {
  /** `null` while closed. */
  editing: PriceItemEditing | null;
  onOpenChange: (open: boolean) => void;
}) {
  const itemMutation = useSavePriceItem();
  const payerMutation = useSavePayerPrices();
  const form = useForm<FormValues>({
    resolver: zodResolver(priceItemWithPayerPricesFormSchema),
    defaultValues: toFormValues(null),
    shouldFocusError: false,
  });
  const errors = form.formState.errors;
  const payerRows = useFieldArray({ control: form.control, name: "prices" });
  const item = editing?.item ?? null;

  useEffect(() => {
    if (editing) {
      form.reset(toFormValues(editing.item));
      itemMutation.reset();
      payerMutation.reset();
    }
    // Reset only when the dialog opens for an item.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editing]);

  const submit = form.handleSubmit(
    async (values) => {
      try {
        const saved = await itemMutation.mutateAsync({
          priceItemId: item?.id ?? null,
          version: item?.version ?? 0,
          request: {
            code: values.code.trim(),
            name: values.name.trim(),
            category: values.category,
            priceKobo: nairaTextToKobo(values.price) ?? 0,
            isActive: values.isActive,
          },
        });
        await payerMutation.mutateAsync({
          priceItemId: saved.id,
          prices: values.prices.map((payerPrice) => ({
            payerName: payerPrice.payerName.trim(),
            priceKobo: nairaTextToKobo(payerPrice.price) ?? 0,
            patientSharePercent: Number(payerPrice.patientSharePercent),
          })),
        });
        announceSuccess(item ? "Item saved" : "Item added", saved.name);
        onOpenChange(false);
      } catch (error) {
        if (error instanceof Error) {
          applyFieldErrors(error, form.setError, [
            "code",
            "name",
            "category",
            "price",
          ]);
        }
      }
    },
    (invalidFields) => focusFirstInvalidField(invalidFields, FIELD_IDENTIFIERS)
  );

  const failure = itemMutation.error ?? payerMutation.error;

  return (
    <FormDialog
      open={editing !== null}
      onOpenChange={onOpenChange}
      title={item ? `Change ${item.name}` : "Add a price list item"}
      description="Charges already made keep the price they had."
      size="wide"
      submitLabel={item ? "Save item" : "Add item"}
      submittingLabel="Saving"
      isSubmitting={itemMutation.isPending || payerMutation.isPending}
      error={
        failure && Object.keys(errors).length === 0
          ? describeBillingError(failure)
          : undefined
      }
      onSubmit={(formEvent) => void submit(formEvent)}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          id="price-item-name"
          label="Name"
          description="As patients see it on their receipt."
          required
          maxLength={BILLING_TEXT_LIMITS.nameMaximum}
          autoComplete="off"
          error={errors.name?.message}
          {...form.register("name")}
        />
        <TextField
          id="price-item-code"
          label="Code"
          description="A short code staff can search by, such as CONS-GEN."
          required
          maxLength={BILLING_TEXT_LIMITS.codeMaximum}
          autoComplete="off"
          error={errors.code?.message}
          {...form.register("code")}
        />
        <Controller
          control={form.control}
          name="category"
          render={({ field }) => (
            <SelectField
              id="price-item-category"
              label="Kind of item"
              required
              placeholder="Choose a kind"
              options={PRICE_CATEGORY_OPTIONS}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.category?.message}
            />
          )}
        />
        <TextField
          id="price-item-price"
          label="Standard price (₦)"
          description="What patients without insurance pay."
          required
          inputMode="decimal"
          autoComplete="off"
          error={errors.price?.message}
          {...form.register("price")}
        />
      </div>
      <Controller
        control={form.control}
        name="isActive"
        render={({ field }) => (
          <CheckboxField
            id="price-item-active"
            label="In use"
            description="Switched-off items cannot be charged."
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        )}
      />

      <fieldset className="flex flex-col gap-4">
        <legend className="mb-1 text-body font-medium">Insurer prices</legend>
        <p className="text-sm text-muted-foreground">
          For patients covered by one of these insurers, the insurer's price
          applies and the patient pays their share of it. Other insurers pay the
          standard price.
        </p>
        {payerRows.fields.map((row, rowIndex) => (
          <div
            key={row.id}
            className="grid items-start gap-3 rounded-lg border p-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_auto]"
          >
            <TextField
              id={`payer-name-${rowIndex}`}
              label="Insurer"
              required
              autoComplete="off"
              error={errors.prices?.[rowIndex]?.payerName?.message}
              {...form.register(`prices.${rowIndex}.payerName`)}
            />
            <TextField
              id={`payer-price-${rowIndex}`}
              label="Price (₦)"
              required
              inputMode="decimal"
              autoComplete="off"
              error={errors.prices?.[rowIndex]?.price?.message}
              {...form.register(`prices.${rowIndex}.price`)}
            />
            <TextField
              id={`payer-share-${rowIndex}`}
              label="Patient pays (%)"
              required
              inputMode="numeric"
              autoComplete="off"
              error={errors.prices?.[rowIndex]?.patientSharePercent?.message}
              {...form.register(`prices.${rowIndex}.patientSharePercent`)}
            />
            <ActionButton
              type="button"
              variant="ghost"
              size="icon"
              className="mt-7"
              aria-label={`Remove insurer ${rowIndex + 1}`}
              onClick={() => payerRows.remove(rowIndex)}
            >
              <DeleteIcon aria-hidden="true" className="size-4" />
            </ActionButton>
          </div>
        ))}
        <ActionButton
          type="button"
          variant="outline"
          size="compact"
          className="w-fit"
          leadingIcon={<AddIcon />}
          onClick={() =>
            payerRows.append({
              payerName: "",
              price: "",
              patientSharePercent: "",
            })
          }
        >
          Add an insurer price
        </ActionButton>
      </fieldset>
    </FormDialog>
  );
}
