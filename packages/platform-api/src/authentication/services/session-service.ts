import { getPlatformHttpClient } from "../../browser/http-client";
import {
  AUTHENTICATION_ENDPOINTS,
  BODYLESS_POST_HEADERS,
} from "../config/authentication-requests";
import { toPlatformApiError } from "../../browser/errors/index";
import type { PlatformSessionList } from "../types/authentication";
import { sessionListSchema } from "../schemas/sessions";
import { UNEXPECTED_RESPONSE_MESSAGE } from "../errors/authentication-errors";

/** End the current Platform API session through the backend-for-frontend. */
export async function signOut(): Promise<void> {
  try {
    await getPlatformHttpClient().post(
      AUTHENTICATION_ENDPOINTS.signOut,
      undefined,
      {
        headers: BODYLESS_POST_HEADERS,
      }
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not sign you out. Try again.");
  }
}

/** End every active Platform API session for the signed-in user. */
export async function signOutAllSessions(): Promise<void> {
  try {
    await getPlatformHttpClient().post(
      AUTHENTICATION_ENDPOINTS.signOutAll,
      undefined,
      {
        headers: BODYLESS_POST_HEADERS,
      }
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not sign out all sessions.");
  }
}

/** `GET /v1/auth/sessions`: list sessions belonging to the signed-in user. */
export async function getPlatformSessions(): Promise<PlatformSessionList> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      AUTHENTICATION_ENDPOINTS.sessions
    );
    const sessions = sessionListSchema.safeParse(response.data);
    if (!sessions.success) throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    return sessions.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not load your active sessions.");
  }
}

/** `DELETE /v1/auth/sessions/{id}`: end one of the user's sessions. */
export async function revokePlatformSession(
  sessionIdentifier: string
): Promise<void> {
  try {
    await getPlatformHttpClient().delete(
      AUTHENTICATION_ENDPOINTS.session(sessionIdentifier)
    );
  } catch (error) {
    throw toPlatformApiError(error, "We could not end that session.");
  }
}
