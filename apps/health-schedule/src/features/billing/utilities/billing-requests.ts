import type {
  PaymentMethod,
  PaymentMode,
  PriceCategory,
} from "~/features/billing/schemas/billing-response-schemas";

export type PriceItemRequest = {
  code: string;
  name: string;
  category: PriceCategory;
  priceKobo: number;
  isActive: boolean;
};

export type PayerPriceRequest = {
  payerName: string;
  priceKobo: number;
  patientSharePercent: number;
};

/** A charge from the price list, or a one-off item with its own price. */
export type ChargeRequest =
  | { kind: "price-item"; priceItemId: string; quantity: number }
  | {
      kind: "one-off";
      description: string;
      unitKobo: number;
      quantity: number;
    };

export type PaymentRequest = {
  /** Sent so a retried payment is recorded once. */
  id: string;
  method: PaymentMethod;
  amountKobo: number;
  reference?: string;
};

export type WaiverRequest = { amountKobo: number; reason: string };

export type { PaymentMode };

/** The API body for a charge: only the fields its kind uses. */
export function toChargeBody(request: ChargeRequest) {
  return request.kind === "price-item"
    ? { priceItemId: request.priceItemId, quantity: request.quantity }
    : {
        description: request.description.trim(),
        unitKobo: request.unitKobo,
        quantity: request.quantity,
      };
}

/** A payment's API body, leaving out a blank reference. */
export function toPaymentBody(request: PaymentRequest) {
  const reference = request.reference?.trim();
  return {
    id: request.id,
    method: request.method,
    amountKobo: request.amountKobo,
    ...(reference ? { reference } : {}),
  };
}
