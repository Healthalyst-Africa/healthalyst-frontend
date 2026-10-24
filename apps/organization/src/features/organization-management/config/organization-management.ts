export const UNEXPECTED_ORGANIZATION_RESPONSE =
  "We received an unexpected organisation response from HealthAlyst. Contact HealthAlyst for help.";

export const ORGANIZATION_MANAGEMENT_ENDPOINTS = {
  organization: "/v1/organization",
  branches: "/v1/organization/branches",
  departments: "/v1/organization/departments",
} as const;
export const ORGANIZATION_PROFILE_QUERY_KEY = "platform-organization-profile";
export const ORGANIZATION_BRANCHES_QUERY_KEY = "platform-organization-branches";
