import { z as schemaLibrary } from "zod";

import {
  productCodeSchema,
  reviewChecklistSchema,
} from "~/features/organization-oversight/schemas/review-decision-schemas";
import {
  REVIEW_REJECTION_CODES,
  REVIEW_VALIDATION_LIMITS,
} from "~/features/organization-oversight/config/review-configuration";

export const requestChangesSchema = schemaLibrary.object({
  field: schemaLibrary
    .string()
    .trim()
    .min(1, "Name the application field to update.")
    .max(REVIEW_VALIDATION_LIMITS.changeFieldMaximumLength),
  message: schemaLibrary
    .string()
    .trim()
    .min(
      REVIEW_VALIDATION_LIMITS.changeMessageMinimumLength,
      "Explain what the applicant needs to change."
    )
    .max(REVIEW_VALIDATION_LIMITS.changeMessageMaximumLength),
});

export const approvalDecisionSchema = schemaLibrary.object({
  checklist: reviewChecklistSchema,
  products: schemaLibrary
    .array(productCodeSchema)
    .min(1, "Select at least one product to approve."),
  note: schemaLibrary
    .string()
    .trim()
    .max(REVIEW_VALIDATION_LIMITS.noteMaximumLength),
});

export const rejectionDecisionSchema = schemaLibrary.object({
  reasonCode: schemaLibrary.enum(REVIEW_REJECTION_CODES),
  message: schemaLibrary
    .string()
    .trim()
    .min(
      REVIEW_VALIDATION_LIMITS.rejectionMessageMinimumLength,
      "Explain the reason for rejection in at least 10 characters."
    )
    .max(REVIEW_VALIDATION_LIMITS.noteMaximumLength),
});
