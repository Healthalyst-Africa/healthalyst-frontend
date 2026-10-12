import type { FormDefinition } from "@healthalyst/ui/lib/form-definition";

export const organizationTypeOptions = [
  { value: "HOSPITAL", label: "Hospital" },
  { value: "CLINIC", label: "Clinic" },
  { value: "DIAGNOSTIC_CENTRE", label: "Diagnostic centre" },
  { value: "LABORATORY", label: "Laboratory" },
  { value: "PHARMACY", label: "Pharmacy" },
] as const;

export type OrganizationType =
  (typeof organizationTypeOptions)[number]["value"];

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
          maxLength: 160,
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
          maxLength: 64,
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
          maxLength: 60,
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
          maxLength: 60,
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
          maxLength: 254,
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
          minLength: 12,
          maxLength: 72,
          maxByteLength: 72,
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
          minLength: 12,
          maxLength: 72,
          maxByteLength: 72,
          required: true,
        },
      ],
    },
  ],
} as const satisfies FormDefinition;
