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

export const ORGANIZATION_APPLICATION_FIELD_NAMES_BY_PATH = Object.fromEntries(
  ORGANIZATION_PROFILE_FIELD_NAMES.map((fieldName) => [fieldName, fieldName])
);
