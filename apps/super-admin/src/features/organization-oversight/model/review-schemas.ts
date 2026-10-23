import { z } from "zod";

export const requestChangesSchema = z.object({
  field: z
    .string()
    .trim()
    .min(1, "Name the application field to update.")
    .max(100),
  message: z
    .string()
    .trim()
    .min(3, "Explain what the applicant needs to change.")
    .max(500),
});

export const approvalDecisionSchema = z.object({
  checklist: z.object({
    cacVerified: z.literal(
      true,
      "Confirm that the CAC certificate was checked."
    ),
    facilityLicenceVerified: z.literal(
      true,
      "Confirm that the facility licence was checked."
    ),
    directorLicenceVerified: z.literal(
      true,
      "Confirm that the director licence was checked."
    ),
    addressPlausible: z.literal(true, "Confirm that the address is plausible."),
    duplicateChecked: z.literal(
      true,
      "Confirm that duplicate records were checked."
    ),
  }),
  products: z
    .array(z.enum(["HEALTHSCHEDULE", "LABCONNECT", "PHARMADESK"]))
    .min(1, "Select at least one product to approve."),
  note: z.string().trim().max(2000),
});

export const rejectionDecisionSchema = z.object({
  reasonCode: z.enum([
    "INCOMPLETE_INFORMATION",
    "INVALID_DOCUMENTS",
    "UNVERIFIABLE_LICENCE",
    "DUPLICATE_ORGANIZATION",
    "OUT_OF_SERVICE_AREA",
    "NOT_A_HEALTH_FACILITY",
    "FRAUD_SUSPECTED",
    "OTHER",
  ]),
  message: z
    .string()
    .trim()
    .min(10, "Explain the reason for rejection in at least 10 characters.")
    .max(2000),
});
