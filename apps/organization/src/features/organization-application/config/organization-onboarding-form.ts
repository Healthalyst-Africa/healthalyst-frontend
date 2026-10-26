import type {
  FormDefinition,
  FormOption,
} from "@healthalyst/ui/types/form-definition";
import { ORGANIZATION_FIELD_LIMITS } from "~/shared/organization/config/organization-validation";

export function createOrganizationOnboardingFormDefinition(
  organizationTypes: readonly FormOption[],
  states: readonly FormOption[]
): FormDefinition {
  return {
    identifier: "organization-onboarding",
    sections: [
      {
        identifier: "organization-details",
        title: "Organisation details",
        columns: 2,
        fields: [
          {
            kind: "text",
            name: "legalName",
            label: "Registered organisation name",
            autoComplete: "organization",
            maxLength: ORGANIZATION_FIELD_LIMITS.name,
            required: true,
            columnSpan: 2,
          },
          {
            kind: "text",
            name: "tradingName",
            label: "Trading name",
            maxLength: ORGANIZATION_FIELD_LIMITS.name,
            required: true,
            columnSpan: 2,
          },
          {
            kind: "select",
            name: "type",
            label: "Type of facility",
            placeholder: "Select a facility type",
            options: organizationTypes,
            required: true,
          },
          {
            kind: "text",
            name: "cacNumber",
            label: "CAC registration number",
            placeholder: "For example RC1234567",
            required: true,
          },
          {
            kind: "text",
            name: "facilityLicenceNo",
            label: "Facility licence number",
            maxLength: ORGANIZATION_FIELD_LIMITS.facilityLicenceNumber,
            columnSpan: 2,
          },
        ],
      },
      {
        identifier: "organization-address",
        title: "Organisation address",
        columns: 2,
        fields: [
          {
            kind: "text",
            name: "addressLine",
            label: "Street address",
            autoComplete: "street-address",
            maxLength: ORGANIZATION_FIELD_LIMITS.addressLine,
            required: true,
            columnSpan: 2,
          },
          {
            kind: "select",
            name: "stateCode",
            label: "State",
            placeholder: "Select a state",
            options: states,
            required: true,
          },
          {
            kind: "text",
            name: "city",
            label: "Town or city",
            autoComplete: "address-level2",
            maxLength: ORGANIZATION_FIELD_LIMITS.city,
            required: true,
          },
          {
            kind: "text",
            name: "lga",
            label: "Local government area",
            maxLength: ORGANIZATION_FIELD_LIMITS.localGovernmentArea,
            columnSpan: 2,
          },
        ],
      },
      {
        identifier: "organization-contact",
        title: "Contact details",
        columns: 2,
        fields: [
          {
            kind: "email",
            name: "email",
            label: "Organisation email address",
            autoComplete: "email",
            maxLength: ORGANIZATION_FIELD_LIMITS.emailAddress,
            required: true,
          },
          {
            kind: "tel",
            name: "phone",
            label: "Organisation phone number",
            autoComplete: "tel",
            placeholder: "For example 08031234567",
            required: true,
          },
        ],
      },
    ],
  };
}
