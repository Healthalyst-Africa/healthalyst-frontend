import type { FormDefinition } from "@healthalyst/ui/lib/form-definition";
import { organizationTypeOptions } from "~/features/organization-onboarding/model/organization-types";
import { productInterestOptions } from "~/features/organization-onboarding/model/organization-interest-options";
import { ORGANIZATION_REGISTRATION_LIMITS } from "~/features/organization-onboarding/model/organization-registration-schema";

export const organizationRegistrationFormDefinition = {
  identifier: "organization-registration",
  sections: [
    {
      identifier: "organization-identity",
      columns: 2,
      fields: [
        {
          kind: "text",
          name: "organizationName",
          label: "Registered organisation name",
          autoComplete: "organization",
          placeholder: "As shown on your registration documents",
          maxLength: ORGANIZATION_REGISTRATION_LIMITS.organizationName,
          columnSpan: 2,
          required: true,
        },
        {
          kind: "select",
          name: "organizationType",
          label: "Organisation type",
          placeholder: "Select an organisation type",
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
      identifier: "organization-contact-details",
      columns: 2,
      fields: [
        {
          kind: "email",
          name: "organizationEmailAddress",
          label: "Organisation email address",
          placeholder: "Organisation email address",
          autoComplete: "email",
          maxLength: ORGANIZATION_REGISTRATION_LIMITS.organizationEmailAddress,
          columnSpan: 2,
          required: true,
        },
        {
          kind: "tel",
          name: "organizationPhoneNumber",
          label: "Organisation phone number (optional)",
          placeholder: "Organisation phone number (optional)",
          autoComplete: "tel",
          maxLength: ORGANIZATION_REGISTRATION_LIMITS.organizationPhoneNumber,
          required: false,
        },
        {
          kind: "url",
          name: "websiteUrl",
          label: "Website URL (optional)",
          placeholder: "https://www.example.org",
          autoComplete: "url",
          maxLength: ORGANIZATION_REGISTRATION_LIMITS.websiteUrl,
          required: false,
        },
      ],
    },
    {
      identifier: "product-interest",
      fields: [
        {
          kind: "select",
          name: "productInterest",
          label: "Product of interest…",
          placeholder: "Product of interest…",
          required: true,
          options: productInterestOptions,
        },
      ],
    },
  ],
} as const satisfies FormDefinition;

export const administratorDetailsFormDefinition = {
  identifier: "organization-registration",
  sections: [
    {
      identifier: "administrator-details",
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
