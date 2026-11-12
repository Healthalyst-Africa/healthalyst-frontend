import type { StatusTone } from "@healthalyst/ui/types/status-tone";

export const PLATFORM_ROLES = [
  "SUPER_ADMIN",
  "PLATFORM_ADMIN",
  "COMPLIANCE_REVIEWER",
  "SUPPORT_AGENT",
  "READ_ONLY_AUDITOR",
] as const;

export type PlatformRole = (typeof PLATFORM_ROLES)[number];

/** Roles a super admin can give here. An operator grants super admin. */
export const GRANTABLE_PLATFORM_ROLES = [
  "PLATFORM_ADMIN",
  "COMPLIANCE_REVIEWER",
  "SUPPORT_AGENT",
  "READ_ONLY_AUDITOR",
] as const satisfies readonly PlatformRole[];

export type GrantablePlatformRole = (typeof GRANTABLE_PLATFORM_ROLES)[number];

export const PLATFORM_STAFF_STATUSES = [
  "PENDING_VERIFICATION",
  "ACTIVE",
  "SUSPENDED",
  "DEACTIVATED",
] as const;

export type PlatformStaffStatus = (typeof PLATFORM_STAFF_STATUSES)[number];

/** Only super admins may read or change HealthAlyst staff. */
export const STAFF_MANAGEMENT_ROLES: readonly PlatformRole[] = ["SUPER_ADMIN"];

export const STAFF_MANAGEMENT_ENDPOINTS = {
  staff: "/v1/admin/staff",
  roles: (userId: string) =>
    `/v1/admin/staff/${encodeURIComponent(userId)}/roles`,
  remove: (userId: string) =>
    `/v1/admin/staff/${encodeURIComponent(userId)}/remove`,
  removeSuperAdmin: (userId: string) =>
    `/v1/admin/staff/${encodeURIComponent(userId)}/remove-super-admin`,
} as const;

/** Limits from the Platform API's staff request bodies. */
export const STAFF_MANAGEMENT_LIMITS = {
  emailMaximumLength: 254,
  nameMaximumLength: 100,
  removalReasonMinimumLength: 5,
  removalReasonMaximumLength: 500,
} as const;

export const PLATFORM_ROLE_PRESENTATION: Record<
  PlatformRole,
  { label: string; description: string }
> = {
  SUPER_ADMIN: {
    label: "Super admin",
    description:
      "Every staff action, including managing staff. Only an operator can grant it.",
  },
  PLATFORM_ADMIN: {
    label: "Platform admin",
    description:
      "Reviews applications and manages organisations, including suspending them.",
  },
  COMPLIANCE_REVIEWER: {
    label: "Compliance reviewer",
    description: "Reviews registration applications and their documents.",
  },
  SUPPORT_AGENT: {
    label: "Support agent",
    description: "Helps organisations with their accounts.",
  },
  READ_ONLY_AUDITOR: {
    label: "Read-only auditor",
    description: "Reads the audit log and checks that it is intact.",
  },
};

export const PLATFORM_STAFF_STATUS_PRESENTATION: Record<
  PlatformStaffStatus,
  { label: string; tone: StatusTone }
> = {
  PENDING_VERIFICATION: { label: "Setting up", tone: "information" },
  ACTIVE: { label: "Active", tone: "positive" },
  SUSPENDED: { label: "Suspended", tone: "warning" },
  DEACTIVATED: { label: "Deactivated", tone: "negative" },
};

export const STAFF_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lagos",
});

/** Everything cached for this staff member, such as staff and the review queue. */
export const platformStaffWorkspaceQueryKey = (staffAccountId: string) =>
  ["platform-staff", staffAccountId] as const;

export const platformStaffQueryKey = (staffAccountId: string) =>
  ["platform-staff", staffAccountId, "staff-members"] as const;
