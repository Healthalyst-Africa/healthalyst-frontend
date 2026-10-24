import type { ReviewApplicationProperties } from "~/features/organization-oversight/types/review-controller";

export type OrganizationDetailsProperties = ReviewApplicationProperties & {
  canReview: boolean;
};
export type DocumentViewLinks = Record<
  string,
  { url: string; expiresAt: number }
>;
export type ReadableProfileField = { label: string; value: string };
