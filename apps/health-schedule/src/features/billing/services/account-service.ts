import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { BILLING_ENDPOINTS } from "~/features/billing/config/billing";
import {
  accountListSchema,
  accountSchema,
  cashierSummarySchema,
  type Account,
  type AccountSummary,
  type CashierSummary,
  type PaymentMode,
} from "~/features/billing/schemas/billing-response-schemas";
import {
  toChargeBody,
  toPaymentBody,
  type ChargeRequest,
  type PaymentRequest,
  type WaiverRequest,
} from "~/features/billing/utilities/billing-requests";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

export const ACCOUNT_QUERY_KEYS = {
  all: (organizationId: string) =>
    ["health-schedule", organizationId, "bills"] as const,
  owing: (organizationId: string) =>
    ["health-schedule", organizationId, "bills", "owing"] as const,
  account: (organizationId: string, accountId: string) =>
    ["health-schedule", organizationId, "bills", "account", accountId] as const,
  patient: (organizationId: string, patientId: string) =>
    ["health-schedule", organizationId, "bills", "patient", patientId] as const,
  cashierSummary: (organizationId: string) =>
    ["health-schedule", organizationId, "bills", "cashier-summary"] as const,
};

function parseAccount(data: unknown, status: number): Account {
  return parseHealthScheduleResponse(accountSchema, data, status);
}

/** Open bills with something left to pay: the cashier's list. */
export async function listOwingAccounts(): Promise<AccountSummary[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      BILLING_ENDPOINTS.accounts,
      { params: { status: "OPEN", owing: true } }
    );
    return parseHealthScheduleResponse(
      accountListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the bills to pay.");
  }
}

/** A patient's bills, one per visit. Requires `billing:read`. */
export async function listPatientAccounts(
  patientId: string
): Promise<AccountSummary[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      BILLING_ENDPOINTS.patientAccounts(patientId)
    );
    return parseHealthScheduleResponse(
      accountListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the patient's bills.");
  }
}

export async function getAccount(accountId: string): Promise<Account> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      BILLING_ENDPOINTS.account(accountId)
    );
    return parseAccount(response.data, response.status);
  } catch (error) {
    throw toPlatformApiError(error, "We could not open the bill.");
  }
}

/** The signed-in cashier's payments today, by method. */
export async function getCashierSummary(): Promise<CashierSummary> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      BILLING_ENDPOINTS.cashierSummary
    );
    return parseHealthScheduleResponse(
      cashierSummarySchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not load today's takings.");
  }
}

/** Adds a charge to a bill. Requires `billing:collect`. */
export async function addCharge({
  accountId,
  request,
}: {
  accountId: string;
  request: ChargeRequest;
}): Promise<Account> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      BILLING_ENDPOINTS.charges(accountId),
      toChargeBody(request)
    );
    return parseAccount(response.data, response.status);
  } catch (error) {
    throw toPlatformApiError(error, "We could not add the charge.", {
      description: "description",
      unitKobo: "amount",
      quantity: "quantity",
      priceItemId: "priceItem",
    });
  }
}

/** Removes a charge made by mistake, with a reason. Requires `billing:waive`. */
export async function voidCharge({
  accountId,
  chargeId,
  reason,
}: {
  accountId: string;
  chargeId: string;
  reason: string;
}): Promise<Account> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      BILLING_ENDPOINTS.voidCharge(accountId, chargeId),
      { reason }
    );
    return parseAccount(response.data, response.status);
  } catch (error) {
    throw toPlatformApiError(error, "We could not remove the charge.", {
      reason: "reason",
    });
  }
}

/**
 * Takes a payment and issues a receipt. A retry with the same identifier
 * is recorded once. Requires `billing:collect`.
 */
export async function takePayment({
  accountId,
  request,
}: {
  accountId: string;
  request: PaymentRequest;
}): Promise<Account> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      BILLING_ENDPOINTS.payments(accountId),
      toPaymentBody(request)
    );
    return parseAccount(response.data, response.status);
  } catch (error) {
    throw toPlatformApiError(error, "We could not record the payment.", {
      method: "method",
      amountKobo: "amount",
      reference: "reference",
    });
  }
}

/** Reverses a payment taken by mistake, with a reason. */
export async function reversePayment({
  paymentId,
  reason,
}: {
  paymentId: string;
  reason: string;
}): Promise<Account> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      BILLING_ENDPOINTS.reversePayment(paymentId),
      { reason }
    );
    return parseAccount(response.data, response.status);
  } catch (error) {
    throw toPlatformApiError(error, "We could not reverse the payment.", {
      reason: "reason",
    });
  }
}

/** Waives part of a bill, within the person's approval limit. */
export async function waiveAmount({
  accountId,
  request,
}: {
  accountId: string;
  request: WaiverRequest;
}): Promise<Account> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      BILLING_ENDPOINTS.waivers(accountId),
      { amountKobo: request.amountKobo, reason: request.reason.trim() }
    );
    return parseAccount(response.data, response.status);
  } catch (error) {
    throw toPlatformApiError(error, "We could not waive the amount.", {
      amountKobo: "amount",
      reason: "reason",
    });
  }
}

/** Lets this bill be paid at the end, or before each service. */
export async function changeAccountPaymentMode({
  accountId,
  paymentMode,
}: {
  accountId: string;
  paymentMode: PaymentMode;
}): Promise<Account> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      BILLING_ENDPOINTS.paymentMode(accountId),
      { paymentMode }
    );
    return parseAccount(response.data, response.status);
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not change when this bill is paid."
    );
  }
}

/** Closes a bill with nothing left to pay. */
export async function closeAccount(accountId: string): Promise<Account> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      BILLING_ENDPOINTS.closeAccount(accountId),
      {}
    );
    return parseAccount(response.data, response.status);
  } catch (error) {
    throw toPlatformApiError(error, "We could not close the bill.");
  }
}
