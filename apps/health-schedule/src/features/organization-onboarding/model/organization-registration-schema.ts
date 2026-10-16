import { z } from "zod";
import type { RegistrationRequest } from "~/features/organization-onboarding/api/accounts-service";
import { productInterestOptions } from "~/features/organization-onboarding/model/organization-interest-options";
import { organizationTypeOptions } from "~/features/organization-onboarding/model/organization-types";

export const ORGANIZATION_REGISTRATION_LIMITS = {
  organizationName: 160,
  registrationNumber: 64,
  organizationEmailAddress: 254,
  organizationPhoneNumber: 40,
  websiteUrl: 2048,
  productInterest: 160,
  administratorNamePart: 60,
  administratorName: 120,
  emailAddress: 254,
  passwordMinimum: 12,
  passwordMaximum: 72,
  passwordByteMaximum: 72,
} as const;

const requiredText = (label: string, maximumLength: number) =>
  z
    .string({ error: `${label} is required.` })
    .trim()
    .min(1, { error: `${label} is required.` })
    .max(maximumLength, {
      error: `${label} must be no more than ${maximumLength} characters.`,
    });

const requiredPassword = (label: string) =>
  z
    .string({ error: `${label} is required.` })
    .min(1, { error: `${label} is required.` })
    .min(ORGANIZATION_REGISTRATION_LIMITS.passwordMinimum, {
      error: `${label} must be at least ${ORGANIZATION_REGISTRATION_LIMITS.passwordMinimum} characters.`,
    })
    .max(ORGANIZATION_REGISTRATION_LIMITS.passwordMaximum, {
      error: `${label} must be no more than ${ORGANIZATION_REGISTRATION_LIMITS.passwordMaximum} characters.`,
    })
    .refine(
      (value) =>
        new TextEncoder().encode(value).length <=
        ORGANIZATION_REGISTRATION_LIMITS.passwordByteMaximum,
      {
        error: `${label} must be no more than ${ORGANIZATION_REGISTRATION_LIMITS.passwordByteMaximum} UTF-8 bytes.`,
      }
    );

const optionalWebsiteUrl = z
  .string()
  .trim()
  .max(ORGANIZATION_REGISTRATION_LIMITS.websiteUrl, {
    error: `Website URL must be no more than ${ORGANIZATION_REGISTRATION_LIMITS.websiteUrl} characters.`,
  })
  .refine(
    (websiteUrl) => {
      if (websiteUrl === "") {
        return true;
      }

      try {
        const parsedWebsiteUrl = new URL(websiteUrl);

        return (
          (parsedWebsiteUrl.protocol === "https:" ||
            parsedWebsiteUrl.protocol === "http:") &&
          parsedWebsiteUrl.hostname.length > 0
        );
      } catch {
        return false;
      }
    },
    {
      error: "Enter a valid website URL starting with http:// or https://.",
    }
  );

export const organizationRegistrationSchema = z
  .object({
    organizationName: requiredText(
      "Registered organisation name",
      ORGANIZATION_REGISTRATION_LIMITS.organizationName
    ),
    organizationType: z.enum(
      organizationTypeOptions.map(
        (organizationTypeOption) => organizationTypeOption.value
      ),
      {
        error: "Select a valid organisation type.",
      }
    ),
    registrationNumber: requiredText(
      "Registration number",
      ORGANIZATION_REGISTRATION_LIMITS.registrationNumber
    ),
    organizationEmailAddress: requiredText(
      "Organisation email address",
      ORGANIZATION_REGISTRATION_LIMITS.organizationEmailAddress
    ).pipe(z.email({ error: "Enter a valid organisation email address." })),
    organizationPhoneNumber: z
      .string()
      .trim()
      .max(ORGANIZATION_REGISTRATION_LIMITS.organizationPhoneNumber, {
        error: `Organisation phone number must be no more than ${ORGANIZATION_REGISTRATION_LIMITS.organizationPhoneNumber} characters.`,
      }),
    websiteUrl: optionalWebsiteUrl,
    productInterest: z.enum(
      productInterestOptions.map(
        (productInterestOption) => productInterestOption.value
      ),
      { error: "Select the product you are interested in." }
    ),
    firstName: requiredText(
      "First name",
      ORGANIZATION_REGISTRATION_LIMITS.administratorNamePart
    ),
    lastName: requiredText(
      "Last name",
      ORGANIZATION_REGISTRATION_LIMITS.administratorNamePart
    ),
    emailAddress: requiredText(
      "Work email address",
      ORGANIZATION_REGISTRATION_LIMITS.emailAddress
    ).pipe(z.email({ error: "Enter a valid email address." })),
    password: requiredPassword("Password"),
    confirmPassword: requiredPassword("Confirm password"),
  })
  .refine((values) => values.password === values.confirmPassword, {
    error: "Passwords do not match.",
    path: ["confirmPassword"],
  })
  .refine(
    (values) =>
      `${values.firstName} ${values.lastName}`.length <=
      ORGANIZATION_REGISTRATION_LIMITS.administratorName,
    {
      error: `First and last name together must be no more than ${ORGANIZATION_REGISTRATION_LIMITS.administratorName} characters.`,
      path: ["lastName"],
    }
  )
  .transform((values): RegistrationRequest => ({
    organizationName: values.organizationName,
    organizationType: values.organizationType,
    registrationNumber: values.registrationNumber,
    organizationEmailAddress: values.organizationEmailAddress,
    organizationPhoneNumber:
      values.organizationPhoneNumber === ""
        ? null
        : values.organizationPhoneNumber,
    websiteUrl: values.websiteUrl === "" ? null : values.websiteUrl,
    productInterest: values.productInterest,
    countryCode: "NG",
    administratorName: `${values.firstName} ${values.lastName}`,
    emailAddress: values.emailAddress,
    password: values.password,
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
