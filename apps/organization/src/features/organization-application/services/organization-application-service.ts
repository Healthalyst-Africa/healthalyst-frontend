import { getPlatformHttpClient } from "@healthalyst/platform-api/http-client";
import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  organizationApplicationSchema,
  applicationPatchSchema,
  statusChangeResponseSchema,
} from "~/features/organization-application/schemas/organization-application-schema";
import type {
  OrganizationApplication,
  OrganizationApplicationChanges,
  OrganizationApplicationStatusChange,
} from "~/features/organization-application/types/organization-application";

import {
  ORGANIZATION_APPLICATION_ENDPOINTS,
  ORGANIZATION_APPLICATION_FIELD_NAMES_BY_PATH,
} from "~/features/organization-application/config/organization-application";

function readApplicationEntityTag(
  responseEntityTag: string | undefined,
  applicationVersion: number
): string {
  return responseEntityTag ?? String(applicationVersion);
}

/** `GET /v1/onboarding/application` for the active organisation context. */
export async function getOrganizationApplication(): Promise<OrganizationApplication> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      ORGANIZATION_APPLICATION_ENDPOINTS.application
    );
    const application = organizationApplicationSchema.safeParse(response.data);
    if (!application.success) {
      throw new Error(
        "We received an unexpected application response from HealthAlyst. Contact HealthAlyst for help."
      );
    }
    return {
      ...application.data,
      entityTag: readApplicationEntityTag(
        response.headers.etag,
        application.data.version
      ),
    };
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not load your organisation application. Try again shortly."
    );
  }
}

/** Save editable application fields using the current `If-Match` version. */
export async function updateOrganizationApplication(
  entityTag: string,
  applicationChanges: OrganizationApplicationChanges
): Promise<OrganizationApplication> {
  const validatedChanges = applicationPatchSchema.safeParse(applicationChanges);
  if (!validatedChanges.success) {
    throw new Error(
      validatedChanges.error.issues[0]?.message ??
        "Check the application details and try again."
    );
  }

  try {
    const response = await getPlatformHttpClient().patch<unknown>(
      ORGANIZATION_APPLICATION_ENDPOINTS.application,
      validatedChanges.data,
      {
        headers: { "If-Match": entityTag },
      }
    );
    const application = organizationApplicationSchema.safeParse(response.data);
    if (!application.success) {
      throw new Error(
        "We received an unexpected application response from HealthAlyst. Contact HealthAlyst for help."
      );
    }
    return {
      ...application.data,
      entityTag: readApplicationEntityTag(
        response.headers.etag,
        application.data.version
      ),
    };
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not save your organisation application. Try again.",
      ORGANIZATION_APPLICATION_FIELD_NAMES_BY_PATH
    );
  }
}

/** Submit a complete application for review with its current version. */
export async function submitOrganizationApplication(
  entityTag: string
): Promise<OrganizationApplicationStatusChange> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      ORGANIZATION_APPLICATION_ENDPOINTS.submit,
      undefined,
      { headers: { "If-Match": entityTag } }
    );
    const statusChange = statusChangeResponseSchema.safeParse(response.data);
    if (!statusChange.success) {
      throw new Error(
        "We received an unexpected submission response from HealthAlyst. Contact HealthAlyst for help."
      );
    }
    return statusChange.data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not submit your application. Check the checklist and try again."
    );
  }
}
