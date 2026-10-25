import { ORGANIZATION_PROFILE_FIELD_NAMES } from "~/features/organization-application/config/organization-application";
import { applicationPatchSchema } from "~/features/organization-application/schemas/organization-application-schema";
import type { OrganizationApplication } from "~/features/organization-application/types/organization-application";
import type {
  OrganizationOnboardingFormValues,
  OrganizationOnboardingProfile,
} from "~/features/organization-application/types/organization-onboarding-form";

export function toOrganizationOnboardingFormValues(
  profile: OrganizationApplication["profile"]
): OrganizationOnboardingFormValues {
  return {
    legalName: profile.legalName,
    tradingName: profile.tradingName,
    type: profile.type ?? "",
    cacNumber: profile.cacNumber ?? "",
    facilityLicenceNo: profile.facilityLicenceNo ?? "",
    email: profile.email ?? "",
    phone: profile.phone ?? "",
    addressLine: profile.addressLine ?? "",
    city: profile.city ?? "",
    stateCode: profile.stateCode ?? "",
    lga: profile.lga ?? "",
  };
}

export function getOrganizationOnboardingChanges(
  profile: OrganizationApplication["profile"],
  values: Partial<OrganizationOnboardingProfile>,
  changedFieldNames: readonly (typeof ORGANIZATION_PROFILE_FIELD_NAMES)[number][]
) {
  const changedFields = changedFieldNames
    .filter((fieldName) => values[fieldName] !== profile[fieldName])
    .map((fieldName) => [fieldName, values[fieldName]]);
  return changedFields.length === 0
    ? null
    : applicationPatchSchema.parse(Object.fromEntries(changedFields));
}

/** Retain edits while adopting a newer server version after an edit conflict. */
export function mergeOrganizationOnboardingDraft(
  latest: OrganizationOnboardingFormValues,
  previous: OrganizationOnboardingFormValues,
  draft: OrganizationOnboardingFormValues
) {
  const mergedValues = { ...latest };
  for (const fieldName of ORGANIZATION_PROFILE_FIELD_NAMES) {
    if (draft[fieldName] !== previous[fieldName])
      mergedValues[fieldName] = draft[fieldName];
  }
  return mergedValues;
}
