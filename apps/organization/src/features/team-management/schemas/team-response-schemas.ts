import { z } from "zod";
import {
  LICENCE_BODY_OPTIONS,
  LICENCE_VERIFICATION_METHOD_OPTIONS,
  SPECIALTY_OPTIONS,
} from "~/features/team-management/config/team-management";

function optionValues<Option extends { value: string }>(
  options: readonly Option[]
) {
  return options.map((option) => option.value) as [
    Option["value"],
    ...Option["value"][],
  ];
}

const roleReferenceSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
});

export const specialtySchema = z.enum(optionValues(SPECIALTY_OPTIONS));
export const licenceBodySchema = z.enum(optionValues(LICENCE_BODY_OPTIONS));
export const licenceVerificationMethodSchema = z.enum(
  optionValues(LICENCE_VERIFICATION_METHOD_OPTIONS)
);

const licenceSchema = z.object({
  body: licenceBodySchema,
  number: z.string(),
  expiresOn: z.string(),
  verifiedAt: z.string().nullable(),
  verificationMethod: licenceVerificationMethodSchema.nullable(),
  verificationReference: z.string().nullable(),
});

const approvalLimitsSchema = z.object({
  waiverKobo: z.number().int().nullable(),
  billToFolderKobo: z.number().int().nullable(),
  discountPercent: z.number().int().nullable(),
});

export const staffMemberSchema = z.object({
  membershipId: z.string().uuid(),
  userId: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  status: z.enum(["INVITED", "ACTIVE", "SUSPENDED", "REVOKED"]),
  roles: z.array(roleReferenceSchema),
  allBranches: z.boolean(),
  branchIds: z.array(z.string().uuid()),
  departmentIds: z.array(z.string().uuid()),
  jobTitle: z.string().nullable(),
  specialty: specialtySchema.nullable(),
  accessEndsOn: z.string().nullable(),
  licence: licenceSchema.nullable(),
  licenceStatus: z.enum([
    "NONE",
    "MISSING",
    "UNVERIFIED",
    "VERIFIED",
    "EXPIRING",
    "EXPIRED",
  ]),
  approvalLimits: approvalLimitsSchema,
  lastLoginAt: z.string().nullable(),
  createdAt: z.string(),
});

export const staffListSchema = z.object({
  data: z.array(staffMemberSchema),
  page: z.object({
    nextCursor: z.string().nullable(),
    hasMore: z.boolean(),
  }),
});

export const invitationSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  status: z.enum(["PENDING", "ACCEPTED", "REVOKED", "EXPIRED"]),
  roles: z.array(roleReferenceSchema),
  allBranches: z.boolean(),
  branchIds: z.array(z.string().uuid()),
  departmentIds: z.array(z.string().uuid()),
  expiresAt: z.string(),
  sendCount: z.number().int(),
  createdAt: z.string(),
});

export const invitationListSchema = z.object({
  data: z.array(invitationSchema),
});

export const bulkInvitationResultSchema = z.object({
  data: z.array(
    z.object({
      index: z.number().int(),
      status: z.enum(["CREATED", "FAILED"]),
      invitationId: z.string().uuid().optional(),
      error: z.object({ code: z.string(), message: z.string() }).optional(),
    })
  ),
});

export const roleSchema = z.object({
  id: z.string().uuid(),
  code: z.string(),
  name: z.string(),
  isPreset: z.boolean(),
  permissions: z.array(z.string()),
  memberCount: z.number().int(),
});

export const roleListSchema = z.object({ data: z.array(roleSchema) });

export const permissionListSchema = z.object({
  data: z.array(z.object({ code: z.string(), description: z.string() })),
});
