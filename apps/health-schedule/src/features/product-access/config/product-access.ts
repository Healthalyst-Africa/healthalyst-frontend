/** The Platform API's product code for HealthSchedule entitlements. */
export const HEALTH_SCHEDULE_PRODUCT_CODE = "HEALTHSCHEDULE";

/** The Platform API's name for an approved organisation. */
export const APPROVED_ORGANIZATION_STATUS = "ACTIVE";

/** Statuses where the organisation still has work to do on its application. */
export const APPLICATION_IN_PROGRESS_STATUSES = [
  "DRAFT",
  "CHANGES_REQUESTED",
] as const;

/** Statuses where HealthAlyst is checking the application. */
export const APPLICATION_IN_REVIEW_STATUSES = [
  "PENDING_VERIFICATION",
  "UNDER_REVIEW",
] as const;

/** HealthSchedule's own check that the product is open to the organisation. */
export const HEALTH_SCHEDULE_ORGANIZATION_ENDPOINT = "/v1/organization";

/**
 * HealthSchedule refuses these when the organisation has the product but the
 * approval has not reached HealthSchedule yet, which usually takes under a
 * minute.
 */
export const PRODUCT_SETUP_PENDING_ERRORS = [
  "PRODUCT_NOT_ENABLED",
  "AUTH_TOKEN_INVALID",
] as const;

/** HealthSchedule refuses these while the organisation cannot use products. */
export const ORGANIZATION_UNAVAILABLE_ERRORS = [
  "ORG_NOT_APPROVED",
  "ORG_SUSPENDED",
  "ORG_DEACTIVATED",
] as const;
