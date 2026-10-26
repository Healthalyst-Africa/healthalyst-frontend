import {
  ORGANIZATION_FIELD_LIMITS,
  INTERNATIONAL_PHONE_PATTERN,
} from "~/shared/organization/config/organization-validation";
import { z } from "zod";
import { nigerianStateOptions } from "~/shared/organization/config/organization-reference";
import {
  organizationStatusSchema,
  organizationTypeSchema,
} from "~/shared/organization/schemas/organization-values-schema";

export const organizationProfileSchema = z.object({
  id: z.string().uuid(),
  status: organizationStatusSchema,
  version: z.number().int(),
  legalName: z.string(),
  tradingName: z.string(),
  type: organizationTypeSchema.nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  addressLine: z.string().nullable(),
  city: z.string().nullable(),
  stateCode: z.string().nullable(),
  lga: z.string().nullable(),
  cacNumber: z.string().nullable(),
  facilityLicenceNo: z.string().nullable(),
  directoryListed: z.boolean(),
});

export const branchCapabilitySchema = z.object({
  category: z.enum([
    "CONSULTATION",
    "LABORATORY",
    "PHARMACY",
    "RADIOLOGY",
    "EMERGENCY",
    "SURGERY",
    "OTHER",
  ]),
  isEnabled: z.boolean(),
  acceptsExternalReferrals: z.boolean(),
});

export const departmentSchema = z.object({
  id: z.string().uuid(),
  branchId: z.string().uuid(),
  name: z.string(),
  code: z.string(),
  isActive: z.boolean(),
});

export const branchSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  isActive: z.boolean(),
  departments: z.array(departmentSchema),
  capabilities: z.array(branchCapabilitySchema),
});

export const branchListSchema = z.object({ data: z.array(branchSchema) });

export const departmentPatchSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((changes) => Object.keys(changes).length > 0, {
    message: "Update at least one department field.",
  });

export const branchPatchSchema = z
  .object({
    name: z.string().min(1).max(120).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((changes) => Object.keys(changes).length > 0, {
    message: "Update at least one branch field.",
  });

export const organizationPatchSchema = z
  .object({
    tradingName: z
      .string()
      .min(1)
      .max(ORGANIZATION_FIELD_LIMITS.name)
      .optional(),
    email: z
      .string()
      .email()
      .max(ORGANIZATION_FIELD_LIMITS.emailAddress)
      .optional(),
    phone: z.string().regex(INTERNATIONAL_PHONE_PATTERN).optional(),
    addressLine: z
      .string()
      .min(1)
      .max(ORGANIZATION_FIELD_LIMITS.addressLine)
      .optional(),
    city: z.string().min(1).max(ORGANIZATION_FIELD_LIMITS.city).optional(),
    stateCode: z
      .string()
      .refine(
        (stateCode) =>
          nigerianStateOptions.some(
            (stateOption) => stateOption.value === stateCode
          ),
        "Select a valid Nigerian state."
      )
      .optional(),
    lga: z
      .string()
      .min(1)
      .max(ORGANIZATION_FIELD_LIMITS.localGovernmentArea)
      .nullable()
      .optional(),
    directoryListed: z.boolean().optional(),
  })
  .refine((changes) => Object.keys(changes).length > 0, {
    message: "Update at least one organisation field.",
  });

export const branchCapabilitiesSchema = z.array(branchCapabilitySchema).max(7);
