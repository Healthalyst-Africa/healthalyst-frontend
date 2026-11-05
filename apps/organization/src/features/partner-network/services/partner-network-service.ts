import type { z } from "zod";
import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { PUBLIC_PLATFORM_REQUEST } from "@healthalyst/platform-api/config";
import { getPlatformHttpClient } from "@healthalyst/platform-api/http-client";
import {
  DATA_SHARING_AGREEMENT_VERSION,
  PARTNER_ENDPOINTS,
  UNEXPECTED_PARTNER_RESPONSE,
} from "~/features/partner-network/config/partner-network";
import {
  directoryResponseSchema,
  partnerInvitationListSchema,
  partnerInvitationPreviewSchema,
  partnerInvitationSchema,
  partnershipListSchema,
  partnershipSchema,
} from "~/features/partner-network/schemas/partner-network-schemas";
import type {
  DirectoryEntry,
  DirectorySearch,
  NewPartnerInvitation,
  PartnerInvitation,
  PartnerInvitationPreview,
  Partnership,
  PartnershipAction,
  PartnershipRequest,
} from "~/features/partner-network/types/partner-network";

function parseResponse<Schema extends z.ZodType>(
  schema: Schema,
  data: unknown
): z.output<Schema> {
  const result = schema.safeParse(data);
  if (!result.success) throw new Error(UNEXPECTED_PARTNER_RESPONSE);
  return result.data;
}

async function runPlatformRequest<ResponseType>(
  fallbackMessage: string,
  request: () => Promise<ResponseType>
): Promise<ResponseType> {
  try {
    return await request();
  } catch (error) {
    throw toPlatformApiError(error, fallbackMessage);
  }
}

export function listPartnerships(): Promise<Partnership[]> {
  return runPlatformRequest(
    "We could not load your partners. Try again.",
    async () => {
      const response = await getPlatformHttpClient().get<unknown>(
        PARTNER_ENDPOINTS.partnerships
      );
      return parseResponse(partnershipListSchema, response.data).data;
    }
  );
}

export function searchPartnerDirectory(
  search: DirectorySearch
): Promise<DirectoryEntry[]> {
  return runPlatformRequest(
    "We could not search the directory. Try again.",
    async () => {
      const response = await getPlatformHttpClient().get<unknown>(
        PARTNER_ENDPOINTS.directory,
        {
          params: {
            ...(search.category ? { category: search.category } : {}),
            ...(search.stateCode ? { stateCode: search.stateCode } : {}),
            ...(search.searchText ? { q: search.searchText } : {}),
          },
        }
      );
      return parseResponse(directoryResponseSchema, response.data).data;
    }
  );
}

export function requestPartnership(
  request: PartnershipRequest
): Promise<Partnership> {
  return runPlatformRequest(
    "We could not send the partnership request. Try again.",
    async () => {
      const response = await getPlatformHttpClient().post<unknown>(
        PARTNER_ENDPOINTS.partnerships,
        request
      );
      return parseResponse(partnershipSchema, response.data);
    }
  );
}

export function updatePartnershipPreference(
  partnershipId: string,
  preference: { isPreferred: boolean; priority: number }
): Promise<Partnership> {
  return runPlatformRequest(
    "We could not save your preference. Try again.",
    async () => {
      const response = await getPlatformHttpClient().patch<unknown>(
        PARTNER_ENDPOINTS.partnership(partnershipId),
        preference
      );
      return parseResponse(partnershipSchema, response.data);
    }
  );
}

export function changePartnership(
  partnershipId: string,
  action: PartnershipAction
): Promise<Partnership> {
  return runPlatformRequest(
    "We could not update this partnership. Refresh and try again.",
    async () => {
      const response = await getPlatformHttpClient().post<unknown>(
        PARTNER_ENDPOINTS.partnershipAction(partnershipId, action.kind),
        action.kind === "accept"
          ? { dsaVersion: DATA_SHARING_AGREEMENT_VERSION }
          : action.reason
            ? { reason: action.reason }
            : {}
      );
      return parseResponse(partnershipSchema, response.data);
    }
  );
}

export function listPartnerInvitations(): Promise<PartnerInvitation[]> {
  return runPlatformRequest(
    "We could not load your partner invitations. Try again.",
    async () => {
      const response = await getPlatformHttpClient().get<unknown>(
        PARTNER_ENDPOINTS.invitations
      );
      return parseResponse(partnerInvitationListSchema, response.data).data;
    }
  );
}

export function invitePartner(
  invitation: NewPartnerInvitation
): Promise<PartnerInvitation> {
  return runPlatformRequest(
    "We could not send the invitation. Try again.",
    async () => {
      const response = await getPlatformHttpClient().post<unknown>(
        PARTNER_ENDPOINTS.invitations,
        invitation
      );
      return parseResponse(partnerInvitationSchema, response.data);
    }
  );
}

export function getPartnerInvitationPreview(
  invitationToken: string
): Promise<PartnerInvitationPreview> {
  return runPlatformRequest(
    "We could not open this invitation. Try again.",
    async () => {
      const response = await getPlatformHttpClient().get<unknown>(
        PARTNER_ENDPOINTS.invitationPreview(invitationToken),
        PUBLIC_PLATFORM_REQUEST
      );
      return parseResponse(partnerInvitationPreviewSchema, response.data);
    }
  );
}

/** Creates the partnership request from an invitation, to accept afterwards. */
export function acceptPartnerInvitation(
  invitationToken: string
): Promise<Partnership> {
  return runPlatformRequest(
    "We could not accept this invitation. Try again.",
    async () => {
      const response = await getPlatformHttpClient().post<unknown>(
        PARTNER_ENDPOINTS.acceptInvitation(invitationToken)
      );
      return parseResponse(partnershipSchema, response.data);
    }
  );
}
