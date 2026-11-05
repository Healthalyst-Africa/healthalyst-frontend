import type { PlatformBranchCapability } from "~/features/organization-management/types/organization-management";

/** Platform API permissions that unlock each part of the settings page. */
export const ORGANIZATION_SETTINGS_PERMISSIONS = {
  updateProfile: "org:update",
  manageBranches: "branch:manage",
  transferOwnership: "org:transfer-ownership",
  readStaff: "staff:read",
} as const;

/** The Platform API's codes for an edit made against an older version. */
export const STALE_VERSION_ERROR_CODES = [
  "VERSION_CONFLICT",
  "PRECONDITION_REQUIRED",
] as const;

/** Limits and patterns from the Platform API's branch and department bodies. */
export const BRANCH_FIELD_LIMITS = {
  nameMaximumLength: 120,
  slugMaximumLength: 60,
  slugPattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  departmentCodePattern: /^[A-Z0-9-]{1,12}$/,
  departmentCodeMaximumLength: 12,
} as const;

/** Every capability the API accepts, in the order people see them. */
export const BRANCH_CAPABILITY_OPTIONS: readonly {
  category: PlatformBranchCapability["category"];
  label: string;
}[] = [
  { category: "CONSULTATION", label: "Consultations" },
  { category: "LABORATORY", label: "Laboratory tests" },
  { category: "PHARMACY", label: "Pharmacy" },
  { category: "RADIOLOGY", label: "Imaging" },
  { category: "EMERGENCY", label: "Emergency care" },
  { category: "SURGERY", label: "Surgery" },
  { category: "OTHER", label: "Other services" },
];
