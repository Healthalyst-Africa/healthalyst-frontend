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
