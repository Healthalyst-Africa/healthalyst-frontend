import { z } from "zod";
import { BILLING_TEXT_LIMITS } from "~/features/billing/config/billing";

const NAIRA_PATTERN = /^\d{1,3}(,?\d{3})*(\.\d{1,2})?$|^\d+(\.\d{1,2})?$/;

/** Naira typed as "1500", "1,500" or "1500.50". */
const nairaAmountSchema = (fieldName: string) =>
  z
    .string()
    .trim()
    .min(1, `Enter the ${fieldName}`)
    .refine(
      (value) => NAIRA_PATTERN.test(value),
      `Enter the ${fieldName} in naira, such as 1500 or 1,500.50`
    )
    .refine(
      (value) => Number(value.replaceAll(",", "")) > 0,
      `The ${fieldName} must be more than zero`
    );

const reasonSchema = z
  .string()
  .trim()
  .min(
    BILLING_TEXT_LIMITS.reasonMinimum,
    `Give a reason of at least ${BILLING_TEXT_LIMITS.reasonMinimum} characters`
  )
  .max(
    BILLING_TEXT_LIMITS.reasonMaximum,
    `Use ${BILLING_TEXT_LIMITS.reasonMaximum} characters or fewer`
  );

export const paymentFormSchema = z.object({
  method: z.enum(["CASH", "POS", "TRANSFER"], {
    error: "Choose how the patient paid",
  }),
  amount: nairaAmountSchema("amount"),
  reference: z
    .string()
    .trim()
    .max(
      BILLING_TEXT_LIMITS.referenceMaximum,
      `Use ${BILLING_TEXT_LIMITS.referenceMaximum} characters or fewer`
    ),
});

export const waiverFormSchema = z.object({
  amount: nairaAmountSchema("amount to waive"),
  reason: reasonSchema,
});

const quantitySchema = z
  .string()
  .trim()
  .refine(
    (value) => /^\d+$/.test(value) && Number(value) >= 1,
    "Enter a whole number, 1 or more"
  );

/** A charge from the price list, or a one-off item with its own price. */
export const chargeFormSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("price-item"),
    priceItemId: z.string().min(1, "Choose an item from the price list"),
    quantity: quantitySchema,
  }),
  z.object({
    kind: z.literal("one-off"),
    description: z
      .string()
      .trim()
      .min(2, "Say what the charge is for")
      .max(
        BILLING_TEXT_LIMITS.descriptionMaximum,
        `Use ${BILLING_TEXT_LIMITS.descriptionMaximum} characters or fewer`
      ),
    amount: nairaAmountSchema("price"),
    quantity: quantitySchema,
  }),
]);

export const priceItemFormSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1, "Enter a short code, such as CONS-GEN")
    .max(
      BILLING_TEXT_LIMITS.codeMaximum,
      `Use ${BILLING_TEXT_LIMITS.codeMaximum} characters or fewer`
    ),
  name: z
    .string()
    .trim()
    .min(2, "Enter the item's name")
    .max(
      BILLING_TEXT_LIMITS.nameMaximum,
      `Use ${BILLING_TEXT_LIMITS.nameMaximum} characters or fewer`
    ),
  category: z.enum(
    ["CONSULTATION", "REGISTRATION", "LAB", "IMAGING", "PROCEDURE", "OTHER"],
    { error: "Choose what kind of item it is" }
  ),
  price: nairaAmountSchema("price"),
  isActive: z.boolean(),
});

/** What one insurer pays for an item, and the patient's share. */
export const payerPriceFormSchema = z.object({
  prices: z.array(
    z.object({
      payerName: z.string().trim().min(2, "Enter the insurer's name"),
      price: nairaAmountSchema("insurer price"),
      patientSharePercent: z
        .string()
        .trim()
        .refine(
          (value) =>
            /^\d+$/.test(value) && Number(value) >= 0 && Number(value) <= 100,
          "Enter a whole percentage from 0 to 100"
        ),
    })
  ),
});

/** A price list item together with its insurer prices, edited as one. */
export const priceItemWithPayerPricesFormSchema = priceItemFormSchema.extend(
  payerPriceFormSchema.shape
);

export type PaymentFormValues = z.input<typeof paymentFormSchema>;
export type WaiverFormValues = z.input<typeof waiverFormSchema>;
export type ChargeFormValues = z.input<typeof chargeFormSchema>;
export type PriceItemFormValues = z.input<typeof priceItemFormSchema>;
export type PayerPriceFormValues = z.input<typeof payerPriceFormSchema>;
export type PriceItemWithPayerPricesFormValues = z.input<
  typeof priceItemWithPayerPricesFormSchema
>;
