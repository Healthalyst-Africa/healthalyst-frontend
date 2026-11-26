import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { BILLING_ENDPOINTS } from "~/features/billing/config/billing";
import {
  billingSettingsSchema,
  priceItemListSchema,
  priceItemSchema,
  type BillingSettings,
  type PaymentMode,
  type PriceItem,
} from "~/features/billing/schemas/billing-response-schemas";
import type {
  PayerPriceRequest,
  PriceItemRequest,
} from "~/features/billing/utilities/billing-requests";
import { toEntityTag } from "~/features/patients/utilities/patient-presentation";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

export const PRICE_LIST_QUERY_KEYS = {
  all: (organizationId: string) =>
    ["health-schedule", organizationId, "price-list"] as const,
  items: (organizationId: string) =>
    ["health-schedule", organizationId, "price-list", "items"] as const,
  settings: (organizationId: string) =>
    ["health-schedule", organizationId, "price-list", "settings"] as const,
};

const PRICE_ITEM_FIELD_NAMES = {
  code: "code",
  name: "name",
  category: "category",
  priceKobo: "price",
};

/** When patients pay, for the whole facility. Requires `billing:read`. */
export async function getBillingSettings(): Promise<BillingSettings> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      BILLING_ENDPOINTS.settings
    );
    return parseHealthScheduleResponse(
      billingSettingsSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the billing settings.");
  }
}

/**
 * Chooses whether patients pay before each service or at the end. Refused
 * with `VERSION_CONFLICT` when someone changed it since it was opened.
 * Requires `billing:manage`.
 */
export async function savePaymentMode({
  paymentMode,
  version,
}: {
  paymentMode: PaymentMode;
  version: number;
}): Promise<BillingSettings> {
  try {
    const response = await getHealthScheduleHttpClient().put<unknown>(
      BILLING_ENDPOINTS.settings,
      { paymentMode },
      { headers: { "If-Match": toEntityTag(version) } }
    );
    return parseHealthScheduleResponse(
      billingSettingsSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not save when patients pay.");
  }
}

/** Every price list item, including switched-off ones. */
export async function listPriceItems(): Promise<PriceItem[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      BILLING_ENDPOINTS.priceItems,
      { params: { includeInactive: true } }
    );
    return parseHealthScheduleResponse(
      priceItemListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the price list.");
  }
}

/** Adds a price list item. Requires `billing:manage`. */
export async function createPriceItem(
  request: PriceItemRequest
): Promise<PriceItem> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      BILLING_ENDPOINTS.priceItems,
      request
    );
    return parseHealthScheduleResponse(
      priceItemSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not add the item.",
      PRICE_ITEM_FIELD_NAMES
    );
  }
}

/** Changes a price list item. Charges already made keep their price. */
export async function updatePriceItem({
  priceItemId,
  version,
  request,
}: {
  priceItemId: string;
  version: number;
  request: PriceItemRequest;
}): Promise<PriceItem> {
  try {
    const response = await getHealthScheduleHttpClient().put<unknown>(
      BILLING_ENDPOINTS.priceItem(priceItemId),
      request,
      { headers: { "If-Match": toEntityTag(version) } }
    );
    return parseHealthScheduleResponse(
      priceItemSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not save the item.",
      PRICE_ITEM_FIELD_NAMES
    );
  }
}

/** Replaces what each insurer pays for an item, and the patient's share. */
export async function savePayerPrices({
  priceItemId,
  prices,
}: {
  priceItemId: string;
  prices: readonly PayerPriceRequest[];
}): Promise<PriceItem> {
  try {
    const response = await getHealthScheduleHttpClient().put<unknown>(
      BILLING_ENDPOINTS.payerPrices(priceItemId),
      { prices }
    );
    return parseHealthScheduleResponse(
      priceItemSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not save the insurer prices.");
  }
}
