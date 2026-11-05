import { PUBLIC_PLATFORM_REQUEST } from "@healthalyst/platform-api/config";
import { getPlatformHttpClient } from "@healthalyst/platform-api/http-client";
import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import {
  getInvitationEndpoint,
  UNEXPECTED_INVITATION_RESPONSE,
} from "~/features/invitation-acceptance/config/invitation-acceptance";
import {
  invitationAcceptanceSchema,
  invitationPreviewSchema,
  type InvitationAcceptance,
  type InvitationPreview,
} from "~/features/invitation-acceptance/schemas/invitation-acceptance-schemas";

/** Who invited the person and where, without signing in. */
export async function getInvitationPreview(
  invitationToken: string
): Promise<InvitationPreview> {
  try {
    const response = await getPlatformHttpClient().get<unknown>(
      getInvitationEndpoint(invitationToken),
      PUBLIC_PLATFORM_REQUEST
    );
    const preview = invitationPreviewSchema.safeParse(response.data);
    if (!preview.success) throw new Error(UNEXPECTED_INVITATION_RESPONSE);
    return preview.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not open this invitation.");
  }
}

/**
 * Accept as a new person by choosing a password, or as the signed-in person
 * when no password is given. The Platform API decides which applies.
 */
export async function acceptInvitation(
  invitationToken: string,
  password?: string
): Promise<InvitationAcceptance> {
  try {
    const response = await getPlatformHttpClient().post<unknown>(
      `${getInvitationEndpoint(invitationToken)}/accept`,
      password === undefined ? undefined : { password },
      password === undefined ? undefined : PUBLIC_PLATFORM_REQUEST
    );
    const acceptance = invitationAcceptanceSchema.safeParse(response.data);
    if (!acceptance.success) throw new Error(UNEXPECTED_INVITATION_RESPONSE);
    return acceptance.data;
  } catch (error) {
    throw toPlatformApiError(error, "We could not accept this invitation.");
  }
}
