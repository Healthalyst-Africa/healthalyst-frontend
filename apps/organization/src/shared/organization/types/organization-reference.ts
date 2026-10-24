import type {
  nigerianStateOptions,
  organizationTypeOptions,
} from "~/shared/organization/config/organization-reference";
export type OrganizationType =
  (typeof organizationTypeOptions)[number]["value"];
export type NigerianStateCode = (typeof nigerianStateOptions)[number]["value"];
