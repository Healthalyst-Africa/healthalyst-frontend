import type { PlatformProfile, PlatformSession } from "../types/authentication";
import { getPlatformHttpClient } from "../../browser/http-client";
import { AUTHENTICATION_ENDPOINTS } from "../config/authentication-requests";
import { meResponseSchema, sessionSchema } from "../schemas/identity";
import {
  PlatformApiError,
  toPlatformApiError,
} from "../../browser/errors/index";
import { UNEXPECTED_RESPONSE_MESSAGE } from "../errors/authentication-errors";

/** `GET /v1/me` restores the signed-in identity through the same-origin server. */
export async function getCurrentPlatformProfile(): Promise<PlatformProfile> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      AUTHENTICATION_ENDPOINTS.profile
    );
    const profile = meResponseSchema.safeParse(response.data);
    if (!profile.success) {
      throw new PlatformApiError(
        UNEXPECTED_RESPONSE_MESSAGE,
        "INVALID_PLATFORM_RESPONSE",
        null,
        response.status,
        {},
        profile.error
      );
    }
    return profile.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not restore your sign-in.");
  }
}

/** Restore identity and active organisation context from the server session. */
export async function restorePlatformSession(): Promise<PlatformSession> {
  try {
    const response = await getCurrentPlatformProfile();
    const session = sessionSchema.safeParse(response);
    if (!session.success) throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    return session.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not restore your sign-in.");
  }
}
