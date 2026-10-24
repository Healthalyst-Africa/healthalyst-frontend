import type {
  PlatformContextRequest,
  PlatformTokenResponse,
} from "../types/authentication";
import {
  getPlatformClient,
  getPlatformHttpClient,
} from "../../browser/http-client";
import { AUTHENTICATION_ENDPOINTS } from "../config/authentication-requests";
import { tokenResponseSchema } from "../schemas/identity";
import { UNEXPECTED_RESPONSE_MESSAGE } from "../errors/authentication-errors";
import { toPlatformApiError } from "../../browser/errors/index";

/** Switch to an organisation or branch, or to the platform realm. */
export async function switchPlatformContext(
  context: PlatformContextRequest
): Promise<PlatformTokenResponse> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      AUTHENTICATION_ENDPOINTS.context,
      context
    );
    const tokenResponse = tokenResponseSchema.safeParse(response.data);
    if (!tokenResponse.success) throw new Error(UNEXPECTED_RESPONSE_MESSAGE);
    getPlatformClient().replaceAccessCredential(tokenResponse.data);
    const { tokenType, expiresIn, activeContext } = tokenResponse.data;
    return { tokenType, expiresIn, activeContext };
  } catch (error) {
    throw toPlatformApiError(error, "We could not switch your organisation.");
  }
}
