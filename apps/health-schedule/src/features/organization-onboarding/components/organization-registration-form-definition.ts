import type { FormDefinition } from "@healthalyst/ui/lib/form-definition";
import { organizationTypeOptions } from "~/features/organization-onboarding/model/organization-types";
import { ORGANIZATION_REGISTRATION_LIMITS } from "~/features/organization-onboarding/model/organization-registration-schema";

export const organizationRegistrationFormDefinition = {
  identifier: "organization-registration",
  sections: [
    {
      identifier: "organization-name",
      fields: [
        {
          kind: "text",
          name: "organizationName",
          label: "Registered organisation name",
          autoComplete: "organization",
          placeholder: "As shown on your registration documents",
          maxLength: ORGANIZATION_REGISTRATION_LIMITS.organizationName,
          required: true,
        },
      ],
    },
    {
      identifier: "organization-registration",
      columns: 2,
      fields: [
        {
          kind: "select",
          name: "organizationType",
          label: "Organisation type",
          placeholder: "Select a type",
          required: true,
          options: organizationTypeOptions,
        },
        {
          kind: "text",
          name: "registrationNumber",
          label: "Registration number",
          autoComplete: "off",
          placeholder: "Organisation registration ID",
          maxLength: ORGANIZATION_REGISTRATION_LIMITS.registrationNumber,
          required: true,
        },
      ],
    },
    {
      identifier: "administrator-details",
      title: "Administrator details",
      description:
        "The person who registers will manage this organisation after approval.",
      separated: true,
      columns: 2,
      fields: [
        {
          kind: "text",
          name: "firstName",
          label: "First name",
          placeholder: "First name",
          autoComplete: "given-name",
          hideLabel: true,
          borderless: true,
          maxLength: ORGANIZATION_REGISTRATION_LIMITS.administratorNamePart,
          required: true,
        },
        {
          kind: "text",
          name: "lastName",
          label: "Last name",
          placeholder: "Last name",
          autoComplete: "family-name",
          hideLabel: true,
          borderless: true,
          maxLength: ORGANIZATION_REGISTRATION_LIMITS.administratorNamePart,
          required: true,
        },
        {
          kind: "email",
          name: "emailAddress",
          label: "Work email address",
          placeholder: "Work email address",
          autoComplete: "email",
          hideLabel: true,
          borderless: true,
          maxLength: ORGANIZATION_REGISTRATION_LIMITS.emailAddress,
          columnSpan: 2,
          required: true,
        },
        {
          kind: "password",
          name: "password",
          label: "Password",
          placeholder: "Password",
          autoComplete: "new-password",
          hideLabel: true,
          borderless: true,
          minLength: ORGANIZATION_REGISTRATION_LIMITS.passwordMinimum,
          maxLength: ORGANIZATION_REGISTRATION_LIMITS.passwordMaximum,
          required: true,
        },
        {
          kind: "password",
          name: "confirmPassword",
          label: "Confirm password",
          placeholder: "Confirm password",
          autoComplete: "new-password",
          hideLabel: true,
          borderless: true,
          minLength: ORGANIZATION_REGISTRATION_LIMITS.passwordMinimum,
          maxLength: ORGANIZATION_REGISTRATION_LIMITS.passwordMaximum,
          required: true,
        },
      ],
    },
  ],
} as const satisfies FormDefinition;
