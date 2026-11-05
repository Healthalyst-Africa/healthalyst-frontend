import { SERVICE_CATEGORY_LABELS } from "~/features/partner-network/config/partner-network";
import type { Partnership } from "~/features/partner-network/types/partner-network";
import {
  nigerianStateOptions,
  organizationTypeOptions,
} from "~/shared/organization/config/organization-reference";

export function describeOrganizationType(type: string | null): string | null {
  if (!type) return null;
  return (
    organizationTypeOptions.find((option) => option.value === type)?.label ??
    null
  );
}

export function describeState(stateCode: string | null): string | null {
  if (!stateCode) return null;
  return (
    nigerianStateOptions.find((option) => option.value === stateCode)?.label ??
    stateCode
  );
}

/** "Laboratory, Lagos" from whichever parts are known. */
export function describeOrganizationPlace(
  type: string | null,
  place: string | null
): string | undefined {
  const parts = [describeOrganizationType(type), place].filter(Boolean);
  return parts.length > 0 ? parts.join(", ") : undefined;
}

/** Which way referrals go, from this organisation's point of view. */
export function describeDirection(
  partnership: Pick<Partnership, "direction" | "serviceCategory">
): string {
  const service = SERVICE_CATEGORY_LABELS[partnership.serviceCategory];
  return partnership.direction === "OUTGOING"
    ? `${service}: you send to them`
    : `${service}: they send to you`;
}
