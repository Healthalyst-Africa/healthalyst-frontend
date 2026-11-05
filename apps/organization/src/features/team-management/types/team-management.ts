import type { z } from "zod";
import type {
  LicenceBodyCode,
  LicenceVerificationMethod,
  SpecialtyCode,
} from "~/features/team-management/config/team-management";
import type {
  bulkInvitationResultSchema,
  invitationSchema,
  permissionListSchema,
  roleSchema,
  staffMemberSchema,
} from "~/features/team-management/schemas/team-response-schemas";

export type StaffMember = z.infer<typeof staffMemberSchema>;
export type StaffInvitation = z.infer<typeof invitationSchema>;
export type BulkInvitationResult = z.infer<
  typeof bulkInvitationResultSchema
>["data"][number];
export type TeamRole = z.infer<typeof roleSchema>;
export type TeamPermission = z.infer<
  typeof permissionListSchema
>["data"][number];

export type StaffPage = {
  members: StaffMember[];
  nextCursor: string | null;
};

export type StaffListFilters = {
  status?: StaffMember["status"];
  branchId?: string;
  searchText?: string;
};

export type StaffLicenceRequest = {
  body: LicenceBodyCode;
  number: string;
  expiresOn: string;
};

/** The body of `POST /v1/staff/invitations`. */
export type StaffInvitationRequest = {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  roleIds: string[];
  allBranches: boolean;
  branchIds: string[];
  departmentIds: string[];
  jobTitle?: string;
  specialty?: SpecialtyCode;
  licence?: StaffLicenceRequest;
  accessEndsOn?: string;
};

/** The body of `PATCH /v1/staff/{membershipId}`: only fields that change. */
export type StaffMemberChanges = {
  roleIds?: string[];
  allBranches?: boolean;
  branchIds?: string[];
  departmentIds?: string[];
  jobTitle?: string | null;
  specialty?: SpecialtyCode | null;
  accessEndsOn?: string | null;
  licence?: StaffLicenceRequest | null;
  approvalLimits?: {
    waiverKobo?: number | null;
    billToFolderKobo?: number | null;
    discountPercent?: number | null;
  };
};

export type LicenceVerificationRequest = {
  method: LicenceVerificationMethod;
  reference?: string;
};

export type TeamRoleRequest = { name: string; permissions: string[] };
