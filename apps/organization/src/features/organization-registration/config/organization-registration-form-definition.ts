import { formDefinitionFieldNames } from "@healthalyst/ui/forms/form-definition";
import type { FormDefinition } from "@healthalyst/ui/types/form-definition";
import type { PlatformRegistrationStep } from "~/features/organization-registration/types/registration-step";
import {
  nigerianStateOptions,
  organizationTypeOptions,
} from "~/shared/organization/config/organization-reference";
import { productOptions } from "~/features/organization-registration/config/organization-registration-options";
import { REGISTRATION_LIMITS } from "~/features/organization-registration/config/registration-limits";

export const organizationFormDefinition = {
  identifier: "organization-registration",
  sections: [
    {
      identifier: "organization-identity",
      columns: 2,
      fields: [
        {
          kind: "text",
          name: "legalName",
          label: "Registered organisation name",
          autoComplete: "organization",
          placeholder: "As shown on your registration documents",
          maxLength: REGISTRATION_LIMITS.organizationName,
          columnSpan: 2,
          required: true,
        },
        {
          kind: "text",
          name: "tradingName",
          label: "Trading name",
          placeholder: "If different from the registered name",
          autoComplete: "off",
          maxLength: REGISTRATION_LIMITS.organizationName,
          columnSpan: 2,
          required: false,
        },
        {
          kind: "select",
          name: "organizationType",
          label: "Type of facility",
          placeholder: "Select the type of facility",
          columnSpan: 2,
          required: true,
          options: organizationTypeOptions,
        },
        {
          kind: "text",
          name: "corporateAffairsCommissionNumber",
          label: "Corporate Affairs Commission (CAC) number",
          columnSpan: 2,
          autoComplete: "off",
          placeholder: "For example RC 1234567",
          required: true,
        },
      ],
    },
    {
      identifier: "products",
      fields: [
        {
          kind: "multi-select",
          name: "products",
          label: "Products you want to use",
          placeholder: "Select one or more products",
          required: true,
          options: productOptions,
          maximumSelections: REGISTRATION_LIMITS.productsMaximum,
        },
      ],
    },
  ],
} as const satisfies FormDefinition;

export const contactFormDefinition = {
  identifier: "organization-registration",
  sections: [
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
          maxLength: REGISTRATION_LIMITS.emailAddress,
          required: true,
        },
        {
          kind: "tel",
          name: "organizationPhoneNumber",
          label: "Organisation phone number",
          placeholder: "For example 08031234567",
          autoComplete: "tel",
          required: true,
        },
        {
          kind: "text",
          name: "addressLine",
          label: "Street address",
          placeholder: "Building number and street",
          autoComplete: "street-address",
          maxLength: REGISTRATION_LIMITS.addressLine,
          columnSpan: 2,
          required: true,
        },
        {
          kind: "text",
          name: "city",
          label: "Town or city",
          placeholder: "Town or city",
          autoComplete: "address-level2",
          maxLength: REGISTRATION_LIMITS.city,
          required: true,
        },
        {
          kind: "select",
          name: "stateCode",
          label: "State",
          placeholder: "Select the state",
          required: true,
          options: nigerianStateOptions,
        },
        {
          kind: "text",
          name: "localGovernmentArea",
          label: "Local government area",
          placeholder: "Local government area",
          autoComplete: "off",
          maxLength: REGISTRATION_LIMITS.localGovernmentArea,
          columnSpan: 2,
          required: false,
        },
      ],
    },
  ],
} as const satisfies FormDefinition;

export const administratorFormDefinition = {
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
          autoComplete: "given-name",
          maxLength: REGISTRATION_LIMITS.administratorNamePart,
          required: true,
        },
        {
          kind: "text",
          name: "lastName",
          label: "Last name",
          autoComplete: "family-name",
          maxLength: REGISTRATION_LIMITS.administratorNamePart,
          required: true,
        },
        {
          kind: "email",
          name: "emailAddress",
          label: "Work email address",
          placeholder: "name@yourorganisation.com",
          autoComplete: "email",
          maxLength: REGISTRATION_LIMITS.emailAddress,
          columnSpan: 2,
          required: true,
        },
        {
          kind: "tel",
          name: "administratorPhoneNumber",
          label: "Mobile number",
          placeholder: "For example 08031234567",
          autoComplete: "tel",
          columnSpan: 2,
          required: false,
        },
        {
          kind: "password",
          name: "password",
          label: "Password",
          placeholder: `At least ${REGISTRATION_LIMITS.passwordMinimum} characters`,
          autoComplete: "new-password",
          minLength: REGISTRATION_LIMITS.passwordMinimum,
          maxLength: REGISTRATION_LIMITS.passwordMaximum,
          required: true,
        },
        {
          kind: "password",
          name: "confirmPassword",
          label: "Confirm password",
          placeholder: "Enter the password again",
          autoComplete: "new-password",
          minLength: REGISTRATION_LIMITS.passwordMinimum,
          maxLength: REGISTRATION_LIMITS.passwordMaximum,
          required: true,
        },
      ],
    },
  ],
} as const satisfies FormDefinition;

export const policyConsentFormDefinition = {
  identifier: "organization-registration",
  sections: [
    {
      identifier: "policy-consent",
      fields: [
        {
          kind: "checkbox",
          name: "policiesAccepted",
          label:
            "I accept the HealthAlyst terms of service, privacy notice and data processing agreement on behalf of this organisation.",
          required: true,
        },
      ],
    },
  ],
} as const satisfies FormDefinition;

function createStep(
  step: Omit<PlatformRegistrationStep, "fieldNames">
): PlatformRegistrationStep {
  return {
    ...step,
    fieldNames: step.definitions.flatMap(formDefinitionFieldNames),
  };
}

/** The registration form's steps, in order. Every field belongs to one step. */
export const registrationSteps: readonly PlatformRegistrationStep[] = [
  createStep({
    identifier: "organization",
    heading: "Tell us about your organisation",
    actionLabel: "Continue to contact details",
    definitions: [organizationFormDefinition],
  }),
  createStep({
    identifier: "contact",
    heading: "Where can we reach you?",
    actionLabel: "Continue to administrator account",
    definitions: [contactFormDefinition],
  }),
  createStep({
    identifier: "administrator",
    heading: "Create the administrator account",
    description:
      "The person who registers will manage this organisation after approval.",
    actionLabel: "Register organisation",
    definitions: [administratorFormDefinition, policyConsentFormDefinition],
  }),
];
