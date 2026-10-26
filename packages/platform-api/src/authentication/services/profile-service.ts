import type { PlatformProfile, PlatformSession } from "../types/authentication";
import {
  getPlatformClient,
  getPlatformHttpClient,
} from "../../browser/http-client";
import { AUTHENTICATION_ENDPOINTS } from "../config/authentication-requests";
import { meResponseSchema, sessionSchema } from "../schemas/identity";
import {
  PlatformApiError,
  toPlatformApiError,
} from "../../browser/errors/index";
import { UNEXPECTED_RESPONSE_MESSAGE } from "../errors/authentication-errors";

/** `GET /v1/me` restores identity after the transport renews its missing or expired token. */
export async function getCurrentPlatformProfile(): Promise<PlatformProfile> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      AUTHENTICATION_ENDPOINTS.profile
    );
    if (
      response.config?.platformIdentityEpoch !== undefined &&
      response.config.platformIdentityEpoch !==
        getPlatformClient().getIdentityEpoch()
    ) {
      throw new PlatformApiError(
        "Your sign-in changed while the profile was loading. Try again.",
        "AUTH_SESSION_CHANGED",
        null,
        409,
        {},
        undefined
      );
    }
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

let pendingRestoration: Promise<PlatformSession> | null = null;
let restorationIdentityEpoch = -1;

/** Restore once for concurrent consumers; no access token is returned to React state. */
export function restorePlatformSession(): Promise<PlatformSession> {
  getPlatformClient().beginSessionRestoration();
  const currentIdentityEpoch = getPlatformClient().getIdentityEpoch();
  if (pendingRestoration && restorationIdentityEpoch === currentIdentityEpoch)
    return pendingRestoration;
  const restoration = loadPlatformSession();
  pendingRestoration = restoration;
  restorationIdentityEpoch = currentIdentityEpoch;
  void restoration
    .finally(() => {
      if (pendingRestoration === restoration) pendingRestoration = null;
    })
    .catch(() => undefined);
  return restoration;
}

async function loadPlatformSession(): Promise<PlatformSession> {
  try {
    const response = await getCurrentPlatformProfile();
    const session = sessionSchema.safeParse({
      ...response,
      activeContext: {
        ...getPlatformClient().getActiveContext(),
        ...response.activeContext,
      },
    });
    if (!session.success) throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    return session.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not restore your sign-in.");
  }
}
