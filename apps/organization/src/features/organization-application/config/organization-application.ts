export const ORGANIZATION_APPLICATION_ENDPOINTS = {
  application: "/v1/onboarding/application",
  submit: "/v1/onboarding/application/submit",
} as const;
export const ORGANIZATION_APPLICATION_QUERY_KEY = "organization-application";
export const ORGANIZATION_PROFILE_FIELD_NAMES = [
  "legalName",
  "tradingName",
  "type",
  "cacNumber",
  "facilityLicenceNo",
  "email",
  "phone",
  "addressLine",
  "city",
  "stateCode",
  "lga",
] as const;

/**
 * Fields marked as required. They guide applicants but never prevent saving or
 * moving between steps; HealthAlyst staff decide whether an application is
 * complete enough to approve.
 */
export const ORGANIZATION_PROFILE_REQUIRED_FIELD_NAMES = [
  "legalName",
  "tradingName",
  "type",
  "email",
  "phone",
  "addressLine",
  "city",
  "stateCode",
] as const satisfies readonly (typeof ORGANIZATION_PROFILE_FIELD_NAMES)[number][];

export const ORGANIZATION_APPLICATION_FIELD_NAMES_BY_PATH = Object.fromEntries(
  ORGANIZATION_PROFILE_FIELD_NAMES.map((fieldName) => [fieldName, fieldName])
);
