import type { StatusTone } from "@healthalyst/ui/types/status-tone";

export const UNEXPECTED_TEAM_RESPONSE =
  "We received an unexpected team response from HealthAlyst. Contact HealthAlyst for help.";

export const TEAM_ENDPOINTS = {
  staff: "/v1/staff",
  invitations: "/v1/staff/invitations",
  bulkInvitations: "/v1/staff/invitations/bulk",
  roles: "/v1/roles",
  permissions: "/v1/permissions",
} as const;

export const TEAM_MEMBERS_QUERY_KEY = "platform-team-members";
export const TEAM_INVITATIONS_QUERY_KEY = "platform-team-invitations";
export const TEAM_ROLES_QUERY_KEY = "platform-team-roles";
export const TEAM_PERMISSIONS_QUERY_KEY = "platform-team-permissions";

/** Platform API permissions that unlock each part of the team pages. */
export const TEAM_PERMISSIONS = {
  readStaff: "staff:read",
  inviteStaff: "staff:invite",
  updateStaff: "staff:update",
  suspendStaff: "staff:suspend",
  removeStaff: "staff:remove",
  readRoles: "role:read",
  manageRoles: "role:manage",
  readBranches: "branch:read",
} as const;

export const TEAM_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-NG", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Africa/Lagos",
});

/** Limits from the Platform API's staff, invitation and role bodies. */
export const TEAM_FIELD_LIMITS = {
  nameMaximumLength: 100,
  emailMaximumLength: 254,
  jobTitleMaximumLength: 100,
  licenceNumberMaximumLength: 60,
  verificationReferenceMaximumLength: 100,
  roleNameMaximumLength: 80,
  searchMinimumLength: 2,
  searchMaximumLength: 100,
  pageSize: 50,
  bulkInvitationMaximum: 200,
  /** Approval limits are sent in kobo; people enter naira. */
  approvalAmountMaximumKobo: 1_000_000_000,
  discountPercentMaximum: 100,
} as const;

export type StaffMemberStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "REVOKED";
export type InvitationStatus = "PENDING" | "ACCEPTED" | "REVOKED" | "EXPIRED";
export type LicenceStatus =
  "NONE" | "MISSING" | "UNVERIFIED" | "VERIFIED" | "EXPIRING" | "EXPIRED";

export const STAFF_STATUS_PRESENTATION: Record<
  StaffMemberStatus,
  { label: string; tone: StatusTone }
> = {
  INVITED: { label: "Invited", tone: "information" },
  ACTIVE: { label: "Active", tone: "positive" },
  SUSPENDED: { label: "Suspended", tone: "warning" },
  REVOKED: { label: "Removed", tone: "negative" },
};

export const INVITATION_STATUS_PRESENTATION: Record<
  InvitationStatus,
  { label: string; tone: StatusTone }
> = {
  PENDING: { label: "Waiting", tone: "information" },
  ACCEPTED: { label: "Accepted", tone: "positive" },
  REVOKED: { label: "Revoked", tone: "neutral" },
  EXPIRED: { label: "Expired", tone: "warning" },
};

export const LICENCE_STATUS_PRESENTATION: Record<
  LicenceStatus,
  { label: string; tone: StatusTone; description: string }
> = {
  NONE: {
    label: "Not needed",
    tone: "neutral",
    description: "This person's roles do not include clinical work.",
  },
  MISSING: {
    label: "Missing",
    tone: "negative",
    description:
      "This person has clinical permissions but no practising licence on record.",
  },
  UNVERIFIED: {
    label: "Not checked",
    tone: "highlight",
    description:
      "A licence is on record but nobody has confirmed it with the regulator yet.",
  },
  VERIFIED: {
    label: "Verified",
    tone: "positive",
    description: "The licence was confirmed and is current.",
  },
  EXPIRING: {
    label: "Expiring soon",
    tone: "warning",
    description: "The licence expires within 30 days.",
  },
  EXPIRED: {
    label: "Expired",
    tone: "negative",
    description:
      "The licence has expired, so this person's clinical permissions are paused.",
  },
};

