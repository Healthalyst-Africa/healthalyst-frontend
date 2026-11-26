import { describe, expect, it } from "vitest";
import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  chargeFormSchema,
  paymentFormSchema,
  payerPriceFormSchema,
  waiverFormSchema,
} from "~/features/billing/schemas/billing-form-schemas";
import type { AccountSummary } from "~/features/billing/schemas/billing-response-schemas";
import {
  describeBillingError,
  describeBillTag,
  describePaymentMethod,
  describeWhoPays,
} from "~/features/billing/utilities/bill-presentation";
import {
  toChargeBody,
  toPaymentBody,
} from "~/features/billing/utilities/billing-requests";

function bill(changes: Partial<AccountSummary> = {}): AccountSummary {
  return {
    id: "account-1",
    patientId: "patient-1",
    visitId: "visit-1",
    status: "OPEN",
    paymentMode: "PAY_AT_END",
    payerName: null,
    totals: {
      totalKobo: 1_500_000,
      payerKobo: 0,
      patientKobo: 1_500_000,
      paidKobo: 500_000,
      waivedKobo: 0,
      balanceKobo: 1_000_000,
      creditKobo: 0,
    },
    createdAt: "2026-11-25T09:00:00+01:00",
    closedAt: null,
    version: 1,
    patient: null,
    ...changes,
  };
}

describe("bills", () => {
  it("says what is still owed, paid in full, or closed", () => {
    expect(describeBillTag(bill()).label).toBe("Owes ₦10,000.00");
    expect(describeBillTag(bill()).tone).toBe("warning");
    expect(
      describeBillTag(bill({ totals: { ...bill().totals, balanceKobo: 0 } }))
        .label
    ).toBe("Paid");
    expect(describeBillTag(bill({ status: "CLOSED" })).label).toBe("Closed");
  });

  it("says who pays: the patient alone, or the insurer and the patient", () => {
    expect(describeWhoPays(bill())).toBe("The patient pays it all");
    expect(
      describeWhoPays(
        bill({
          payerName: "Hygeia HMO",
          totals: {
            ...bill().totals,
            payerKobo: 1_200_000,
            patientKobo: 300_000,
          },
        })
      )
    ).toBe("Hygeia HMO pays ₦12,000.00, the patient ₦3,000.00");
  });

  it("names payment methods the way the desk says them", () => {
    expect(describePaymentMethod("POS")).toBe("Card (POS)");
    expect(describePaymentMethod("TRANSFER")).toBe("Bank transfer");
  });

  it("explains refusals the cashier can act on", () => {
    const refusal = new PlatformApiError(
      "Payment exceeds balance",
      "PAYMENT_MORE_THAN_BALANCE",
      null,
      409,
      {},
      null
    );
    expect(describeBillingError(refusal)).toBe(
      "That is more than the patient owes. Take the amount still owed, or less."
    );
    expect(describeBillingError(new Error("Network down"))).toBe(
      "Network down"
    );
  });
});

describe("billing requests", () => {
  it("sends only the fields each kind of charge uses", () => {
    expect(
      toChargeBody({ kind: "price-item", priceItemId: "item-1", quantity: 2 })
    ).toEqual({ priceItemId: "item-1", quantity: 2 });
    expect(
      toChargeBody({
        kind: "one-off",
        description: "  Dressing ",
        unitKobo: 50_000,
        quantity: 1,
      })
    ).toEqual({ description: "Dressing", unitKobo: 50_000, quantity: 1 });
  });

  it("leaves a blank reference out of a payment", () => {
    expect(
      toPaymentBody({
        id: "payment-1",
        method: "CASH",
        amountKobo: 100_000,
        reference: "  ",
      })
    ).toEqual({ id: "payment-1", method: "CASH", amountKobo: 100_000 });
    expect(
      toPaymentBody({
        id: "payment-2",
        method: "POS",
        amountKobo: 100_000,
        reference: " 4471 ",
      }).reference
    ).toBe("4471");
  });
});

describe("billing forms", () => {
  it("accepts naira typed with or without commas, and refuses zero", () => {
    const accepts = (amount: string) =>
      paymentFormSchema.safeParse({ method: "CASH", amount, reference: "" })
        .success;
    expect(accepts("1500")).toBe(true);
    expect(accepts("1,500.50")).toBe(true);
    expect(accepts("0")).toBe(false);
    expect(accepts("15.555")).toBe(false);
    expect(accepts("abc")).toBe(false);
  });

  it("needs a reason for a waiver", () => {
    expect(
      waiverFormSchema.safeParse({ amount: "500", reason: "" }).success
    ).toBe(false);
    expect(
      waiverFormSchema.safeParse({ amount: "500", reason: "Hardship" }).success
    ).toBe(true);
  });

  it("checks each kind of charge for its own fields", () => {
    expect(
      chargeFormSchema.safeParse({
        kind: "price-item",
        priceItemId: "",
        quantity: "1",
      }).success
    ).toBe(false);
    expect(
      chargeFormSchema.safeParse({
        kind: "one-off",
        description: "Dressing",
        amount: "500",
        quantity: "0",
      }).success
    ).toBe(false);
  });

  it("keeps an insurer's patient share between 0 and 100 per cent", () => {
    const share = (patientSharePercent: string) =>
      payerPriceFormSchema.safeParse({
        prices: [{ payerName: "NHIA", price: "5000", patientSharePercent }],
      }).success;
    expect(share("10")).toBe(true);
    expect(share("0")).toBe(true);
    expect(share("101")).toBe(false);
  });
});
