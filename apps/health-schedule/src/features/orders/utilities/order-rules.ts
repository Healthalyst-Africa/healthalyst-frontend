import type { StatusPresentation } from "@healthalyst/ui/types/status-tone";
import {
  ORDER_LIMITS,
  ORDER_TAGS,
  RECENT_RESULT_DAYS,
} from "~/features/orders/config/orders";
import type {
  Order,
  OrderableService,
  ResultValue,
} from "~/features/orders/schemas/order-response-schemas";
import type { OrderFormValues } from "~/features/orders/schemas/order-form-schemas";
import type { CreateOrdersRequest } from "~/features/orders/services/order-service";

const HOURS_PER_DAY = 24;
const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;

/** "Results in about 2 hours" or "about 2 days"; null when not set. */
export function describeTurnaround(hours: number | null): string | null {
  if (hours === null) return null;
  if (hours < 2 * HOURS_PER_DAY) {
    return `Results in about ${hours} ${hours === 1 ? "hour" : "hours"}`;
  }
  const days = Math.round(hours / HOURS_PER_DAY);
  return `Results in about ${days} days`;
}

/** Where an order is, in words that fit a test or a scan. */
export function describeOrderStatus(
  order: Pick<Order, "status" | "kind" | "rejectedReason">
): StatusPresentation {
  switch (order.status) {
    case "ORDERED":
      return order.rejectedReason
        ? ORDER_TAGS.retakeSample
        : ORDER_TAGS.ordered;
    case "COLLECTED":
      return order.kind === "IMAGING"
        ? ORDER_TAGS.patientArrived
        : ORDER_TAGS.sampleTaken;
    case "IN_PROGRESS":
      return ORDER_TAGS.inProgress;
    case "RESULTED":
      return ORDER_TAGS.checkingResult;
    case "RELEASED":
      return ORDER_TAGS.resultReady;
    case "CANCELLED":
      return ORDER_TAGS.cancelled;
  }
}

/** Orders still with the department: they can still change. */
export function isOrderOpen(order: Pick<Order, "status">): boolean {
  return (
    order.status === "ORDERED" ||
    order.status === "COLLECTED" ||
    order.status === "IN_PROGRESS" ||
    order.status === "RESULTED"
  );
}

/** Cancelling is possible until work on it has started. */
export function canCancelOrder(order: Pick<Order, "status">): boolean {
  return order.status === "ORDERED" || order.status === "COLLECTED";
}

/**
 * Tests and scans matching what was typed: the start of the code or any
 * part of the name, as the API's own search does. Chosen ones are left out.
 */
export function searchCatalogue(
  catalogue: readonly OrderableService[],
  searchText: string,
  chosenServiceIds: readonly string[]
): OrderableService[] {
  const query = searchText.trim().toLowerCase();
  if (query === "") return [];
  return catalogue
    .filter(
      (service) =>
        service.isActive &&
        !chosenServiceIds.includes(service.id) &&
        (service.code.toLowerCase().startsWith(query) ||
          service.name.toLowerCase().includes(query))
    )
    .slice(0, ORDER_LIMITS.searchResults);
}

export type CatalogueFilters = {
  searchText: string;
  /** "LAB", "IMAGING", or empty for both. */
  kind: string;
  /** "on", "off", or empty for both. */
  availability: string;
};

/**
 * The catalogue narrowed for the setup page: the start of the code or any
 * part of the name, the kind, and whether it can be ordered.
 */
export function filterCatalogue(
  catalogue: readonly OrderableService[],
  filters: CatalogueFilters
): OrderableService[] {
  const query = filters.searchText.trim().toLowerCase();
  return catalogue.filter(
    (service) =>
      (query === "" ||
        service.code.toLowerCase().startsWith(query) ||
        service.name.toLowerCase().includes(query)) &&
      (filters.kind === "" || service.kind === filters.kind) &&
      (filters.availability === "" ||
        (filters.availability === "on") === service.isActive)
  );
}

/** The everyday tests the catalogue has, in the order given. */
export function findCommonServices(
  catalogue: readonly OrderableService[],
  codes: readonly string[]
): OrderableService[] {
  return codes.flatMap((code) => {
    const service = catalogue.find(
      (candidate) => candidate.isActive && candidate.code === code
    );
    return service ? [service] : [];
  });
}

/**
 * The newest released result of each test from the last
 * `RECENT_RESULT_DAYS` days, so a repeat can be avoided.
 */
export function findRecentResults(
  orders: readonly Order[],
  now: Date
): Map<string, Order> {
  const earliest = now.getTime() - RECENT_RESULT_DAYS * MILLISECONDS_PER_DAY;
  const recentResults = new Map<string, Order>();
  for (const order of orders) {
    const releasedAt = order.result?.releasedAt;
    if (order.status !== "RELEASED" || !releasedAt) continue;
    const releasedTime = new Date(releasedAt).getTime();
    if (releasedTime < earliest) continue;
    const newest = recentResults.get(order.serviceId);
    const newestTime = newest?.result?.releasedAt
      ? new Date(newest.result.releasedAt).getTime()
      : 0;
    if (releasedTime > newestTime) recentResults.set(order.serviceId, order);
  }
  return recentResults;
}

/** Tests already ordered and not finished, so they are not ordered twice. */
export function findOpenOrders(orders: readonly Order[]): Map<string, Order> {
  const openOrders = new Map<string, Order>();
  for (const order of orders) {
    if (isOrderOpen(order) && !openOrders.has(order.serviceId)) {
      openOrders.set(order.serviceId, order);
    }
  }
  return openOrders;
}

/** "11.2 g/dL", or "No value" when the department left it empty. */
export function describeResultValue(value: ResultValue): string {
  if (value.value === null || value.value === "") return "No value";
  return value.unit ? `${value.value} ${value.unit}` : value.value;
}

/**
 * How a result reads at a glance. Without reference ranges nothing can be
 * flagged, so a result without flags is never called normal.
 */
export function describeResultFlags(
  order: Pick<Order, "critical" | "result">
): StatusPresentation {
  if (order.critical) return ORDER_TAGS.critical;
  const isFlagged =
    order.result?.values.some((value) => value.flag !== null) ?? false;
  return isFlagged ? ORDER_TAGS.outsideRange : ORDER_TAGS.nothingFlagged;
}

/**
 * One status for a list: where the order is, or once released, whether the
 * result needs attention.
 */
export function describeOrderProgress(
  order: Pick<
    Order,
    "status" | "kind" | "rejectedReason" | "critical" | "result"
  >
): StatusPresentation {
  if (order.status !== "RELEASED") return describeOrderStatus(order);
  const flags = describeResultFlags(order);
  if (order.critical) return ORDER_TAGS.criticalResult;
  return flags === ORDER_TAGS.outsideRange
    ? ORDER_TAGS.resultOutsideRange
    : ORDER_TAGS.resultReady;
}

/** Patients with results waiting for the doctor, to mark in their queue. */
export function readPatientsWithResults(
  inbox: readonly Pick<Order, "patientId">[]
): Set<string> {
  return new Set(inbox.map((item) => item.patientId));
}

/** Leaves out an empty clinical question so the API applies its default. */
export function toCreateOrdersRequest({
  values,
  groupId,
  visitId,
}: {
  values: OrderFormValues;
  groupId: string;
  visitId?: string;
}): CreateOrdersRequest {
  const indication = values.indication.trim();
  return {
    id: groupId,
    ...(visitId ? { visitId } : {}),
    priority: values.priority,
    ...(indication ? { indication } : {}),
    items: values.serviceIds.map((serviceId) => ({ serviceId })),
  };
}
