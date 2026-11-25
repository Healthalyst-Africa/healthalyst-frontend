import { z } from "zod";

const paymentModeSchema = z.enum(["PAY_BEFORE", "PAY_AT_END"]);
const priceCategorySchema = z.enum([
  "CONSULTATION",
  "REGISTRATION",
  "LAB",
  "IMAGING",
  "PROCEDURE",
  "OTHER",
]);
const paymentMethodSchema = z.enum(["CASH", "POS", "TRANSFER"]);

/** When patients pay, for the whole facility (`GET /v1/settings/billing`). */
export const billingSettingsSchema = z.object({
  paymentMode: paymentModeSchema,
  isDefault: z.boolean(),
  version: z.number().int(),
});

/** What an insurer pays for an item, and the patient's share of it. */
const payerPriceSchema = z.object({
  payerName: z.string(),
  priceKobo: z.number().int(),
  patientSharePercent: z.number().int(),
});

export const priceItemSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  category: priceCategorySchema,
  serviceId: z.string().nullish(),
  priceKobo: z.number().int(),
  isActive: z.boolean(),
  payerPrices: z.array(payerPriceSchema),
  version: z.number().int(),
});

export const priceItemListSchema = z.object({ data: z.array(priceItemSchema) });

const accountTotalsSchema = z.object({
  totalKobo: z.number().int(),
  payerKobo: z.number().int(),
  patientKobo: z.number().int(),
  paidKobo: z.number().int(),
  waivedKobo: z.number().int(),
  balanceKobo: z.number().int(),
  creditKobo: z.number().int(),
});

const accountFieldsSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  visitId: z.string().nullish(),
  status: z.enum(["OPEN", "CLOSED"]),
  paymentMode: paymentModeSchema,
  payerName: z.string().nullable(),
  totals: accountTotalsSchema,
  createdAt: z.string(),
  closedAt: z.string().nullish(),
  version: z.number().int(),
});

/** A bill in a list: one per visit, with the patient it is for. */
export const accountSummarySchema = accountFieldsSchema.extend({
  patient: z
    .object({
      id: z.string(),
      patientNumber: z.string(),
      firstName: z.string(),
      lastName: z.string(),
    })
    .nullish(),
});

export const accountListSchema = z.object({
  data: z.array(accountSummarySchema),
});

/** One bill with its charges, payments and waivers (`GET /v1/accounts/{id}`). */
export const accountSchema = accountFieldsSchema.extend({
  charges: z.array(
    z.object({
      id: z.string(),
      description: z.string(),
      category: priceCategorySchema,
      quantity: z.number().int(),
      unitKobo: z.number().int(),
      totalKobo: z.number().int(),
      payerKobo: z.number().int(),
      patientKobo: z.number().int(),
      payerName: z.string().nullable(),
      orderId: z.string().nullish(),
      status: z.enum(["ACTIVE", "VOIDED"]),
      voidReason: z.string().nullable(),
      paidKobo: z.number().int(),
      createdAt: z.string(),
    })
  ),
  payments: z.array(
    z.object({
      id: z.string(),
      receiptNumber: z.string(),
      method: paymentMethodSchema,
      amountKobo: z.number().int(),
      reference: z.string().nullable(),
      receivedById: z.string().nullish(),
      receivedAt: z.string(),
      status: z.enum(["RECORDED", "REVERSED"]),
      reverseReason: z.string().nullable(),
    })
  ),
  waivers: z.array(
    z.object({
      id: z.string(),
      amountKobo: z.number().int(),
      reason: z.string(),
      approvedById: z.string().nullish(),
      createdAt: z.string(),
    })
  ),
});

/** A cashier's takings on a day, by payment method. */
export const cashierSummarySchema = z.object({
  date: z.string(),
  userId: z.string(),
  byMethod: z.array(
    z.object({
      method: paymentMethodSchema,
      count: z.number().int(),
      amountKobo: z.number().int(),
    })
  ),
  totalKobo: z.number().int(),
  reversed: z.object({
    count: z.number().int(),
    amountKobo: z.number().int(),
  }),
});

export type BillingSettings = z.infer<typeof billingSettingsSchema>;
export type PaymentMode = z.infer<typeof paymentModeSchema>;
export type PriceItem = z.infer<typeof priceItemSchema>;
export type PriceCategory = z.infer<typeof priceCategorySchema>;
export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type AccountSummary = z.infer<typeof accountSummarySchema>;
export type Account = z.infer<typeof accountSchema>;
export type AccountCharge = Account["charges"][number];
export type AccountPayment = Account["payments"][number];
export type CashierSummary = z.infer<typeof cashierSummarySchema>;
