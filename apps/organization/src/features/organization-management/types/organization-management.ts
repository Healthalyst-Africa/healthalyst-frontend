import type { z } from "zod";
import type {
  organizationProfileSchema,
  branchSchema,
  departmentSchema,
  branchCapabilitySchema,
  organizationPatchSchema,
  branchPatchSchema,
  departmentPatchSchema,
} from "~/features/organization-management/schemas/organization-management-schema";
export type PlatformOrganizationProfile = z.infer<
  typeof organizationProfileSchema
> & { entityTag: string };
export type PlatformBranch = z.infer<typeof branchSchema>;
export type PlatformDepartment = z.infer<typeof departmentSchema>;
export type PlatformBranchCapability = z.infer<typeof branchCapabilitySchema>;
export type OrganizationProfileChanges = z.input<
  typeof organizationPatchSchema
>;
export type OrganizationBranchChanges = z.input<typeof branchPatchSchema>;
export type OrganizationDepartmentChanges = z.input<
  typeof departmentPatchSchema
>;
export type OrganizationBranchCreation = { name: string; slug?: string };
export type OrganizationDepartmentCreation = { name: string; code: string };
