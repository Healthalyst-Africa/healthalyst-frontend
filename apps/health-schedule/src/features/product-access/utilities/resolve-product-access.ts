import type { PlatformSession } from "@healthalyst/platform-api/authentication-service";
import {
  APPLICATION_IN_PROGRESS_STATUSES,
  APPLICATION_IN_REVIEW_STATUSES,
  APPROVED_ORGANIZATION_STATUS,
  HEALTH_SCHEDULE_PRODUCT_CODE,
} from "~/features/product-access/config/product-access";

type SignedInOrganization = { id: string; name: string };

/**
 * What a signed-in person may see in HealthSchedule. This only chooses the
 * screen; the Platform API enforces approval and product access on every
 * request.
 */
export type ProductAccess =
  | { status: "no-organization" }
  | { status: "application-in-progress"; organization: SignedInOrganization }
  | { status: "application-in-review"; organization: SignedInOrganization }
  | { status: "access-unavailable"; organization: SignedInOrganization }
  | { status: "product-not-enabled"; organization: SignedInOrganization }
  | { status: "ready"; organization: SignedInOrganization };

function includesStatus(
  statuses: readonly string[],
  organizationStatus: string
): boolean {
  return statuses.includes(organizationStatus);
}

export function resolveProductAccess(
  platformSession: PlatformSession
): ProductAccess {
  const activeOrganizationIdentifier =
    platformSession.activeContext.organizationId;
  const membership =
    platformSession.memberships.find(
      (candidateMembership) =>
        candidateMembership.organization.id === activeOrganizationIdentifier
    ) ?? platformSession.memberships[0];

  if (!membership) return { status: "no-organization" };

  const organization = {
    id: membership.organization.id,
    name: membership.organization.name,
  };
  const organizationStatus = membership.organization.status;

  if (organizationStatus === APPROVED_ORGANIZATION_STATUS) {
    // The API lists only products that are active for the organisation.
    return membership.products.includes(HEALTH_SCHEDULE_PRODUCT_CODE)
      ? { status: "ready", organization }
      : { status: "product-not-enabled", organization };
  }
  if (includesStatus(APPLICATION_IN_REVIEW_STATUSES, organizationStatus)) {
    return { status: "application-in-review", organization };
  }
  if (includesStatus(APPLICATION_IN_PROGRESS_STATUSES, organizationStatus)) {
    return { status: "application-in-progress", organization };
  }
  return { status: "access-unavailable", organization };
}
