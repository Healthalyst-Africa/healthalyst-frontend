import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import type { StatusPresentation } from "@healthalyst/ui/types/status-tone";
import {
  BILL_TAGS,
  PAYMENT_METHOD_OPTIONS,
  PRICE_CATEGORY_OPTIONS,
} from "~/features/billing/config/billing";
import type {
  AccountSummary,
  PaymentMethod,
  PriceCategory,
} from "~/features/billing/schemas/billing-response-schemas";
import { formatNaira } from "~/shared/money/naira-amount";

/** Plain words for the refusals a cashier or manager can act on. */
const BILLING_ERROR_MESSAGES: Record<string, string> = {
  PAYMENT_MORE_THAN_BALANCE:
    "That is more than the patient owes. Take the amount still owed, or less.",
  WAIVER_MORE_THAN_BALANCE:
    "That is more than the patient owes. Waive the amount still owed, or less.",
  WAIVER_LIMIT_EXCEEDED:
    "That is more than you can waive. Ask a manager with a higher limit.",
  BALANCE_OUTSTANDING:
    "The patient still owes money, so the bill cannot be closed yet.",
  ACCOUNT_CLOSED:
    "This bill is closed. A new charge on the visit opens it again.",
  PAYMENT_ALREADY_REVERSED: "This payment was already reversed.",
  PRICE_CODE_TAKEN: "Another item already uses that code. Choose another.",
  SERVICE_ALREADY_PRICED: "That test or scan already has a price list item.",
  VERSION_CONFLICT:
    "Someone changed this since you opened it. Close it and open it again.",
};

export function describeBillingError(error: Error): string {
  const code = error instanceof PlatformApiError ? error.code : null;
  return (code && BILLING_ERROR_MESSAGES[code]) || error.message;
}

/** Where a bill stands: what is still owed, paid in full, or closed. */
export function describeBillTag(
  account: Pick<AccountSummary, "status" | "totals">
): StatusPresentation {
  if (account.status === "CLOSED") return BILL_TAGS.closed;
  return account.totals.balanceKobo > 0
    ? {
        ...BILL_TAGS.owing,
        label: `Owes ${formatNaira(account.totals.balanceKobo)}`,
      }
    : BILL_TAGS.settled;
}

export function describePaymentMethod(method: PaymentMethod): string {
  return (
    PAYMENT_METHOD_OPTIONS.find((option) => option.value === method)?.label ??
    method
  );
}

export function describePriceCategory(category: PriceCategory): string {
  return (
    PRICE_CATEGORY_OPTIONS.find((option) => option.value === category)?.label ??
    category
  );
}

/**
 * Who pays a bill: the insurer for its part, the patient for the rest. A
 * bill with no insurer is all the patient's.
 */
export function describeWhoPays(
  account: Pick<AccountSummary, "payerName" | "totals">
): string {
  if (!account.payerName || account.totals.payerKobo === 0) {
    return "The patient pays it all";
  }
  return `${account.payerName} pays ${formatNaira(account.totals.payerKobo)}, the patient ${formatNaira(account.totals.patientKobo)}`;
}
