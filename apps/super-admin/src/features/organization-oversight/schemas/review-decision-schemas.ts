import { z as schemaLibrary } from "zod";
import { ORGANIZATION_PRODUCT_CHANGE } from "~/features/organization-oversight/config/organization-products";
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

export const organizationProductsFormSchema = schemaLibrary.object({
  products: schemaLibrary
    .array(productCodeSchema)
    .min(
      1,
      "Choose at least one product. To stop every product, suspend the organisation."
    ),
  reason: schemaLibrary
    .string()
    .trim()
    .min(
      ORGANIZATION_PRODUCT_CHANGE.reasonMinimumLength,
      `Give a reason of at least ${ORGANIZATION_PRODUCT_CHANGE.reasonMinimumLength} characters.`
    )
    .max(
      ORGANIZATION_PRODUCT_CHANGE.reasonMaximumLength,
      `Keep the reason to ${ORGANIZATION_PRODUCT_CHANGE.reasonMaximumLength} characters or fewer.`
    ),
});

/** `PUT /v1/admin/organizations/{id}/products` */
export const organizationProductsResponseSchema = schemaLibrary.object({
  id: schemaLibrary.uuid(),
  products: schemaLibrary.array(
    schemaLibrary.object({
      code: schemaLibrary.string(),
      status: schemaLibrary.string(),
    })
  ),
  activated: schemaLibrary.array(schemaLibrary.string()),
  suspended: schemaLibrary.array(schemaLibrary.string()),
});
