import { z as schemaLibrary } from "zod";

// The Platform API uses "*" for access to all branches.
const branchScopeSchema = schemaLibrary.array(schemaLibrary.string());

export const authenticationContextSchema = schemaLibrary.object({
  realm: schemaLibrary.enum(["TENANT", "PLATFORM"]),
  organizationId: schemaLibrary.string().uuid().nullable(),
  branchId: schemaLibrary.string().uuid().nullable().optional(),
  organizationStatus: schemaLibrary.string().nullable().optional(),
  roles: schemaLibrary.array(schemaLibrary.string()).optional(),
  permissions: schemaLibrary.array(schemaLibrary.string()).optional(),
  branchIds: branchScopeSchema.optional(),
});

export const platformUserSchema = schemaLibrary.object({
  id: schemaLibrary.string().uuid(),
  firstName: schemaLibrary.string(),
  lastName: schemaLibrary.string(),
  email: schemaLibrary.string().nullable(),
  emailVerifiedAt: schemaLibrary.string().nullable().optional(),
  phone: schemaLibrary.string().nullable().optional(),
  phoneVerifiedAt: schemaLibrary.string().nullable().optional(),
  mfa: schemaLibrary.object({ totp: schemaLibrary.boolean() }),
});

export const membershipSchema = schemaLibrary.object({
  membershipId: schemaLibrary.string().uuid(),
  organization: schemaLibrary.object({
    id: schemaLibrary.string().uuid(),
    name: schemaLibrary.string(),
    status: schemaLibrary.string(),
    type: schemaLibrary.string().nullable(),
  }),
  roles: schemaLibrary.array(schemaLibrary.string()),
  products: schemaLibrary.array(schemaLibrary.string()),
});

export const sessionSchema = schemaLibrary.object({
  tokenType: schemaLibrary.literal("Bearer").optional(),
  expiresIn: schemaLibrary.number().int().optional(),
  activeContext: authenticationContextSchema,
  user: platformUserSchema,
  memberships: schemaLibrary.array(membershipSchema),
  platformRoles: schemaLibrary.array(schemaLibrary.string()),
});

export const tokenResponseSchema = schemaLibrary.object({
  accessToken: schemaLibrary.string().min(1),
  tokenType: schemaLibrary.literal("Bearer"),
  expiresIn: schemaLibrary.number().int().positive(),
  activeContext: authenticationContextSchema,
});

export const sessionResponseSchema = sessionSchema.extend(
  tokenResponseSchema.shape
);

export const meResponseSchema = schemaLibrary.object({
  user: platformUserSchema.extend({
    emailVerifiedAt: schemaLibrary.string().nullable(),
    phone: schemaLibrary.string().nullable(),
    phoneVerifiedAt: schemaLibrary.string().nullable(),
  }),
  memberships: schemaLibrary.array(membershipSchema),
  platformRoles: schemaLibrary.array(schemaLibrary.string()),
  activeContext: authenticationContextSchema.extend({
    organizationStatus: schemaLibrary.string().nullable(),
    roles: schemaLibrary.array(schemaLibrary.string()),
    permissions: schemaLibrary.array(schemaLibrary.string()),
    branchIds: branchScopeSchema,
  }),
});
