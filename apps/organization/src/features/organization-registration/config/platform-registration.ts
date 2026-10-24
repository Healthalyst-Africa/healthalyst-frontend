/** Request paths in validation errors, mapped to the form's field names. */
export const REGISTRATION_FIELD_NAMES_BY_PATH = {
  "organization.legalName": "legalName",
  "organization.tradingName": "tradingName",
  "organization.type": "organizationType",
  "organization.email": "organizationEmailAddress",
  "organization.phone": "organizationPhoneNumber",
  "organization.addressLine": "addressLine",
  "organization.city": "city",
  "organization.stateCode": "stateCode",
  "organization.lga": "localGovernmentArea",
  "organization.cacNumber": "corporateAffairsCommissionNumber",
  "organization.products": "products",
  "admin.firstName": "firstName",
  "admin.lastName": "lastName",
  "admin.email": "emailAddress",
  "admin.phone": "administratorPhoneNumber",
  "admin.password": "password",
  policies: "policiesAccepted",
} as const;

export const UNEXPECTED_RESPONSE_MESSAGE =
  "We received an unexpected response from HealthAlyst. Contact HealthAlyst for help.";

export const REGISTRATION_ENDPOINTS = {
  policies: "/v1/reference/policies",
  organizationTypes: "/v1/reference/organization-types",
  states: "/v1/reference/states",
  registrations: "/v1/onboarding/registrations",
} as const;
export const REGISTRATION_REFERENCE_CONFIGURATION = {
  organizationTypesStaleTimeMilliseconds: 5 * 60 * 1000,
  statesStaleTimeMilliseconds: 60 * 60 * 1000,
  queryNamespace: "platform-reference",
} as const;
