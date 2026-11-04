import { PlatformApiError } from "@healthalyst/platform-api/api-error";
import type { z } from "zod";
import {
  BRANCH_CAPABILITY_OPTIONS,
  STALE_VERSION_ERROR_CODES,
} from "~/features/organization-settings/config/organization-settings";
import type { organizationProfileFormSchema } from "~/features/organization-settings/schemas/organization-settings-schemas";
import type {
  OrganizationProfileChanges,
  PlatformBranchCapability,
  PlatformOrganizationProfile,
} from "~/features/organization-management/types/organization-management";

type ProfileFormValues = z.output<typeof organizationProfileFormSchema>;

/**
 * Only the fields that differ from the saved profile, so an edit never
 * resends values someone else may have changed.
 */
export function readProfileChanges(
  profile: PlatformOrganizationProfile,
  values: ProfileFormValues
): OrganizationProfileChanges {
  const changes: OrganizationProfileChanges = {};
  if (values.tradingName !== profile.tradingName) {
    changes.tradingName = values.tradingName;
  }
  if (values.email !== profile.email) changes.email = values.email;
  if (values.phone !== profile.phone) changes.phone = values.phone;
  if (values.addressLine !== profile.addressLine) {
    changes.addressLine = values.addressLine;
  }
  if (values.city !== profile.city) changes.city = values.city;
  if (values.stateCode !== profile.stateCode) {
    changes.stateCode = values.stateCode;
  }
  if (values.lga !== profile.lga) changes.lga = values.lga;
  if (values.directoryListed !== profile.directoryListed) {
    changes.directoryListed = values.directoryListed;
  }
  return changes;
}

/** True when the API refused an edit because the profile changed meanwhile. */
export function isStaleVersionError(error: unknown): boolean {
  return (
    error instanceof PlatformApiError &&
    STALE_VERSION_ERROR_CODES.some((code) => code === error.code)
  );
}

/** Every capability category, filled in from the branch's saved profile. */
export function completeBranchCapabilities(
  capabilities: readonly PlatformBranchCapability[]
): PlatformBranchCapability[] {
  return BRANCH_CAPABILITY_OPTIONS.map(({ category }) => {
    const saved = capabilities.find(
      (capability) => capability.category === category
    );
    return {
      category,
      isEnabled: saved?.isEnabled ?? false,
      // A branch that does not offer a service cannot take referrals for it.
      acceptsExternalReferrals:
        (saved?.isEnabled ?? false) &&
        (saved?.acceptsExternalReferrals ?? false),
    };
  });
}
