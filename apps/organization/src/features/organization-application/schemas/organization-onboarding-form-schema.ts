import { z } from "zod";
import { organizationTypeSchema } from "~/shared/organization/schemas/organization-values-schema";
import { nigerianStateOptions } from "~/shared/organization/config/organization-reference";
import {
  INTERNATIONAL_PHONE_PATTERN,
  ORGANIZATION_FIELD_LIMITS,
} from "~/shared/organization/config/organization-validation";
import { toInternationalPhoneNumber } from "~/shared/organization/utilities/international-phone-number";

const requiredText = (label: string, maximumLength: number) =>
  z
    .string()
    .trim()
    .min(1, `Enter ${label}.`)
    .max(maximumLength, `Use no more than ${maximumLength} characters.`);

export const organizationOnboardingFormSchema = z.object({
  legalName: requiredText(
    "the registered organisation name",
    ORGANIZATION_FIELD_LIMITS.name
  ),
  tradingName: requiredText("the trading name", ORGANIZATION_FIELD_LIMITS.name),
  type: z
    .string()
    .min(1, "Select a facility type.")
    .pipe(organizationTypeSchema),
  cacNumber: z
    .string()
    .trim()
    .transform((value) =>
      value ? value.replace(/\s/g, "").toUpperCase() : null
    )
    .pipe(
      z
        .string()
        .regex(
          /^(RC|BN|IT)?\d{4,8}$/i,
          "Enter a valid CAC number, for example RC1234567."
        )
        .nullable()
    ),
  facilityLicenceNo: z
    .string()
    .trim()
    .max(ORGANIZATION_FIELD_LIMITS.facilityLicenceNumber)
    .transform((value) => value || null),
  email: z
    .string()
    .trim()
    .min(1, "Enter the organisation email address.")
    .email("Enter a valid email address.")
    .max(ORGANIZATION_FIELD_LIMITS.emailAddress),
  phone: z
    .string()
    .transform(toInternationalPhoneNumber)
    .pipe(
      z
        .string()
        .regex(
          INTERNATIONAL_PHONE_PATTERN,
          "Enter a valid phone number, for example 08031234567."
        )
    ),
  addressLine: requiredText(
    "the street address",
    ORGANIZATION_FIELD_LIMITS.addressLine
  ),
  city: requiredText("the town or city", ORGANIZATION_FIELD_LIMITS.city),
  stateCode: z
    .string()
    .min(1, "Select a state.")
    .pipe(z.enum(nigerianStateOptions.map((state) => state.value))),
  lga: z
    .string()
    .trim()
    .max(ORGANIZATION_FIELD_LIMITS.localGovernmentArea)
    .transform((value) => value || null),
});
