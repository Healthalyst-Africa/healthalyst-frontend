import { getPlatformHttpClient } from "@healthalyst/platform-api/http-client";
import { PUBLIC_PLATFORM_REQUEST } from "@healthalyst/platform-api/config";
import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { LOCAL_GOVERNMENT_AREA_CONFIGURATION } from "~/shared/organization/config/local-government-areas";
import { localGovernmentAreasResponseSchema } from "~/shared/organization/schemas/local-government-areas-schema";

/** The local government areas of one state, with their official spelling. */
export async function getLocalGovernmentAreas(
  stateCode: string
): Promise<string[]> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      LOCAL_GOVERNMENT_AREA_CONFIGURATION.endpoint(stateCode),
      PUBLIC_PLATFORM_REQUEST
    );
    const localGovernmentAreas = localGovernmentAreasResponseSchema.safeParse(
      response.data
    );
    if (!localGovernmentAreas.success) {
      throw new Error(
        "We received an unexpected response from HealthAlyst. Try again shortly."
      );
    }
    return localGovernmentAreas.data.data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not load the local government areas. Try again shortly."
    );
  }
}
