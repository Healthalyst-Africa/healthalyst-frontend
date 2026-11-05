import type { z as schemaLibrary } from "zod";
import type {
  addPlatformStaffFormSchema,
  addedPlatformStaffMemberSchema,
  platformStaffMemberSchema,
  removeSuperAdminFormSchema,
} from "~/features/staff-management/schemas/staff-management-schemas";

export type PlatformStaffMember = schemaLibrary.infer<
  typeof platformStaffMemberSchema
>;

export type AddedPlatformStaffMember = schemaLibrary.infer<
  typeof addedPlatformStaffMemberSchema
>;

export type NewPlatformStaffMember = schemaLibrary.infer<
  typeof addPlatformStaffFormSchema
>;

export type SuperAdminRemoval = schemaLibrary.infer<
  typeof removeSuperAdminFormSchema
>;
