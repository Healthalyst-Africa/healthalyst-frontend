import type { Partnership } from "~/features/partner-network/types/partner-network";

export type AvailablePartnershipAction =
  | "accept"
  | "resume"
  | "decline"
  | "suspend"
  | "terminate"
  | "cancel-request"
  | "set-preference";

/**
 * What this organisation can do with a partnership, following the Platform
 * API's rules: only the partner that provides the service accepts, resumes or
 * declines; either side pauses or ends it; only the requester sets its
 * preference.
 */
export function getAvailablePartnershipActions(
  partnership: Pick<Partnership, "direction" | "status">
): AvailablePartnershipAction[] {
  const isProvider = partnership.direction === "INCOMING";
  switch (partnership.status) {
    case "PENDING":
      return isProvider
        ? ["accept", "decline"]
        : ["set-preference", "cancel-request"];
    case "ACTIVE":
      return isProvider
        ? ["suspend", "terminate"]
        : ["set-preference", "suspend", "terminate"];
    case "SUSPENDED":
      return isProvider
        ? ["resume", "terminate"]
        : ["set-preference", "terminate"];
    case "TERMINATED":
    case "DECLINED":
      return [];
  }
}

/** Requests waiting for this organisation's answer. */
export function isAwaitingOurReply(
  partnership: Pick<Partnership, "direction" | "status">
): boolean {
  return (
    partnership.direction === "INCOMING" && partnership.status === "PENDING"
  );
}

/** Preferred first, then lower priority numbers, as the API routes orders. */
export function sortPartnerships<
  PartnershipType extends Pick<
    Partnership,
    "isPreferred" | "priority" | "partner" | "status"
  >,
>(partnerships: readonly PartnershipType[]): PartnershipType[] {
  const statusOrder = [
    "ACTIVE",
    "PENDING",
    "SUSPENDED",
    "DECLINED",
    "TERMINATED",
  ];
  return [...partnerships].sort(
    (first, second) =>
      statusOrder.indexOf(first.status) - statusOrder.indexOf(second.status) ||
      Number(second.isPreferred) - Number(first.isPreferred) ||
      first.priority - second.priority ||
      first.partner.name.localeCompare(second.partner.name)
  );
}
