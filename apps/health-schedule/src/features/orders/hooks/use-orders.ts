"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { RESULTS_INBOX_REFRESH_MILLISECONDS } from "~/features/orders/config/orders";
import type { OrderableService } from "~/features/orders/schemas/order-response-schemas";
import {
  addStarterCatalogue,
  listCatalogue,
  setCatalogueItemActive,
} from "~/features/orders/services/catalogue-service";
import { ORDER_QUERY_KEYS } from "~/features/orders/services/order-query-keys";
import {
  acknowledgeResult,
  cancelOrder,
  createOrders,
  listPatientOrders,
  listResultRevisions,
  listResultsInbox,
  type CreateOrdersRequest,
} from "~/features/orders/services/order-service";
import { useOrganizationIdentifier } from "~/features/patients/hooks/use-patients";

/**
 * Refreshes orders everywhere: the catalogue, the inbox and every patient's
 * list, since a result reviewed in the inbox also shows on the record.
 */
function useOrderInvalidation() {
  const queryClient = useQueryClient();
  const organizationIdentifier = useOrganizationIdentifier();
  const patientOrdersKeyLength = ORDER_QUERY_KEYS.patientOrders(
    organizationIdentifier,
    ""
  ).length;
  return () =>
    queryClient.invalidateQueries({
      predicate: (query) => {
        const queryKey = query.queryKey;
        if (
          queryKey[0] !== "health-schedule" ||
          queryKey[1] !== organizationIdentifier
        ) {
          return false;
        }
        return (
          queryKey[2] === "orders" ||
          (queryKey.length === patientOrdersKeyLength &&
            queryKey[2] === "clinical" &&
            queryKey[4] === "orders")
        );
      },
    });
}

export function useOrderCatalogue(includeInactive: boolean, isEnabled = true) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.catalogue(
      organizationIdentifier,
      includeInactive
    ),
    queryFn: () => listCatalogue(includeInactive),
    enabled: isEnabled,
    staleTime: 5 * 60_000,
  });
}

export function useCatalogueActions() {
  const invalidateOrders = useOrderInvalidation();
  return {
    addStarter: useMutation({
      mutationFn: addStarterCatalogue,
      onSettled: invalidateOrders,
    }),
    setActive: useMutation({
      mutationFn: ({
        service,
        isActive,
      }: {
        service: OrderableService;
        isActive: boolean;
      }) => setCatalogueItemActive(service, isActive),
      onSettled: invalidateOrders,
    }),
  };
}

export function usePatientOrders(patientId: string, isEnabled = true) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.patientOrders(organizationIdentifier, patientId),
    queryFn: () => listPatientOrders(patientId),
    enabled: isEnabled && patientId !== "",
  });
}

export function useResultRevisions(orderId: string, isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.revisions(organizationIdentifier, orderId),
    queryFn: () => listResultRevisions(orderId),
    enabled: isEnabled,
  });
}

/** The signed-in doctor's results to review, checked again while open. */
export function useResultsInbox(isEnabled: boolean) {
  const organizationIdentifier = useOrganizationIdentifier();
  return useQuery({
    queryKey: ORDER_QUERY_KEYS.resultsInbox(organizationIdentifier),
    queryFn: listResultsInbox,
    enabled: isEnabled,
    refetchInterval: RESULTS_INBOX_REFRESH_MILLISECONDS,
  });
}

export function useOrderActions() {
  const invalidateOrders = useOrderInvalidation();
  return {
    create: useMutation({
      mutationFn: ({
        patientId: orderPatientId,
        request,
      }: {
        patientId: string;
        request: CreateOrdersRequest;
      }) => createOrders(orderPatientId, request),
      onSettled: invalidateOrders,
    }),
    cancel: useMutation({
      mutationFn: ({ orderId, reason }: { orderId: string; reason: string }) =>
        cancelOrder(orderId, reason),
      onSettled: invalidateOrders,
    }),
    acknowledge: useMutation({
      mutationFn: acknowledgeResult,
      onSettled: invalidateOrders,
    }),
  };
}
