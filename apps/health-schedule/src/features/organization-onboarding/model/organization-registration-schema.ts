import { z } from "zod";
import type { RegistrationRequest } from "~/features/organization-onboarding/api/accounts-service";
import { organizationTypeOptions } from "~/features/organization-onboarding/model/organization-types";

export const ORGANIZATION_REGISTRATION_LIMITS = {
  organizationName: 160,
  registrationNumber: 64,
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
