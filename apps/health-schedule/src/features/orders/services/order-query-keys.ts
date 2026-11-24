/**
 * Query keys for orders and results. A patient's orders sit under their
 * clinical record's prefix, so opening a restricted record refreshes them
 * with the notes and problems.
 */
export const ORDER_QUERY_KEYS = {
  all: (organizationId: string) =>
    ["health-schedule", organizationId, "orders"] as const,
  catalogue: (organizationId: string, includeInactive: boolean) =>
    [
      "health-schedule",
      organizationId,
      "orders",
      "catalogue",
      includeInactive ? "all" : "active",
    ] as const,
  patientOrders: (organizationId: string, patientId: string) =>
    [
      "health-schedule",
      organizationId,
      "clinical",
      patientId,
      "orders",
    ] as const,
  revisions: (organizationId: string, orderId: string) =>
    [
      "health-schedule",
      organizationId,
      "orders",
      "revisions",
      orderId,
    ] as const,
  resultsInbox: (organizationId: string) =>
    ["health-schedule", organizationId, "orders", "inbox"] as const,
};
