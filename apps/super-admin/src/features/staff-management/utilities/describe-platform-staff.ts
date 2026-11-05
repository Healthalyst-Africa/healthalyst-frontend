import {
  GRANTABLE_PLATFORM_ROLES,
  PLATFORM_ROLE_PRESENTATION,
  type GrantablePlatformRole,
  type PlatformRole,
} from "~/features/staff-management/config/staff-management";
import type { PlatformStaffMember } from "~/features/staff-management/types/staff-management";

export function describeStaffName(
  staffMember: Pick<PlatformStaffMember, "firstName" | "lastName">
): string {
  return `${staffMember.firstName} ${staffMember.lastName}`.trim();
}

export function describePlatformRoles(roles: readonly PlatformRole[]): string {
  return roles.length > 0
    ? roles.map((role) => PLATFORM_ROLE_PRESENTATION[role].label).join(", ")
    : "No staff roles";
}

export function isSuperAdmin(staffMember: PlatformStaffMember): boolean {
  return staffMember.roles.includes("SUPER_ADMIN");
}

/** The roles a super admin can change, leaving super admin aside. */
export function readGrantableRoles(
  roles: readonly PlatformRole[]
): GrantablePlatformRole[] {
  return GRANTABLE_PLATFORM_ROLES.filter((role) => roles.includes(role));
}

/** Reads the role checkboxes named `roles` from a submitted form. */
export function readCheckedRoles(formData: FormData): string[] {
  return formData.getAll("roles").map(String);
}
