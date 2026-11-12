import type { z as schemaLibrary } from "zod";
import type {
  organizationProductsFormSchema,
  organizationProductsResponseSchema,
  reviewChecklistSchema,
  productCodeSchema,
} from "~/features/organization-oversight/schemas/review-decision-schemas";

import type { REVIEW_REJECTION_REASONS } from "~/features/organization-oversight/config/review-configuration";

export type ReviewRejectionCode =
  (typeof REVIEW_REJECTION_REASONS)[number]["code"];

export type ReviewChecklist = schemaLibrary.infer<typeof reviewChecklistSchema>;
export type ProductCode = schemaLibrary.infer<typeof productCodeSchema>;

export type ReviewDecision =
  | {
      status: "CHANGES_REQUESTED";
      version: number;
      items: { field: string; message: string }[];
      message?: string;
    }
  | {
      status: "APPROVED";
      version: number;
      checklist: ReviewChecklist;
      products: ProductCode[];
      note?: string;
    }
  | {
      status: "REJECTED";
      version: number;
      reasonCode: ReviewRejectionCode;
      message: string;
    };

export type OrganizationProductsChange = schemaLibrary.infer<
  typeof organizationProductsFormSchema
>;

export type OrganizationProductsResult = schemaLibrary.infer<
  typeof organizationProductsResponseSchema
>;