/** Status filters people can choose on the team list. */
export const STAFF_STATUS_FILTER_OPTIONS = [
  { value: "ACTIVE", label: "Active" },
  { value: "SUSPENDED", label: "Suspended" },
  { value: "REVOKED", label: "Removed" },
] as const;

export const LICENCE_BODY_OPTIONS = [
  { value: "MDCN", label: "Medical and Dental Council of Nigeria (MDCN)" },
  { value: "NMCN", label: "Nursing and Midwifery Council of Nigeria (NMCN)" },
  { value: "PCN", label: "Pharmacy Council of Nigeria (PCN)" },
  {
    value: "MLSCN",
    label: "Medical Laboratory Science Council of Nigeria (MLSCN)",
  },
  {
    value: "RRBN",
    label: "Radiographers Registration Board of Nigeria (RRBN)",
  },
  { value: "OTHER", label: "Another regulator" },
] as const;

export const LICENCE_VERIFICATION_METHOD_OPTIONS = [
  {
    value: "REGISTRY_CHECK",
    label: "Found on the regulator's register",
  },
  { value: "CERTIFICATE_SEEN", label: "Original certificate seen" },
] as const;

export const SPECIALTY_OPTIONS = [
  { value: "GENERAL_PRACTICE", label: "General practice" },
  { value: "FAMILY_MEDICINE", label: "Family medicine" },
  { value: "INTERNAL_MEDICINE", label: "Internal medicine" },
  { value: "PAEDIATRICS", label: "Paediatrics" },
  { value: "OBSTETRICS_GYNAECOLOGY", label: "Obstetrics and gynaecology" },
  { value: "GENERAL_SURGERY", label: "General surgery" },
  { value: "ORTHOPAEDICS", label: "Orthopaedics" },
  { value: "CARDIOLOGY", label: "Cardiology" },
  { value: "NEUROLOGY", label: "Neurology" },
  { value: "PSYCHIATRY", label: "Psychiatry" },
  { value: "OPHTHALMOLOGY", label: "Ophthalmology" },
  { value: "ENT", label: "Ear, nose and throat" },
  { value: "DERMATOLOGY", label: "Dermatology" },
  { value: "ANAESTHESIA", label: "Anaesthesia" },
  { value: "EMERGENCY_MEDICINE", label: "Emergency medicine" },
  { value: "RADIOLOGY", label: "Radiology" },
  { value: "PATHOLOGY", label: "Pathology" },
  { value: "COMMUNITY_MEDICINE", label: "Community medicine" },
  { value: "DENTISTRY", label: "Dentistry" },
  { value: "NURSING", label: "Nursing" },
  { value: "MIDWIFERY", label: "Midwifery" },
  { value: "PHARMACY", label: "Pharmacy" },
  { value: "LABORATORY_SCIENCE", label: "Laboratory science" },
  { value: "PHYSIOTHERAPY", label: "Physiotherapy" },
  { value: "NUTRITION", label: "Nutrition" },
  { value: "OTHER", label: "Other specialty" },
] as const;

export type SpecialtyCode = (typeof SPECIALTY_OPTIONS)[number]["value"];
export type LicenceBodyCode = (typeof LICENCE_BODY_OPTIONS)[number]["value"];
export type LicenceVerificationMethod =
  (typeof LICENCE_VERIFICATION_METHOD_OPTIONS)[number]["value"];

/**
 * Areas of the permission catalogue, in the order the role editor shows them.
 * A permission belongs to the area named before its colon.
 */
export const PERMISSION_AREAS = [
  { prefix: "org", label: "Organisation" },
  { prefix: "branch", label: "Branches" },
  { prefix: "staff", label: "Team" },
  { prefix: "role", label: "Roles" },
  { prefix: "partner", label: "Partners" },
  { prefix: "device", label: "Devices" },
  { prefix: "audit", label: "Audit log" },
  { prefix: "support", label: "Support" },
  { prefix: "subscription", label: "Subscription" },
  { prefix: "patient", label: "Patients" },
  { prefix: "schedule", label: "Schedule" },
  { prefix: "appointment", label: "Appointments" },
  { prefix: "queue", label: "Queue" },
  { prefix: "triage", label: "Triage" },
] as const;
