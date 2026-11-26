"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CASHIER_REFRESH_MILLISECONDS } from "~/features/billing/config/billing";
import {
  ACCOUNT_QUERY_KEYS,
  addCharge,
  changeAccountPaymentMode,
  closeAccount,
  getAccount,
  getCashierSummary,
  listOwingAccounts,
  listPatientAccounts,
  reversePayment,
  takePayment,
  voidCharge,
  waiveAmount,
} from "~/features/billing/services/account-service";
import {
  createPriceItem,
  getBillingSettings,
  listPriceItems,
  PRICE_LIST_QUERY_KEYS,
  savePayerPrices,
  savePaymentMode,
  updatePriceItem,
} from "~/features/billing/services/price-list-service";
import type {
  Account,
  PaymentMode,
} from "~/features/billing/schemas/billing-response-schemas";
import type {
  ChargeRequest,
  PayerPriceRequest,
  PaymentRequest,
  PriceItemRequest,
  WaiverRequest,
} from "~/features/billing/utilities/billing-requests";
import { ORDER_QUERY_KEYS } from "~/features/orders/services/order-query-keys";
import { useWorkspace } from "~/shared/workspace/workspace-context";

function useOrganizationIdentifier() {
  return useWorkspace().platformSession.activeContext.organizationId ?? "";
}

export function useBillingSettings(isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: PRICE_LIST_QUERY_KEYS.settings(organizationIdentifier),
    queryFn: getBillingSettings,
    enabled: isEnabled,
  });
}

export function usePriceItems(isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: PRICE_LIST_QUERY_KEYS.items(organizationIdentifier),
    queryFn: listPriceItems,
    enabled: isEnabled,
  });
}

export function useOwingAccounts(isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: ACCOUNT_QUERY_KEYS.owing(organizationIdentifier),
    queryFn: listOwingAccounts,
    enabled: isEnabled,
    refetchInterval: CASHIER_REFRESH_MILLISECONDS,
    refetchOnWindowFocus: true,
  });
}

export function usePatientAccounts(patientId: string, isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: ACCOUNT_QUERY_KEYS.patient(organizationIdentifier, patientId),
    queryFn: () => listPatientAccounts(patientId),
    enabled: isEnabled,
  });
}

export function useAccount(accountId: string | null) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: ACCOUNT_QUERY_KEYS.account(
      organizationIdentifier,
      accountId ?? ""
    ),
    queryFn: () => getAccount(accountId ?? ""),
    enabled: accountId !== null,
  });
}

export function useCashierSummary(isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: ACCOUNT_QUERY_KEYS.cashierSummary(organizationIdentifier),
    queryFn: getCashierSummary,
    enabled: isEnabled,
    refetchInterval: CASHIER_REFRESH_MILLISECONDS,
  });
}

/**
 * Every change to a bill returns the whole bill: it is stored at once, and
 * the lists, takings and orders that show payment are checked again.
 */
function useAccountChange() {
  const queryClient = useQueryClient();
  const organizationIdentifier = useOrganizationIdentifier();
  return {
    onSuccess: (account: Account) => {
      queryClient.setQueryData(
        ACCOUNT_QUERY_KEYS.account(organizationIdentifier, account.id),
        account
      );
    },
    onSettled: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: ACCOUNT_QUERY_KEYS.all(organizationIdentifier),
        }),
        queryClient.invalidateQueries({
          queryKey: ORDER_QUERY_KEYS.all(organizationIdentifier),
        }),
      ]),
  };
}

export function useAddCharge() {
  return useMutation({
    mutationFn: (request: { accountId: string; request: ChargeRequest }) =>
      addCharge(request),
    ...useAccountChange(),
  });
}

export function useVoidCharge() {
  return useMutation({
    mutationFn: (request: {
      accountId: string;
      chargeId: string;
      reason: string;
    }) => voidCharge(request),
    ...useAccountChange(),
  });
}

export function useTakePayment() {
  return useMutation({
    mutationFn: (request: { accountId: string; request: PaymentRequest }) =>
      takePayment(request),
    ...useAccountChange(),
  });
}

export function useReversePayment() {
  return useMutation({
    mutationFn: (request: { paymentId: string; reason: string }) =>
      reversePayment(request),
    ...useAccountChange(),
  });
}

export function useWaiveAmount() {
  return useMutation({
    mutationFn: (request: { accountId: string; request: WaiverRequest }) =>
      waiveAmount(request),
    ...useAccountChange(),
  });
}

export function useChangeAccountPaymentMode() {
  return useMutation({
    mutationFn: (request: { accountId: string; paymentMode: PaymentMode }) =>
      changeAccountPaymentMode(request),
    ...useAccountChange(),
  });
}

export function useCloseAccount() {
  return useMutation({
    mutationFn: (accountId: string) => closeAccount(accountId),
    ...useAccountChange(),
  });
}

function usePriceListInvalidation() {
  const queryClient = useQueryClient();
  const organizationIdentifier = useOrganizationIdentifier();
  return () =>
    queryClient.invalidateQueries({
      queryKey: PRICE_LIST_QUERY_KEYS.all(organizationIdentifier),
    });
}

export function useSavePaymentMode() {
  const invalidatePriceList = usePriceListInvalidation();
  return useMutation({
    mutationFn: (request: { paymentMode: PaymentMode; version: number }) =>
      savePaymentMode(request),
    onSettled: invalidatePriceList,
  });
}

export function useSavePriceItem() {
  const invalidatePriceList = usePriceListInvalidation();
  return useMutation({
    mutationFn: ({
      priceItemId,
      version,
      request,
    }: {
      priceItemId: string | null;
      version: number;
      request: PriceItemRequest;
    }) =>
      priceItemId
        ? updatePriceItem({ priceItemId, version, request })
        : createPriceItem(request),
    onSuccess: invalidatePriceList,
  });
}

export function useSavePayerPrices() {
  const invalidatePriceList = usePriceListInvalidation();
  return useMutation({
    mutationFn: (request: {
      priceItemId: string;
      prices: readonly PayerPriceRequest[];
    }) => savePayerPrices(request),
    onSuccess: invalidatePriceList,
  });
}
