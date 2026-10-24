/** Common field bounds from the Platform organization contracts. */
export const ORGANIZATION_FIELD_LIMITS = {
  name: 200,
  emailAddress: 254,
  addressLine: 300,
  city: 100,
  localGovernmentArea: 100,
  facilityLicenceNumber: 100,
} as const;
export const INTERNATIONAL_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;
