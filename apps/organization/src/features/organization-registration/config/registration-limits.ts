import { ORGANIZATION_FIELD_LIMITS } from "~/shared/organization/config/organization-validation";
import { PASSWORD_LIMITS } from "~/features/authentication/config/authentication-limits";

/** Field limits from the Platform API's `RegistrationBody`. */
export const REGISTRATION_LIMITS = {
  organizationName: ORGANIZATION_FIELD_LIMITS.name,
  emailAddress: ORGANIZATION_FIELD_LIMITS.emailAddress,
  addressLine: ORGANIZATION_FIELD_LIMITS.addressLine,
  city: ORGANIZATION_FIELD_LIMITS.city,
  localGovernmentArea: ORGANIZATION_FIELD_LIMITS.localGovernmentArea,
  administratorNamePart: 100,
  passwordMinimum: PASSWORD_LIMITS.minimum,
  passwordMaximum: PASSWORD_LIMITS.maximum,
  productsMaximum: 3,
} as const;
