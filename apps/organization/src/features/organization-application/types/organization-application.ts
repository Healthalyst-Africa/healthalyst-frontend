import type { z } from "zod";
import type { documentTypeSchema } from "~/shared/organization/schemas/organization-values-schema";
import type {
  organizationApplicationSchema,
  applicationPatchSchema,
  documentUploadRequestSchema,
  documentSummarySchema,
  uploadUrlResponseSchema,
  statusChangeResponseSchema,
} from "~/features/organization-application/schemas/organization-application-schema";
export type OrganizationDocumentType = z.infer<typeof documentTypeSchema>;
export type OrganizationApplication = z.infer<
  typeof organizationApplicationSchema
> & { entityTag: string | null };
export type OrganizationApplicationChanges = z.input<
  typeof applicationPatchSchema
>;
export type OrganizationDocumentUploadRequest = z.infer<
  typeof documentUploadRequestSchema
>;
export type OrganizationDocument = z.infer<typeof documentSummarySchema>;
export type OrganizationDocumentUpload = z.infer<
  typeof uploadUrlResponseSchema
>;
export type OrganizationApplicationStatusChange = z.infer<
  typeof statusChangeResponseSchema
>;
export type OrganizationDocumentFileSubmission = {
  type: OrganizationDocumentType;
  documentFile: File;
  expiresOn?: string;
};
