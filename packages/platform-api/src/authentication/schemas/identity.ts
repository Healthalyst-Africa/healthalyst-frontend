import { z } from "zod";

// The Platform API uses "*" for access to all branches.
const branchScopeSchema = z.array(z.string());

export const authenticationContextSchema = z.object({
  realm: z.enum(["TENANT", "PLATFORM"]),
  organizationId: z.string().uuid().nullable(),
  branchId: z.string().uuid().nullable().optional(),
  organizationStatus: z.string().nullable().optional(),
  roles: z.array(z.string()).optional(),
  permissions: z.array(z.string()).optional(),
  branchIds: branchScopeSchema.optional(),
});

export const platformUserSchema = z.object({
  id: z.string().uuid(),
  firstName: z.string(),
  lastName: z.string(),
  email: z.string().nullable(),
  emailVerifiedAt: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  phoneVerifiedAt: z.string().nullable().optional(),
  mfa: z.object({ totp: z.boolean() }),
});

export const membershipSchema = z.object({
  membershipId: z.string().uuid(),
  organization: z.object({
    id: z.string().uuid(),
    name: z.string(),
    status: z.string(),
    type: z.string().nullable(),
  }),
  roles: z.array(z.string()),
  products: z.array(z.string()),
});

export const sessionSchema = z.object({
  tokenType: z.literal("Bearer").optional(),
  expiresIn: z.number().int().optional(),
  activeContext: authenticationContextSchema,
  user: platformUserSchema,
  memberships: z.array(membershipSchema),
  platformRoles: z.array(z.string()),
});

export const tokenResponseSchema = z.object({
  tokenType: z.literal("Bearer"),
  expiresIn: z.number().int(),
  activeContext: authenticationContextSchema,
});

export const meResponseSchema = z.object({
  user: platformUserSchema.extend({
    emailVerifiedAt: z.string().nullable(),
    phone: z.string().nullable(),
    phoneVerifiedAt: z.string().nullable(),
  }),
  memberships: z.array(membershipSchema),
  platformRoles: z.array(z.string()),
  activeContext: authenticationContextSchema.extend({
    organizationStatus: z.string().nullable(),
    roles: z.array(z.string()),
    permissions: z.array(z.string()),
    branchIds: branchScopeSchema,
  }),
});
