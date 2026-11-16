/**
 * Made-up patients for trying the front desk and queue boards without the
 * API. Only a development server can turn it on; production builds always
 * use the HealthSchedule API.
 */
export function isPatientFlowSampleDataEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" &&
    process.env.NEXT_PUBLIC_HEALTH_SCHEDULE_SAMPLE_DATA === "true"
  );
}

/** Sample responses wait a moment, like the API, so loading states show. */
export const SAMPLE_DATA_DELAY_MILLISECONDS = 350;
