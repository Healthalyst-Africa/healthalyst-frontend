import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { ORDER_ENDPOINTS } from "~/features/orders/config/orders";
import {
  orderListSchema,
  orderSchema,
  resultRevisionsSchema,
  resultsInboxSchema,
  type Order,
  type OrderPriority,
  type ResultRevision,
  type ResultsInboxItem,
} from "~/features/orders/schemas/order-response-schemas";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";
import { parseHealthScheduleResponse } from "~/shared/api/parse-health-schedule-response";

export type CreateOrdersRequest = {
  /** Chosen in the browser for the group, so a retry never orders twice. */
  id: string;
  visitId?: string;
  priority: OrderPriority;
  indication?: string;
  items: { serviceId: string }[];
};

/**
 * Orders tests and scans together, one order per item. Requires
 * `order:create`.
 */
export async function createOrders(
  patientId: string,
  request: CreateOrdersRequest
): Promise<Order[]> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      ORDER_ENDPOINTS.patientOrders(patientId),
      request
    );
    return parseHealthScheduleResponse(
      orderListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "The orders were not sent.", {
      items: "serviceIds",
      priority: "priority",
      indication: "indication",
    });
  }
}

/**
 * A patient's orders and results, newest first. Part of the clinical
 * record: requires `note:read`.
 */
export async function listPatientOrders(patientId: string): Promise<Order[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      ORDER_ENDPOINTS.patientOrders(patientId)
    );
    return parseHealthScheduleResponse(
      orderListSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the tests and results.");
  }
}

/** Earlier versions of an amended result. */
export async function listResultRevisions(
  orderId: string
): Promise<ResultRevision[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      ORDER_ENDPOINTS.orderRevisions(orderId)
    );
    return parseHealthScheduleResponse(
      resultRevisionsSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load the earlier results.");
  }
}

/** Only before work has started on it. Requires `order:create`. */
export async function cancelOrder(
  orderId: string,
  reason: string
): Promise<Order> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      ORDER_ENDPOINTS.cancelOrder(orderId),
      { reason }
    );
    return parseHealthScheduleResponse(
      orderSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "The order was not cancelled.", {
      reason: "reason",
    });
  }
}

/** Marks a released result as seen, taking it out of the inbox. */
export async function acknowledgeResult(orderId: string): Promise<Order> {
  try {
    const response = await getHealthScheduleHttpClient().post<unknown>(
      ORDER_ENDPOINTS.acknowledgeOrder(orderId),
      {}
    );
    return parseHealthScheduleResponse(
      orderSchema,
      response.data,
      response.status
    );
  } catch (error) {
    throw toPlatformApiError(error, "The result was not marked as seen.");
  }
}

/**
 * Released results of the signed-in person's orders not yet marked as
 * seen, critical first. Amended results come back until seen again.
 * Requires `order:create`.
 */
export async function listResultsInbox(): Promise<ResultsInboxItem[]> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      ORDER_ENDPOINTS.resultsInbox
    );
    return parseHealthScheduleResponse(
      resultsInboxSchema,
      response.data,
      response.status
    ).data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load your results.");
  }
}
