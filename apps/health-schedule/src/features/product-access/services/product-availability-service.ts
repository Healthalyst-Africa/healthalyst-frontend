import {
  PlatformApiError,
  toPlatformApiError,
} from "@healthalyst/platform-api/api-error";
import { HEALTH_SCHEDULE_ORGANIZATION_ENDPOINT } from "~/features/product-access/config/product-access";
import {
  healthScheduleOrganizationSchema,
  type HealthScheduleOrganization,
} from "~/features/product-access/schemas/health-schedule-organization-schema";
import { getHealthScheduleHttpClient } from "~/infrastructure/api/health-schedule-http-client";

export const PRODUCT_AVAILABILITY_QUERY_KEYS = {
  organization: (organizationId: string) =>
    ["health-schedule", "organization", organizationId] as const,
};

/** Asks HealthSchedule whether it is open to the signed-in organisation. */
export async function getHealthScheduleOrganization(): Promise<HealthScheduleOrganization> {
  try {
    const response = await getHealthScheduleHttpClient().get<unknown>(
      HEALTH_SCHEDULE_ORGANIZATION_ENDPOINT
    );
    const organization = healthScheduleOrganizationSchema.safeParse(
      response.data
    );
    if (!organization.success) {
      throw new PlatformApiError(
        "HealthSchedule sent a response we did not recognise. Try again.",
        "INVALID_HEALTH_SCHEDULE_RESPONSE",
        null,
        response.status,
        {},
        organization.error
      );
    }
    return organization.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not open HealthSchedule.");
  }
}
