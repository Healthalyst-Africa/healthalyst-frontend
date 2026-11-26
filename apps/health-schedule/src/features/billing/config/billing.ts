import {
  AwaitingPaymentIcon,
  LockedIcon,
  PaidIcon,
  ReversedPaymentIcon,
  SwitchOffIcon,
  SwitchOnIcon,
  VoidedChargeIcon,
} from "@healthalyst/icons";
import type { StatusPresentation } from "@healthalyst/ui/types/status-tone";

/** HealthSchedule API paths for prices, bills and payments. */
export const BILLING_ENDPOINTS = {
  settings: "/v1/settings/billing",
  priceItems: "/v1/price-items",
  priceItem: (priceItemId: string) =>
    `/v1/price-items/${encodeURIComponent(priceItemId)}`,
  payerPrices: (priceItemId: string) =>
    `/v1/price-items/${encodeURIComponent(priceItemId)}/payer-prices`,
  patientAccounts: (patientId: string) =>
    `/v1/patients/${encodeURIComponent(patientId)}/accounts`,
  accounts: "/v1/accounts",
  account: (accountId: string) =>
    `/v1/accounts/${encodeURIComponent(accountId)}`,
  charges: (accountId: string) =>
    `/v1/accounts/${encodeURIComponent(accountId)}/charges`,
  voidCharge: (accountId: string, chargeId: string) =>
    `/v1/accounts/${encodeURIComponent(accountId)}/charges/${encodeURIComponent(chargeId)}/void`,
  payments: (accountId: string) =>
    `/v1/accounts/${encodeURIComponent(accountId)}/payments`,
  reversePayment: (paymentId: string) =>
    `/v1/payments/${encodeURIComponent(paymentId)}/reverse`,
  waivers: (accountId: string) =>
    `/v1/accounts/${encodeURIComponent(accountId)}/waivers`,
  paymentMode: (accountId: string) =>
    `/v1/accounts/${encodeURIComponent(accountId)}/payment-mode`,
  closeAccount: (accountId: string) =>
    `/v1/accounts/${encodeURIComponent(accountId)}/close`,
  cashierSummary: "/v1/billing/cashier-summary",
} as const;

export const BILLING_PERMISSIONS = {
  read: "billing:read",
  /** Add charges, take payments and close settled bills: the cashier. */
  collect: "billing:collect",
  /** Waive, void and reverse, and see other cashiers' takings. */
  waive: "billing:waive",
  /** The price list and when patients pay. */
  manage: "billing:manage",
} as const;

export const PAYMENT_METHOD_OPTIONS = [
  { value: "CASH", label: "Cash" },
  { value: "POS", label: "Card (POS)" },
  { value: "TRANSFER", label: "Bank transfer" },
] as const;

export const PRICE_CATEGORY_OPTIONS = [
  { value: "CONSULTATION", label: "Consultation" },
  { value: "REGISTRATION", label: "Registration" },
  { value: "LAB", label: "Laboratory test" },
  { value: "IMAGING", label: "Scan or X-ray" },
  { value: "PROCEDURE", label: "Procedure" },
  { value: "OTHER", label: "Other" },
] as const;

/** When patients pay, chosen once for the facility. */
export const PAYMENT_MODE_OPTIONS = [
  {
    value: "PAY_AT_END",
    label: "At the end of the visit",
    description:
      "Patients are seen first and pay everything before they leave.",
  },
  {
    value: "PAY_BEFORE",
    label: "Before each service",
    description:
      "Routine tests wait until the patient has paid for them. Urgent and STAT tests never wait.",
  },
] as const;

/** Where a bill stands, as tags. */
export const BILL_TAGS = {
  owing: { label: "Owes", tone: "warning", icon: AwaitingPaymentIcon },
  settled: { label: "Paid", tone: "positive", icon: PaidIcon },
  closed: { label: "Closed", tone: "neutral", icon: LockedIcon },
  voided: { label: "Removed", tone: "neutral", icon: VoidedChargeIcon },
  reversed: { label: "Reversed", tone: "neutral", icon: ReversedPaymentIcon },
  priceOn: { label: "In use", tone: "positive", icon: SwitchOnIcon },
  priceOff: { label: "Switched off", tone: "neutral", icon: SwitchOffIcon },
} as const satisfies Record<string, StatusPresentation>;

export const BILLING_TEXT_LIMITS = {
  reasonMinimum: 3,
  reasonMaximum: 500,
  referenceMaximum: 100,
  descriptionMaximum: 200,
  codeMaximum: 40,
  nameMaximum: 200,
} as const;

/** Bills waiting at the cashier are checked again on their own. */
export const CASHIER_REFRESH_MILLISECONDS = 30_000;
