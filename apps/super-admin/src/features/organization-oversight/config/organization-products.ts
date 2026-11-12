import type { RegistrationStatus } from "~/features/organization-oversight/types/organization-types";

/**
 * Adding or pausing products after approval
 * (`PUT /v1/admin/organizations/{id}/products`). Before approval, products are
 * chosen when approving.
 */
export const ORGANIZATION_PRODUCT_CHANGE = {
  /** Platform roles the API accepts. */
  roles: ["SUPER_ADMIN", "PLATFORM_ADMIN"],
  /** Organisation statuses the products can change from. */
  fromStatuses: ["ACTIVE", "SUSPENDED"] as readonly RegistrationStatus[],
  reasonMinimumLength: 5,
  reasonMaximumLength: 500,
} as const;
