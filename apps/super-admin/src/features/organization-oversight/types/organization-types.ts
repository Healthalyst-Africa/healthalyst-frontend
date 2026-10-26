import type { z as schemaLibrary } from "zod";
import type {
  organizationApplicationSchema,
  organizationDetailSchema,
  organizationStatusSchema,
  organizationDocumentSchema,
} from "~/features/organization-oversight/schemas/organization-schemas";

export type OrganizationApplication = schemaLibrary.infer<
  typeof organizationApplicationSchema
>;
export type OrganizationDetail = schemaLibrary.infer<
  typeof organizationDetailSchema
>;
export type RegistrationStatus = schemaLibrary.infer<
  typeof organizationStatusSchema
>;
export type OrganizationDocument = schemaLibrary.infer<
  typeof organizationDocumentSchema
>;
