import { getPlatformHttpClient } from "@healthalyst/platform-api/http-client";
import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  policyVersionsSchema,
  organizationTypesResponseSchema,
  nigerianStatesResponseSchema,
  registrationResponseSchema,
} from "~/features/organization-registration/schemas/platform-registration-schema";
import type {
  PolicyVersions,
  PlatformOrganizationTypeReference,
  PlatformNigerianState,
  PlatformRegistrationResponse,
  PlatformRegistrationRequest,
  PlatformRegistrationSubmission,
} from "~/features/organization-registration/types/platform-registration";

import {
  REGISTRATION_FIELD_NAMES_BY_PATH,
  REGISTRATION_ENDPOINTS,
  UNEXPECTED_RESPONSE_MESSAGE,
} from "~/features/organization-registration/config/platform-registration";

/** `GET /v1/reference/policies`: the policy versions a registration must accept. */
export async function getPolicyVersions(): Promise<PolicyVersions> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      REGISTRATION_ENDPOINTS.policies
    );
    const policyVersions = policyVersionsSchema.safeParse(response.data);
    if (!policyVersions.success) {
      throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    }
    return policyVersions.data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not load the current terms and policies. Try again shortly."
    );
  }
}

/** `GET /v1/reference/organization-types` for onboarding document rules. */
export async function getPlatformOrganizationTypes(): Promise<
  PlatformOrganizationTypeReference[]
> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      REGISTRATION_ENDPOINTS.organizationTypes
    );
    const organizationTypes = organizationTypesResponseSchema.safeParse(
      response.data
    );
    if (!organizationTypes.success) {
      throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    }
    return organizationTypes.data.data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not load the organisation types. Try again shortly."
    );
  }
}

/** `GET /v1/reference/states` for current Nigerian state codes and names. */
export async function getPlatformNigerianStates(): Promise<
  PlatformNigerianState[]
> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      REGISTRATION_ENDPOINTS.states
    );
    const states = nigerianStatesResponseSchema.safeParse(response.data);
    if (!states.success) throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    return states.data.data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not load the list of Nigerian states. Try again shortly."
    );
  }
}

/**
 * Registers an organisation and its administrator with the Platform API. It
 * reads the current policy versions first, because the registration must name
 * the versions the administrator accepted.
 *
 * The API always answers `202 PENDING_EMAIL_VERIFICATION` and never reveals
 * whether an account already exists.
 */
export async function registerOrganizationOnPlatform(
  registrationSubmission: PlatformRegistrationSubmission
): Promise<PlatformRegistrationResponse> {
  const policies = await getPolicyVersions();
  const registrationRequest: PlatformRegistrationRequest = {
    ...registrationSubmission,
    policies,
  };

  try {
    const response = await getPlatformHttpClient().post<unknown>(
      REGISTRATION_ENDPOINTS.registrations,
      registrationRequest
    );
    const registrationResponse = registrationResponseSchema.safeParse(
      response.data
    );
    if (!registrationResponse.success) {
      throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    }
    return registrationResponse.data;
  } catch (error) {
    throw toPlatformApiError(
      error,
      "We could not submit the application. Try again shortly.",
      REGISTRATION_FIELD_NAMES_BY_PATH
    );
  }
}
