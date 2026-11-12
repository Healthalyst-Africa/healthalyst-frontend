import { toPlatformApiError } from "@healthalyst/platform-api/api-error";
import { getPlatformHttpClient } from "@healthalyst/platform-api/http-client";
import {
  documentViewAddressSchema,
  organizationDetailSchema,
  organizationStatusChangeSchema,
  organizationListResponseSchema,
  ownerAssignmentSchema,
} from "~/features/organization-oversight/schemas/organization-schemas";
import type {
  OrganizationApplication,
  OrganizationDetail,
  OwnerAssignment,
  RegistrationStatus,
} from "~/features/organization-oversight/types/organization-types";
import {
  approvalBodySchema,
  organizationProductsResponseSchema,
} from "~/features/organization-oversight/schemas/review-decision-schemas";
import type {
  OrganizationProductsChange,
  OrganizationProductsResult,
  ReviewDecision,
} from "~/features/organization-oversight/types/review-types";
import { ORGANIZATION_API_CONFIGURATION } from "~/features/organization-oversight/config/organization-api";

export async function listOrganizationApplications(
  searchTerm = ""
): Promise<OrganizationApplication[]> {
  const normalizedSearchTerm = searchTerm.trim().toLocaleLowerCase();
  if (
    normalizedSearchTerm.length >=
    ORGANIZATION_API_CONFIGURATION.minimumServerSearchLength
  ) {
    return listOrganizationsByStatus(undefined, normalizedSearchTerm);
  }
  const organizationApplications = await listOrganizationsByStatus();
  return normalizedSearchTerm
    ? organizationApplications.filter(
        (organization) =>
          organization.legalName
            .toLocaleLowerCase()
            .includes(normalizedSearchTerm) ||
          organization.displayName
            .toLocaleLowerCase()
            .includes(normalizedSearchTerm)
      )
    : organizationApplications;
}

export async function listReviewQueue(): Promise<OrganizationApplication[]> {
  const [pendingApplications, claimedApplications] = await Promise.all([
    listOrganizationsByStatus("PENDING_VERIFICATION"),
    listOrganizationsByStatus("UNDER_REVIEW"),
  ]);
  return [...pendingApplications, ...claimedApplications];
}

export async function getOrganizationDetail(
  organizationId: string
): Promise<OrganizationDetail> {
  return runPlatformRequest(
    "We could not load this organisation's application. Try again.",
    async () => {
      const response = await getPlatformHttpClient().get<unknown>(
        `${ORGANIZATION_API_CONFIGURATION.organizationsEndpoint}/${encodeURIComponent(organizationId)}`
      );
      return organizationDetailSchema.parse(response.data);
    }
  );
}

export async function claimOrganizationApplication(
  organizationId: string
): Promise<void> {
  await postOrganizationAction(
    organizationId,
    "claim",
    undefined,
    "We could not claim this application. Refresh and try again."
  );
}

export async function releaseOrganizationApplication(
  organizationId: string
): Promise<void> {
  await postOrganizationAction(
    organizationId,
    "release",
    undefined,
    "We could not release this application. Refresh and try again."
  );
}

export async function recordReviewDecision(
  organizationId: string,
  decision: ReviewDecision
): Promise<void> {
  const action =
    decision.status === "CHANGES_REQUESTED"
      ? "request-changes"
      : decision.status === "APPROVED"
        ? "approve"
        : "reject";
  let requestBody: unknown;
  if (decision.status === "CHANGES_REQUESTED") {
    requestBody = {
      items: decision.items,
      ...(decision.message ? { message: decision.message } : {}),
    };
  } else if (decision.status === "APPROVED") {
    const approvalBody = approvalBodySchema.safeParse({
      checklist: decision.checklist,
      products: decision.products,
      ...(decision.note ? { note: decision.note } : {}),
    });
    if (!approvalBody.success) {
      throw new Error("Check the approval checklist and selected products.");
    }
    requestBody = approvalBody.data;
  } else {
    requestBody = {
      reasonCode: decision.reasonCode,
      message: decision.message,
    };
  }
  await postOrganizationAction(
    organizationId,
    action,
    requestBody,
    "We could not save the review decision. Refresh and try again.",
    decision.version
  );
}

export async function getOrganizationDocumentViewAddress(
  organizationId: string,
  documentId: string
): Promise<{ url: string; expiresIn: number }> {
  return runPlatformRequest(
    "We could not open this document. Try again.",
    async () => {
      const response = await getPlatformHttpClient().get<unknown>(
        `${ORGANIZATION_API_CONFIGURATION.organizationsEndpoint}/${encodeURIComponent(organizationId)}/documents/${encodeURIComponent(documentId)}/url`
      );
      return documentViewAddressSchema.parse(response.data);
    }
  );
}

