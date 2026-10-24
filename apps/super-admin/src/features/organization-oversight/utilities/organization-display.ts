import type { OrganizationDetail } from "~/features/organization-oversight/types/organization-types";
import type { ReadableProfileField } from "~/features/organization-oversight/types/organization-details";

export function getReadableProfileFields(
  detail: OrganizationDetail
): ReadableProfileField[] {
  return Object.entries(detail.profile).flatMap(([fieldName, fieldValue]) => {
    if (
      typeof fieldValue !== "string" &&
      typeof fieldValue !== "number" &&
      typeof fieldValue !== "boolean"
    ) {
      return [];
    }
    return [{ label: formatLabel(fieldName), value: String(fieldValue) }];
  });
}

export function formatLabel(value: string): string {
  return value
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replaceAll("_", " ")
    .toLocaleLowerCase()
    .replace(/^./, (firstCharacter) => firstCharacter.toLocaleUpperCase());
}
