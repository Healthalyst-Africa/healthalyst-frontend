import { z as schemaLibrary } from "zod";
import {
  REVIEW_PRODUCT_CODES,
  REVIEW_VALIDATION_LIMITS,
} from "~/features/organization-oversight/config/review-configuration";

export const reviewChecklistSchema = schemaLibrary.object({
  cacVerified: schemaLibrary.literal(
    true,
    "Confirm that the CAC certificate was checked."
  ),
  facilityLicenceVerified: schemaLibrary.literal(
    true,
    "Confirm that the facility licence was checked."
  ),
  directorLicenceVerified: schemaLibrary.literal(
    true,
    "Confirm that the director licence was checked."
  ),
  addressPlausible: schemaLibrary.literal(
    true,
    "Confirm that the address is plausible."
  ),
  duplicateChecked: schemaLibrary.literal(
    true,
    "Confirm that duplicate records were checked."
  ),
});

export const productCodeSchema = schemaLibrary.enum(REVIEW_PRODUCT_CODES);

export const approvalBodySchema = schemaLibrary.object({
  checklist: reviewChecklistSchema,
  products: schemaLibrary.array(productCodeSchema).min(1),
  note: schemaLibrary
    .string()
    .max(REVIEW_VALIDATION_LIMITS.noteMaximumLength)
    .optional(),
});
