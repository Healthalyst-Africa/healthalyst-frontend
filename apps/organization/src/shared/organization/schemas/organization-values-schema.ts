import { z } from "zod";
import { organizationTypeOptions } from "~/shared/organization/config/organization-reference";

export const organizationTypeSchema = z.enum(
  organizationTypeOptions.map((organizationType) => organizationType.value)
);

export const organizationStatusSchema = z.enum([
  "DRAFT",
  "PENDING_VERIFICATION",
  "UNDER_REVIEW",
  "CHANGES_REQUESTED",
  "ACTIVE",
  "SUSPENDED",
  "REJECTED",
  "DEACTIVATED",
]);

export const documentTypeSchema = z.enum([
  "CAC_CERTIFICATE",
  "FACILITY_LICENCE",
  "MEDICAL_DIRECTOR_LICENCE",
  "MLSCN_LICENCE",
  "PCN_PREMISES_LICENCE",
  "NHIA_ACCREDITATION",
  "PROOF_OF_ADDRESS",
  "OTHER",
]);
