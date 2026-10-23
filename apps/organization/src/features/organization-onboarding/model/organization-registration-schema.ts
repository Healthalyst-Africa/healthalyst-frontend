import { z } from "zod";
import type { PlatformRegistrationDetails } from "~/features/organization-onboarding/api/platform-onboarding-service";
import {
  nigerianStateOptions,
  organizationTypeOptions,
  productOptions,
} from "~/features/organization-onboarding/model/organization-registration-options";
import {
  createPasswordSchema,
  PASSWORD_LIMITS,
} from "~/features/organization-onboarding/model/password-rules";

/** Field limits from the Platform API's `RegistrationBody`. */
export const REGISTRATION_LIMITS = {
  organizationName: 200,
  emailAddress: 254,
  addressLine: 300,
  city: 100,
  localGovernmentArea: 100,
  administratorNamePart: 100,
  passwordMinimum: PASSWORD_LIMITS.minimum,
  passwordMaximum: PASSWORD_LIMITS.maximum,
  productsMaximum: 3,
} as const;

/** E.164, as the Platform API requires: a plus sign and 8 to 15 digits. */
const INTERNATIONAL_PHONE_PATTERN = /^\+[1-9]\d{7,14}$/;

/** Corporate Affairs Commission numbers, optionally prefixed RC, BN or IT. */
const CORPORATE_AFFAIRS_COMMISSION_NUMBER_PATTERN = /^(RC|BN|IT)?\s?\d{4,8}$/i;

/**
 * Accepts a Nigerian number as people usually write it and returns it in
 * E.164: `0803 123 4567` and `234 803 123 4567` both become `+2348031234567`.
 * Other international numbers must already start with a plus sign.
 */
export function toInternationalPhoneNumber(phoneNumber: string): string {
  const compactNumber = phoneNumber.replace(/[\s().-]/g, "");
  if (/^0\d{10}$/.test(compactNumber)) {
    return `+234${compactNumber.slice(1)}`;
  }
  if (/^234\d{10}$/.test(compactNumber)) {
    return `+${compactNumber}`;
  }
  return compactNumber;
}

const requiredText = (label: string, maximumLength: number) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, { error: `${label} is required.` })
    .max(maximumLength, {
      error: `${label} must be no more than ${maximumLength} characters.`,
    });

const optionalText = (label: string, maximumLength: number) =>
  z
    .string()
    .trim()
    .max(maximumLength, {
      error: `${label} must be no more than ${maximumLength} characters.`,
    });

const phoneNumber = (label: string) =>
  z
    .string()
    .trim()
    .transform(toInternationalPhoneNumber)
    .refine(
      (internationalNumber) =>
        INTERNATIONAL_PHONE_PATTERN.test(internationalNumber),
      {
        error: `Enter ${label} with its country code, for example +2348031234567 or 08031234567.`,
      }
    );

const emailAddress = (label: string) =>
  requiredText(label, REGISTRATION_LIMITS.emailAddress).pipe(
    z.email({ error: `Enter a valid ${label.toLowerCase()}.` })
  );

const valuesOf = <Option extends { value: string }>(
  options: readonly Option[]
) =>
  options.map((option) => option.value) as [
    Option["value"],
    ...Option["value"][],
  ];

/** Unchecked boxes submit nothing, one box a string, several an array. */
const checkedValues = (value: unknown): unknown =>
  value === undefined || value === ""
    ? []
    : Array.isArray(value)
      ? value
      : [value];

export const registrationSchema = z
  .object({
    legalName: requiredText(
      "Registered organisation name",
      REGISTRATION_LIMITS.organizationName
    ),
    tradingName: optionalText(
      "Trading name",
      REGISTRATION_LIMITS.organizationName
    ),
    organizationType: z.enum(valuesOf(organizationTypeOptions), {
      error: "Select the type of facility.",
    }),
    corporateAffairsCommissionNumber: z
      .string()
      .trim()
      .refine(
        (registrationNumber) =>
          registrationNumber === "" ||
          CORPORATE_AFFAIRS_COMMISSION_NUMBER_PATTERN.test(registrationNumber),
        {
          error:
            "Enter the Corporate Affairs Commission number as shown on the certificate, for example RC 1234567.",
        }
      ),
    organizationEmailAddress: emailAddress("Organisation email address"),
    organizationPhoneNumber: phoneNumber("the organisation phone number"),
    addressLine: requiredText(
      "Street address",
      REGISTRATION_LIMITS.addressLine
    ),
    city: requiredText("Town or city", REGISTRATION_LIMITS.city),
    stateCode: z.enum(valuesOf(nigerianStateOptions), {
      error: "Select the state.",
    }),
    localGovernmentArea: optionalText(
      "Local government area",
      REGISTRATION_LIMITS.localGovernmentArea
    ),
    products: z.preprocess(
      checkedValues,
      z
        .array(z.enum(valuesOf(productOptions)))
        .min(1, { error: "Choose at least one product." })
        .max(REGISTRATION_LIMITS.productsMaximum)
    ),
    firstName: requiredText(
      "First name",
      REGISTRATION_LIMITS.administratorNamePart
    ),
    lastName: requiredText(
      "Last name",
      REGISTRATION_LIMITS.administratorNamePart
    ),
    emailAddress: emailAddress("Work email address"),
    administratorPhoneNumber: z
      .union([
        z.literal("").transform(() => undefined),
        phoneNumber("your mobile number"),
      ])
      .optional(),
    password: createPasswordSchema("Password"),
    confirmPassword: createPasswordSchema("Confirm password"),
    policiesAccepted: z.literal("on", {
      error:
        "Accept the terms of service, privacy notice and data processing agreement to continue.",
    }),
  })
  .refine((values) => values.password === values.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .transform((values): PlatformRegistrationDetails => ({
    organization: {
      legalName: values.legalName,
      tradingName: values.tradingName || undefined,
      type: values.organizationType,
      email: values.organizationEmailAddress,
      phone: values.organizationPhoneNumber,
      addressLine: values.addressLine,
      city: values.city,
      stateCode: values.stateCode,
      lga: values.localGovernmentArea || undefined,
      cacNumber: values.corporateAffairsCommissionNumber || undefined,
      products: values.products,
    },
    admin: {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.emailAddress,
      phone: values.administratorPhoneNumber,
      password: values.password,
    },
  }));

const registrationFieldDependencies: Record<string, string[]> = {
  password: ["confirmPassword"],
};

export function clearRegistrationFieldErrors(
  errors: Record<string, string>,
  fieldName: string
): Record<string, string> {
  const updatedErrors = { ...errors };
  delete updatedErrors[fieldName];
  for (const dependentFieldName of registrationFieldDependencies[fieldName] ??
    []) {
    delete updatedErrors[dependentFieldName];
  }
  return updatedErrors;
}