export async function addOrganizationInternalNote(
  organizationId: string,
  note: string
): Promise<void> {
  await postOrganizationAction(
    organizationId,
    "notes",
    { note },
    "We could not save the internal note. Try again."
  );
}

export async function suspendOrganization(
  organizationId: string,
  reason: string,
  version: number
): Promise<void> {
  await postOrganizationAction(
    organizationId,
    "suspend",
    { reason },
    "We could not suspend this organisation. Try again.",
    version
  );
}

export async function reinstateOrganization(
  organizationId: string,
  reason: string,
  version: number
): Promise<void> {
  await postOrganizationAction(
    organizationId,
    "reinstate",
    { reason },
    "We could not reinstate this organisation. Try again.",
    version
  );
}

export async function deactivateOrganization(
  organizationId: string,
  reason: string,
  version: number
): Promise<void> {
  await postOrganizationAction(
    organizationId,
    "deactivate",
    { reason },
    "We could not deactivate this organisation. Try again.",
    version
  );
}

/**
 * Support-assisted recovery: makes an active member an owner when no owner
 * can be reached. Existing owners keep their role.
 */
export async function assignOrganizationOwner(
  organizationId: string,
  assignment: { userId: string; reason: string }
): Promise<OwnerAssignment> {
  return runPlatformRequest(
    "We could not assign the owner. Try again.",
    async () => {
      const response = await getPlatformHttpClient().post<unknown>(
        `${ORGANIZATION_API_CONFIGURATION.organizationsEndpoint}/${encodeURIComponent(organizationId)}/assign-owner`,
        assignment
      );
      return ownerAssignmentSchema.parse(response.data);
    }
  );
}

/**
 * Sets the products an approved organisation uses. New ones start; ones left
 * out are paused with their data kept, and listing them again restarts them.
 */
export async function setOrganizationProducts(
  organizationId: string,
  change: OrganizationProductsChange
): Promise<OrganizationProductsResult> {
  return runPlatformRequest(
    "We could not change this organisation's products. Try again.",
    async () => {
      const response = await getPlatformHttpClient().put<unknown>(
        `${ORGANIZATION_API_CONFIGURATION.organizationsEndpoint}/${encodeURIComponent(organizationId)}/products`,
        change
      );
      return organizationProductsResponseSchema.parse(response.data);
    }
  );
}

async function postOrganizationAction(
  organizationId: string,
  action: string,
  requestBody: unknown,
  fallbackMessage: string,
  version?: number
): Promise<void> {
  await runPlatformRequest(fallbackMessage, async () => {
    const response = await getPlatformHttpClient().post<unknown>(
      `${ORGANIZATION_API_CONFIGURATION.organizationsEndpoint}/${encodeURIComponent(organizationId)}/${action}`,
      requestBody,
      {
        headers: {
          ...(version === undefined ? {} : { "If-Match": `"${version}"` }),
        },
      }
    );
    if (response.status !== 204) {
      organizationStatusChangeSchema.parse(response.data);
    }
  });
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

async function listOrganizationsByStatus(
  status?: RegistrationStatus,
  searchTerm?: string
): Promise<OrganizationApplication[]> {
  return runPlatformRequest(
    status === "PENDING_VERIFICATION" || status === "UNDER_REVIEW"
      ? "We could not load the review queue. Try again."
      : "We could not load organisations. Try again.",
    async () => {
      const organizationApplications: OrganizationApplication[] = [];
      const seenCursors = new Set<string>();
      let cursor: string | undefined;
      let hasMore = true;
      while (hasMore) {
        const response = await getPlatformHttpClient().get<unknown>(
          ORGANIZATION_API_CONFIGURATION.organizationsEndpoint,
          {
            params: {
              limit: ORGANIZATION_API_CONFIGURATION.pageSize,
              ...(status ? { status } : {}),
              ...(searchTerm ? { q: searchTerm } : {}),
              ...(cursor ? { cursor } : {}),
            },
          }
        );
        const page = organizationListResponseSchema.parse(response.data);
        organizationApplications.push(...page.data);
        hasMore = page.page.hasMore;
        if (!hasMore || !page.page.nextCursor) break;
        if (seenCursors.has(page.page.nextCursor)) {
          throw new Error("The organisation list returned a repeated cursor.");
        }
        seenCursors.add(page.page.nextCursor);
        cursor = page.page.nextCursor;
      }
      return organizationApplications;
    }
  );
}
