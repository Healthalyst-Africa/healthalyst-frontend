import type {
  OrganizationApplication,
  RegistrationStatus,
} from "~/features/organization-oversight/types/organization-types";

export type OrganizationApplicationFilters = {
  organizationName: string;
  /** An empty string includes every status. */
  status: RegistrationStatus | "";
  /** An empty string includes every facility type. */
  facilityType: NonNullable<OrganizationApplication["type"]> | "";
};
